import fs from "node:fs";
import path from "node:path";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
import { envelope, failure, finding } from "../cli/result.js";
import { commit, fromStorageError, loadErrorResult, openProject } from "../project/entities.js";
import { ID_PATTERN, allocateId, uniqueFilename } from "../project/identity.js";
import { danglingReferenceDiagnostics } from "../project/references.js";
import { validateRecord } from "../project/schema.js";
import { parseFrontmatter, replaceFrontmatter, stringifyFrontmatter } from "../storage/document.js";
import { sourceHash } from "../storage/hash.js";
import { factEntries, resolveState, summarizeFact } from "../state/facts.js";
import { validateFact } from "../state/predicates.js";

const NEW_STATUSES = new Set(["proposed", "established"]);
const RETRACTABLE = new Set(["proposed", "established"]);

function invalid(command, message) {
  return failure(command, message, "INVALID_INVOCATION", 2);
}

function findingsResult(command, diagnostics, exitCode) {
  return {
    envelope: envelope({ command, ok: false, diagnostics }),
    exitCode,
    text: `${diagnostics.map((item) => item.message).join("\n")}\n`
  };
}

function readData(command, cwd, dataPath) {
  let raw;
  try {
    raw = fs.readFileSync(path.resolve(cwd, String(dataPath)), "utf8");
  } catch (error) {
    return { error: invalid(command, `Cannot read --data ${dataPath}: ${error.message}`) };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return { error: invalid(command, `--data ${dataPath} is not JSON: ${error.message}`) };
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { error: invalid(command, `--data ${dataPath} must hold one JSON object`) };
  }
  return { data };
}

// Sources without a hash are recorded against the current bytes the agent
// just inspected. A supplied hash must still match; otherwise the evidence
// changed after it was read.
function hashSources(command, root, record) {
  if (!Array.isArray(record.sources)) return null;
  for (const source of record.sources) {
    if (!source || typeof source !== "object" || typeof source.path !== "string") continue;
    let current;
    try {
      current = sourceHash(root, { path: source.path, sceneId: source.scene, beatId: source.beat });
    } catch (error) {
      return failure(command, `Source ${source.path} cannot be read: ${error.message}`, "SOURCE_UNREADABLE", 1, [record.id]);
    }
    if (source.hash === undefined) source.hash = current;
    else if (source.hash !== current) {
      return failure(command, `Source ${source.path} no longer matches the supplied hash`, "STALE_SOURCE", 3, [record.id]);
    }
  }
  return null;
}

/**
 * `fact add --data <json-file>`: validates the record against the fact
 * schema, the predicate catalog, and the shared reference index, then creates
 * it through the transaction layer. Nothing is written when any check fails.
 */
export function addFact(root, options = {}) {
  const command = "fact add";
  if (options.dataPath === undefined) return invalid(command, "Usage: story fact add --data <json-file>");
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const blocked = loadErrorResult(command, project);
  if (blocked) return blocked;
  const read = readData(command, options.cwd ?? process.cwd(), options.dataPath);
  if (read.error) return read.error;

  const record = { format: FORMAT, "schema-version": SCHEMA_VERSION, id: read.data.id, type: "fact", ...read.data };
  if (record.type !== "fact") return invalid(command, "fact add creates records of type fact");
  if (record.id === undefined) record.id = allocateId("fact", new Set(project.records.keys()));
  if (typeof record.id !== "string" || !ID_PATTERN.test(record.id)) return invalid(command, `Invalid id: ${record.id}`);
  if (project.records.has(record.id)) {
    return failure(command, `Record id ${record.id} is already used`, "DUPLICATE_RECORD_ID", 1, [record.id]);
  }
  if (!NEW_STATUSES.has(record.status)) {
    return invalid(command, "A new fact is proposed or established; use fact retract to retire one");
  }
  const staleOrMissing = hashSources(command, root, record);
  if (staleOrMissing) return staleOrMissing;
  const schema = validateRecord(record);
  if (schema.length > 0) return findingsResult(command, schema, 2);

  const taken = new Set(fs.existsSync(path.join(root, "facts")) ? fs.readdirSync(path.join(root, "facts")) : []);
  const relative = `facts/${uniqueFilename(record.id, record.id, taken)}`;
  const entry = { id: record.id, type: "fact", path: relative, record, body: "", valid: true };
  const withFact = { records: new Map([...project.records, [record.id, entry]]), unindexed: project.unindexed };
  const errors = [
    ...validateFact(withFact, entry),
    ...danglingReferenceDiagnostics(withFact).filter((item) => item.recordIds[1] === record.id)
  ];
  if (errors.length > 0) return findingsResult(command, errors, 1);

  const warnings = [];
  if (record.status === "established" && (record.sources ?? []).length === 0) {
    warnings.push(finding({
      code: "MISSING_PROVENANCE",
      severity: "warning",
      message: `${relative}: fact ${record.id} has no sources, so state queries report it as unresolved`,
      recordIds: [record.id],
      action: "Add a SourceRef with the exact source span."
    }));
  }
  const writes = [{ path: relative, action: "create", expectedHash: null, content: stringifyFrontmatter(record) }];
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: true,
        data: { ...summarizeFact(entry), dryRun: options.dryRun === true },
        diagnostics: warnings,
        writes: recorded
      }),
      exitCode: 0,
      text: options.dryRun === true ? "" : `Added fact ${record.id}: ${relative}\n`,
      log: warnings.map((item) => `warning ${item.code}: ${item.message}\n`).join("")
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}

// Fact records under work/ are experiments. They are listed only on request
// and never apply at a cursor.
function workFacts(root) {
  const found = [];
  const walk = (relative) => {
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, relative), { withFileTypes: true });
    } catch {
      return;
    }
    for (const item of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const child = `${relative}/${item.name}`;
      if (item.isDirectory()) walk(child);
      else if (item.isFile() && item.name.endsWith(".md")) {
        let data;
        try {
          data = parseFrontmatter(fs.readFileSync(path.join(root, child), "utf8"), child).data;
        } catch {
          continue;
        }
        if (data?.type === "fact" && typeof data.id === "string") {
          found.push({ id: data.id, type: "fact", path: child, record: data });
        }
      }
    }
  };
  walk("work");
  return found;
}

function describeFact(item) {
  const head = `- ${item.id} [${item.status} ${item.kind}] ${item.subject} ${item.predicate} ${item.value}`;
  if (item.applies === undefined) return item.active ? head : `${head} (inactive)`;
  if (item.applies === "unresolved") return `${head} (applies: unresolved, ${item.reason})`;
  return `${head} (applies: ${item.applies ? "yes" : "no"})`;
}

function listText(data, diagnostics) {
  const where = data.cursor === null
    ? "Facts:"
    : `Facts at ${data.cursor.sceneId}${data.cursor.beatId ? ` ${data.cursor.beatId}` : ""} (${data.cursor.side}):`;
  const lines = [where];
  if (data.facts.length === 0) lines.push("- None");
  for (const item of data.facts) lines.push(describeFact(item));
  if (data.conflicts.length > 0) {
    lines.push("", "Conflicts:");
    for (const item of data.conflicts) {
      lines.push(`- ${item.subject} ${item.predicate}: ${item.values.join(", ")} (${item.factIds.join(", ")})`);
    }
  }
  if (diagnostics.length > 0) {
    lines.push("", "Diagnostics:");
    for (const item of diagnostics) lines.push(`- ${item.severity} ${item.code}: ${item.message}`);
  }
  return `${lines.join("\n")}\n`;
}

/**
 * `fact list`: established facts by default. Inactive lifecycle states and
 * work/ records appear only when requested, and a scene cursor never makes
 * them apply.
 */
export function listFacts(root, options = {}) {
  const command = "fact list";
  if (options.cursor === undefined && (options.beatId !== undefined || options.side !== undefined)) {
    return invalid(command, "--beat and --side need --scene");
  }
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const listed = factEntries(project)
    .filter((entry) => options.includeInactive === true || entry.record.status === "established")
    .map((entry) => ({ ...summarizeFact(entry), active: entry.record.status === "established", location: "facts" }));
  if (options.includeWork === true) {
    for (const entry of workFacts(root)) listed.push({ ...summarizeFact(entry), active: false, location: "work" });
  }

  let conflicts = [];
  let diagnostics = [];
  const cursor = options.cursor ?? null;
  if (cursor !== null) {
    const state = resolveState(project, cursor);
    const applying = new Set(state.facts.map((item) => item.id));
    const pending = new Map(state.unresolved.map((item) => [item.id, item]));
    for (const item of listed) {
      if (item.location === "facts" && applying.has(item.id)) item.applies = true;
      else if (item.location === "facts" && pending.has(item.id)) {
        item.applies = "unresolved";
        item.reason = pending.get(item.id).reason;
      } else item.applies = false;
    }
    conflicts = state.conflicts;
    diagnostics = state.diagnostics;
  }
  const ok = !diagnostics.some((item) => item.severity === "error");
  const data = { cursor, facts: listed, conflicts };
  return {
    envelope: envelope({ command, ok, data, diagnostics }),
    exitCode: ok ? 0 : 1,
    text: listText(data, diagnostics)
  };
}

/**
 * `fact retract <id>`: moves a proposed or established fact to retracted
 * through a hash-checked replacement. The record stays as an audit trail.
 */
export function retractFact(root, id, options = {}) {
  const command = "fact retract";
  if (!id) return invalid(command, "Usage: story fact retract <id>");
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const blocked = loadErrorResult(command, project);
  if (blocked) return blocked;
  const entry = project.records.get(id);
  if (!entry || entry.type !== "fact") return failure(command, `No fact with id ${id}`, "FACT_NOT_FOUND", 1, [id]);
  const from = entry.record.status;
  if (!RETRACTABLE.has(from)) {
    return failure(command, `Fact ${id} is ${from}; only proposed or established facts can be retracted`, "FACT_TRANSITION_INVALID", 1, [id]);
  }
  const markdown = fs.readFileSync(path.join(root, entry.path), "utf8");
  const parsed = parseFrontmatter(markdown, entry.path);
  const content = replaceFrontmatter(markdown, { ...parsed.data, status: "retracted" });
  const relative = entry.path.split(path.sep).join("/");
  const writes = [{ path: relative, action: "replace", expectedHash: entry.hash, content }];
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: true,
        data: { id, path: relative, from, to: "retracted", dryRun: options.dryRun === true },
        writes: recorded
      }),
      exitCode: 0,
      text: options.dryRun === true ? "" : `Retracted fact ${id}: ${relative}\n`
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}
