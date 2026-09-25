import fs from "node:fs";
import path from "node:path";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
import { envelope, failure, finding } from "../cli/result.js";
import { loadErrorResult, openProject } from "../project/entities.js";
import { ID_PATTERN, allocateId, uniqueFilename } from "../project/identity.js";
import { danglingReferenceDiagnostics } from "../project/references.js";
import { validateRecord } from "../project/schema.js";
import { parseFrontmatter, replaceFrontmatter, stringifyFrontmatter } from "../storage/document.js";
import { findingsResult, invalid, readData, takenNames, writeResult } from "./common.js";

const byId = (left, right) => left.id.localeCompare(right.id, "en");

function list(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

/** Decision records, ordered by id. */
export function decisionEntries(project) {
  return [...project.records.values()].filter((entry) => entry.type === "decision").sort(byId);
}

function projectId(project) {
  return [...project.records.values()].find((entry) => entry.type === "project")?.id;
}

function successors(entries) {
  const found = new Map();
  for (const entry of entries) {
    for (const prior of list(entry.record.supersedes)) {
      if (!found.has(prior)) found.set(prior, []);
      found.get(prior).push(entry.id);
    }
  }
  return found;
}

function summarize(entry, supersededBy) {
  const record = entry.record;
  return {
    id: entry.id,
    status: record.status,
    instruction: record.status === "accepted",
    scopeIds: list(record["scope-ids"]),
    rationale: record.rationale ?? null,
    source: record.source ?? null,
    supersedes: list(record.supersedes),
    supersededBy: supersededBy.get(entry.id) ?? [],
    path: entry.path.split("\\").join("/")
  };
}

/**
 * Every decision with its supersession links in both directions. Only an
 * accepted decision is an instruction; proposed, rejected and superseded
 * decisions keep their rationale as history.
 */
export function summarizeDecisions(project) {
  const entries = decisionEntries(project);
  const supersededBy = successors(entries);
  return entries.map((entry) => summarize(entry, supersededBy));
}

/**
 * Decisions that bear on any of `ids`. A decision scoped to the project id
 * applies everywhere. Accepted decisions are instructions; proposed ones are
 * returned apart so a caller never treats them as settled.
 */
export function decisionsFor(project, ids) {
  const wanted = new Set(ids);
  const root = projectId(project);
  if (root !== undefined) wanted.add(root);
  const inScope = summarizeDecisions(project).filter((item) => item.scopeIds.some((id) => wanted.has(id)));
  return {
    instructions: inScope.filter((item) => item.status === "accepted"),
    proposed: inScope.filter((item) => item.status === "proposed")
  };
}

// Strongly connected components of the supersedes graph (Tarjan). A
// component with more than one decision, or a decision that supersedes
// itself, is a cycle.
function cycles(entries) {
  const edges = new Map(entries.map((entry) => [entry.id, list(entry.record.supersedes)]));
  const index = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const found = [];
  let counter = 0;
  const visit = (id) => {
    index.set(id, counter);
    low.set(id, counter);
    counter += 1;
    stack.push(id);
    onStack.add(id);
    for (const next of edges.get(id)) {
      if (!edges.has(next)) continue;
      if (!index.has(next)) {
        visit(next);
        low.set(id, Math.min(low.get(id), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(id, Math.min(low.get(id), index.get(next)));
      }
    }
    if (low.get(id) !== index.get(id)) return;
    const component = [];
    let member;
    do {
      member = stack.pop();
      onStack.delete(member);
      component.push(member);
    } while (member !== id);
    if (component.length > 1 || edges.get(id).includes(id)) found.push(component.sort());
  };
  for (const entry of entries) if (!index.has(entry.id)) visit(entry.id);
  return found.sort((left, right) => left[0].localeCompare(right[0], "en"));
}

/**
 * Structural problems in the decision graph: supersession cycles and
 * supersedes links that name a record that is not a decision. Missing
 * targets are DANGLING_REFERENCE findings from the shared reference index.
 */
export function decisionFindings(project) {
  const entries = decisionEntries(project);
  const findings = cycles(entries).map((component) => finding({
    code: "SUPERSESSION_CYCLE",
    message: `Decisions supersede each other in a cycle: ${component.join(" -> ")}`,
    recordIds: component,
    action: "Edit supersedes so each decision replaces only earlier decisions."
  }));
  for (const entry of entries) {
    for (const target of list(entry.record.supersedes)) {
      const other = project.records.get(target);
      if (other && other.type !== "decision") {
        findings.push(finding({
          code: "SUPERSEDES_NOT_DECISION",
          message: `${entry.path}: supersedes ${target}, which is a ${other.type}, not a decision`,
          recordIds: [entry.id, target],
          action: "A decision can supersede only another decision."
        }));
      }
    }
  }
  return findings;
}

// Commands: `decision add|list|supersede`.

const NEW_STATUSES = new Set(["proposed", "accepted", "rejected"]);
const SUPERSEDABLE = new Set(["proposed", "accepted"]);
const ACTIVE = new Set(["proposed", "accepted"]);

function newRecord(project, data, defaults) {
  const record = { format: FORMAT, "schema-version": SCHEMA_VERSION, id: data.id, type: "decision", ...defaults, ...data };
  if (record.id === undefined) record.id = allocateId("decision", new Set(project.records.keys()));
  return record;
}

function recordProblem(command, project, record) {
  if (record.type !== "decision") return invalid(command, `${command} creates records of type decision`);
  if (typeof record.id !== "string" || !ID_PATTERN.test(record.id)) return invalid(command, `Invalid id: ${record.id}`);
  if (project.records.has(record.id)) {
    return failure(command, `Record id ${record.id} is already used`, "DUPLICATE_RECORD_ID", 1, [record.id]);
  }
  return null;
}

function schemaProblem(command, record) {
  const schema = validateRecord(record);
  return schema.length > 0 ? findingsResult(command, schema, 2) : null;
}

function withEntries(project, entries) {
  const records = new Map(project.records);
  for (const entry of entries) records.set(entry.id, entry);
  return { root: project.root, records, unindexed: project.unindexed };
}

function newEntry(root, record) {
  const relative = `decisions/${uniqueFilename(record.id, record.id, takenNames(root, "decisions"))}`;
  return { id: record.id, type: "decision", path: relative, record, body: "", valid: true };
}

function ownDangling(project, id) {
  return danglingReferenceDiagnostics(project).filter((item) => item.recordIds[1] === id);
}

/**
 * `decision add --data <json-file>`: records a proposed, accepted, or
 * rejected decision scoped to at least one project, record, or scene id.
 * Replacing a decision is `decision supersede`, never a hand-written link.
 */
export function addDecision(root, options = {}) {
  const command = "decision add";
  if (options.dataPath === undefined) return invalid(command, "Usage: story decision add --data <json-file>");
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const blocked = loadErrorResult(command, project);
  if (blocked) return blocked;
  const read = readData(command, options.cwd ?? process.cwd(), options.dataPath);
  if (read.error) return read.error;
  const record = newRecord(project, read.data, {});
  const problem = recordProblem(command, project, record);
  if (problem) return problem;
  if (!NEW_STATUSES.has(record.status)) {
    return invalid(command, "A new decision is proposed, accepted, or rejected; use decision supersede to replace one");
  }
  if (record.supersedes !== undefined) {
    return invalid(command, "Use story decision supersede <id> to replace a decision; decision add does not write supersedes");
  }
  if (!Array.isArray(record["scope-ids"]) || record["scope-ids"].length === 0) {
    return invalid(command, "A decision needs scope-ids: the project id, record ids, or scene ids it applies to");
  }
  const schema = schemaProblem(command, record);
  if (schema) return schema;
  const entry = newEntry(root, record);
  const dangling = ownDangling(withEntries(project, [entry]), record.id);
  if (dangling.length > 0) return findingsResult(command, dangling, 1);
  const writes = [{ path: entry.path, action: "create", expectedHash: null, content: stringifyFrontmatter(record) }];
  return writeResult(command, root, writes, options, {
    data: summarize(entry, new Map()),
    text: `Added decision ${record.id}: ${entry.path}\n`
  });
}

function describeDecision(item) {
  const note = item.status === "proposed" ? ", not an instruction" : "";
  let line = `- ${item.id} [${item.status}${note}] scope ${item.scopeIds.join(", ")}`;
  if (item.rationale !== null) line += `: ${item.rationale}`;
  if (item.source !== null) line += ` (source: ${item.source})`;
  if (item.supersedes.length > 0) line += ` (supersedes ${item.supersedes.join(", ")})`;
  if (item.supersededBy.length > 0) line += ` (superseded by ${item.supersededBy.join(", ")})`;
  return line;
}

/**
 * `decision list`: proposed and accepted decisions, with rejected and
 * superseded ones on request. `--record` keeps decisions scoped to that
 * record or to the whole project.
 */
export function listDecisions(root, options = {}) {
  const command = "decision list";
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const record = options.record ?? null;
  if (record !== null && !project.records.has(record)) {
    return failure(command, `No record with id ${record}`, "RECORD_NOT_FOUND", 1, [record]);
  }
  const scope = new Set(record === null ? [] : [record, projectId(project)]);
  const decisions = summarizeDecisions(project)
    .filter((item) => options.includeInactive === true || ACTIVE.has(item.status))
    .filter((item) => record === null || item.scopeIds.some((id) => scope.has(id)));
  const diagnostics = decisionFindings(project);
  const ok = !diagnostics.some((item) => item.severity === "error");
  const lines = [record === null ? "Decisions:" : `Decisions for ${record}:`];
  if (decisions.length === 0) lines.push("- None");
  for (const item of decisions) lines.push(describeDecision(item));
  if (diagnostics.length > 0) {
    lines.push("", "Diagnostics:");
    for (const item of diagnostics) lines.push(`- ${item.severity} ${item.code}: ${item.message}`);
  }
  return {
    envelope: envelope({ command, ok, data: { record, decisions }, diagnostics }),
    exitCode: ok ? 0 : 1,
    text: `${lines.join("\n")}\n`
  };
}

/**
 * `decision supersede <id> --data <json-file>`: creates an accepted successor
 * that supersedes `<id>` and marks `<id>` superseded, in one transaction. The
 * successor inherits the prior scope unless the data names its own.
 */
export function supersedeDecision(root, id, options = {}) {
  const command = "decision supersede";
  if (!id || options.dataPath === undefined) return invalid(command, "Usage: story decision supersede <id> --data <json-file>");
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const blocked = loadErrorResult(command, project);
  if (blocked) return blocked;
  const prior = project.records.get(id);
  if (!prior || prior.type !== "decision") return failure(command, `No decision with id ${id}`, "DECISION_NOT_FOUND", 1, [id]);
  const from = prior.record.status;
  if (!SUPERSEDABLE.has(from)) {
    return failure(command, `Decision ${id} is ${from}; only proposed or accepted decisions can be superseded`, "DECISION_TRANSITION_INVALID", 1, [id]);
  }
  const read = readData(command, options.cwd ?? process.cwd(), options.dataPath);
  if (read.error) return read.error;
  const supplied = read.data.supersedes;
  if (supplied !== undefined && !(Array.isArray(supplied) && supplied.length === 1 && supplied[0] === id)) {
    return invalid(command, `A successor supersedes exactly ${id}; leave supersedes out of --data`);
  }
  const record = newRecord(project, read.data, { status: "accepted", "scope-ids": prior.record["scope-ids"] });
  record.supersedes = [id];
  const problem = recordProblem(command, project, record);
  if (problem) return problem;
  if (record.status !== "accepted") {
    return invalid(command, "A successor is accepted. Record an alternative that is only proposed with decision add");
  }
  const schema = schemaProblem(command, record);
  if (schema) return schema;

  const entry = newEntry(root, record);
  const priorRecord = { ...prior.record, status: "superseded" };
  const after = withEntries(project, [entry, { ...prior, record: priorRecord }]);
  const problems = [
    ...ownDangling(after, record.id),
    ...decisionFindings(after).filter((item) => item.code === "SUPERSESSION_CYCLE" && item.recordIds.includes(record.id))
  ];
  if (problems.length > 0) return findingsResult(command, problems, 1);

  const priorPath = prior.path.split(path.sep).join("/");
  const markdown = fs.readFileSync(path.join(root, prior.path), "utf8");
  const writes = [
    { path: entry.path, action: "create", expectedHash: null, content: stringifyFrontmatter(record) },
    { path: priorPath, action: "replace", expectedHash: prior.hash, content: replaceFrontmatter(markdown, { ...parseFrontmatter(markdown, prior.path).data, status: "superseded" }) }
  ];
  return writeResult(command, root, writes, options, {
    data: {
      prior: { id, path: priorPath, from, to: "superseded" },
      successor: summarize(entry, new Map())
    },
    text: `Superseded decision ${id} with ${record.id}\n`
  });
}
