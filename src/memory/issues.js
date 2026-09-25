import fs from "node:fs";
import path from "node:path";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
import { envelope, failure, finding } from "../cli/result.js";
import { loadErrorResult, openProject } from "../project/entities.js";
import { ID_PATTERN, allocateId, uniqueFilename } from "../project/identity.js";
import { danglingReferenceDiagnostics } from "../project/references.js";
import { validateRecord } from "../project/schema.js";
import { parseFrontmatter, replaceFrontmatter, stringifyFrontmatter } from "../storage/document.js";
import { sourceHash } from "../storage/hash.js";
import { findingsResult, hashRefs, invalid, readData, takenNames, writeResult } from "./common.js";

const byId = (left, right) => left.id.localeCompare(right.id, "en");

function list(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function evidenceList(record) {
  return Array.isArray(record.evidence)
    ? record.evidence.filter((item) => item && typeof item === "object" && typeof item.path === "string")
    : [];
}

/** Issue records, ordered by id. */
export function issueEntries(project) {
  return [...project.records.values()].filter((entry) => entry.type === "issue").sort(byId);
}

function currentHash(root, ref) {
  try {
    return sourceHash(root, { path: ref.path, sceneId: ref.scene, beatId: ref.beat });
  } catch {
    return null;
  }
}

// Evidence whose current bytes no longer match the recorded fingerprint. An
// unreadable source has no current hash and counts as changed.
function changedEvidence(root, record) {
  const changed = [];
  for (const ref of evidenceList(record)) {
    const current = currentHash(root, ref);
    if (current === ref.hash) continue;
    const item = { path: ref.path };
    if (ref.scene !== undefined) item.scene = ref.scene;
    if (ref.beat !== undefined) item.beat = ref.beat;
    item.recorded = ref.hash;
    item.current = current;
    changed.push(item);
  }
  return changed;
}

/**
 * Why a dismissal cannot be matched exactly, or null when it is bound. A
 * dismissal names one exact diagnostic code, the issue names the affected
 * ids, and the evidence fingerprints decide when the dismissal expires.
 */
function unboundReason(record) {
  const dismissal = record.dismissal;
  if (!dismissal || typeof dismissal !== "object") return "has no dismissal record";
  if (typeof dismissal.code !== "string" || dismissal.code === "") return "does not name an exact diagnostic code";
  const affected = list(record["affected-ids"]);
  if (affected.length === 0) return "has no affected ids";
  if (evidenceList(record).length === 0) return "has no evidence fingerprints";
  const recordId = dismissal["record-id"];
  if (recordId !== undefined && !affected.includes(recordId)) return `names record ${recordId}, which is not an affected id`;
  return null;
}

/**
 * Issues with their effective status. A dismissed issue whose evidence
 * changed is open again for review; `reopened` carries the prior disposition
 * so the earlier judgment stays visible. Open and resolved issues keep their
 * stored status and report changed evidence for information.
 */
export function refreshIssueEvidence(project) {
  return issueEntries(project).map((entry) => {
    const record = entry.record;
    const changed = changedEvidence(project.root, record);
    const reopen = record.status === "dismissed" && changed.length > 0;
    return {
      id: entry.id,
      status: reopen ? "open" : record.status,
      storedStatus: record.status,
      category: record.category,
      severity: record.severity,
      affectedIds: list(record["affected-ids"]),
      evidence: evidenceList(record),
      dismissal: record.dismissal ?? null,
      changedEvidence: changed,
      reopened: reopen ? { from: "dismissed", dismissal: record.dismissal ?? null } : null,
      bound: record.status !== "dismissed" || unboundReason(record) === null,
      path: entry.path.split("\\").join("/")
    };
  });
}

function describeDismissal(dismissal) {
  if (!dismissal) return "was dismissed";
  const code = typeof dismissal.code === "string" && dismissal.code !== "" ? ` (${dismissal.code})` : "";
  return `was dismissed${code}: ${dismissal.reason}`;
}

/**
 * Review findings about issues: a reopened dismissal (warning) and a
 * dismissal that cannot be bound to an exact code, ids and evidence (error).
 */
export function issueFindings(project, issues = refreshIssueEvidence(project)) {
  const findings = [];
  const entries = new Map(issueEntries(project).map((entry) => [entry.id, entry]));
  for (const issue of issues) {
    if (issue.reopened) {
      const paths = issue.changedEvidence.map((item) => item.path).join(", ");
      findings.push(finding({
        code: "ISSUE_REOPENED",
        severity: "warning",
        message: `${issue.path}: evidence changed in ${paths}, so ${issue.id} is open for review. It ${describeDismissal(issue.reopened.dismissal)}`,
        recordIds: [issue.id, ...issue.affectedIds],
        sources: issue.evidence,
        evidence: "source",
        action: "Inspect the changed evidence, then resolve the issue or dismiss it again against the current text."
      }));
      continue;
    }
    if (issue.storedStatus !== "dismissed") continue;
    const reason = unboundReason(entries.get(issue.id).record);
    if (reason === null) continue;
    findings.push(finding({
      code: "ISSUE_DISMISSAL_UNBOUND",
      message: `${issue.path}: dismissed issue ${issue.id} ${reason}, so it cannot dismiss any finding`,
      recordIds: [issue.id],
      action: "Give the dismissal an exact diagnostic code, list the affected ids, and record the evidence it was judged against."
    }));
  }
  return findings;
}

function sameIds(left, right) {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function dismisses(issue, diagnostic) {
  if (issue.status !== "dismissed" || !issue.bound) return false;
  const recordIds = Array.isArray(diagnostic.recordIds) ? diagnostic.recordIds : [];
  if (diagnostic.code !== issue.dismissal.code) return false;
  if (!sameIds(issue.affectedIds, recordIds)) return false;
  const recordId = issue.dismissal["record-id"];
  return recordId === undefined || recordIds.includes(recordId);
}

/**
 * Splits diagnostics into those still reported and those an issue dismisses.
 * A dismissal matches only its exact diagnostic code and exactly the issue's
 * affected ids, and only while its evidence is unchanged. There is no text or
 * substring matching. Reopened issues are returned as review findings.
 */
export function applyDismissals(project, diagnostics) {
  const issues = refreshIssueEvidence(project);
  const remaining = [];
  const dismissed = [];
  for (const diagnostic of diagnostics) {
    const issue = issues.find((candidate) => dismisses(candidate, diagnostic));
    if (issue) dismissed.push({ ...diagnostic, dismissedBy: issue.id, reason: issue.dismissal.reason });
    else remaining.push(diagnostic);
  }
  const reopened = issueFindings(project, issues).filter((item) => item.code === "ISSUE_REOPENED");
  return { diagnostics: remaining, dismissed, reopened };
}

// Commands: `issue add|list|resolve|dismiss`. Transitions append to a
// `## History` section in the issue body so the record reads as its own log.

const HISTORY_HEADING = /^## History[ \t]*$/m;
const DISMISSAL_KEYS = new Set(["code", "record-id", "reason"]);

/** Appends history lines, starting a `## History` section when needed. */
export function appendHistory(body, lines) {
  const base = body.replace(/\s*$/, "");
  const entries = lines.map((line) => `- ${line}\n`).join("");
  if (HISTORY_HEADING.test(base)) return `${base}\n${entries}`;
  return `${base === "" ? "\n" : `${base}\n\n`}## History\n\n${entries}`;
}

function summarizeIssue(issue) {
  const { bound, ...rest } = issue;
  return rest;
}

function describeIssue(issue) {
  const affects = issue.affectedIds.length === 0 ? "" : ` affects ${issue.affectedIds.join(", ")}`;
  let line = `- ${issue.id} [${issue.status} ${issue.severity} ${issue.category}]${affects}`;
  if (issue.reopened) line += ` (reopened; ${describeDismissal(issue.reopened.dismissal)})`;
  else if (issue.status === "dismissed" && issue.dismissal) line += ` (${describeDismissal(issue.dismissal)})`;
  return line;
}

/**
 * `issue add --data <json-file>`: records an open issue. Evidence without a
 * hash is fingerprinted against the current bytes; a supplied hash must
 * still match. Dismissal and resolution are separate transitions.
 */
export function addIssue(root, options = {}) {
  const command = "issue add";
  if (options.dataPath === undefined) return invalid(command, "Usage: story issue add --data <json-file>");
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const blocked = loadErrorResult(command, project);
  if (blocked) return blocked;
  const read = readData(command, options.cwd ?? process.cwd(), options.dataPath);
  if (read.error) return read.error;
  const record = { format: FORMAT, "schema-version": SCHEMA_VERSION, id: read.data.id, type: "issue", status: "open", ...read.data };
  if (record.type !== "issue") return invalid(command, "issue add creates records of type issue");
  if (record.id === undefined) record.id = allocateId("issue", new Set(project.records.keys()));
  if (typeof record.id !== "string" || !ID_PATTERN.test(record.id)) return invalid(command, `Invalid id: ${record.id}`);
  if (project.records.has(record.id)) {
    return failure(command, `Record id ${record.id} is already used`, "DUPLICATE_RECORD_ID", 1, [record.id]);
  }
  if (record.status !== "open") return invalid(command, "A new issue is open; use issue resolve or issue dismiss to close it");
  if (record.dismissal !== undefined) return invalid(command, "Use story issue dismiss <id> to dismiss an issue");
  const unreadable = hashRefs(command, root, record, "evidence");
  if (unreadable) return unreadable;
  const schema = validateRecord(record);
  if (schema.length > 0) return findingsResult(command, schema, 2);

  const relative = `issues/${uniqueFilename(record.id, record.id, takenNames(root, "issues"))}`;
  const entry = { id: record.id, type: "issue", path: relative, record, body: "", valid: true };
  const withIssue = { records: new Map([...project.records, [record.id, entry]]), unindexed: project.unindexed };
  const dangling = danglingReferenceDiagnostics(withIssue).filter((item) => item.recordIds[1] === record.id);
  if (dangling.length > 0) return findingsResult(command, dangling, 1);
  const content = `${stringifyFrontmatter(record)}## History\n\n- opened\n`;
  const [summary] = refreshIssueEvidence({ root, records: new Map([[record.id, entry]]) });
  return writeResult(command, root, [{ path: relative, action: "create", expectedHash: null, content }], options, {
    data: summarizeIssue(summary),
    text: `Added issue ${record.id}: ${relative}\n`
  });
}

/**
 * `issue list`: open issues by default, including dismissals reopened by
 * changed evidence. `--include-inactive` adds resolved and dismissed issues;
 * `--record` keeps issues that affect that record.
 */
export function listIssues(root, options = {}) {
  const command = "issue list";
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const { project } = opened;
  const record = options.record ?? null;
  if (record !== null && !project.records.has(record)) {
    return failure(command, `No record with id ${record}`, "RECORD_NOT_FOUND", 1, [record]);
  }
  const all = refreshIssueEvidence(project);
  const diagnostics = issueFindings(project, all);
  const issues = all
    .filter((item) => options.includeInactive === true || item.status === "open")
    .filter((item) => record === null || item.affectedIds.includes(record))
    .map(summarizeIssue);
  const ok = !diagnostics.some((item) => item.severity === "error");
  const lines = [record === null ? "Issues:" : `Issues affecting ${record}:`];
  if (issues.length === 0) lines.push("- None");
  for (const item of issues) lines.push(describeIssue(item));
  if (diagnostics.length > 0) {
    lines.push("", "Diagnostics:");
    for (const item of diagnostics) lines.push(`- ${item.severity} ${item.code}: ${item.message}`);
  }
  return {
    envelope: envelope({ command, ok, data: { record, issues }, diagnostics }),
    exitCode: ok ? 0 : 1,
    text: `${lines.join("\n")}\n`
  };
}

// Loads the project and the target issue for a transition. Only an issue
// that is open now (stored open, or a dismissal reopened by changed
// evidence) can be resolved or dismissed.
function openIssue(command, root, id) {
  const opened = openProject(root, command);
  if (opened.error) return { error: opened.error };
  const { project } = opened;
  const blocked = loadErrorResult(command, project);
  if (blocked) return { error: blocked };
  const entry = project.records.get(id);
  if (!entry || entry.type !== "issue") {
    return { error: failure(command, `No issue with id ${id}`, "ISSUE_NOT_FOUND", 1, [id]) };
  }
  const [issue] = refreshIssueEvidence({ root: project.root, records: new Map([[id, entry]]) });
  if (issue.status !== "open") {
    return { error: failure(command, `Issue ${id} is ${issue.status}; only an open issue can be resolved or dismissed`, "ISSUE_TRANSITION_INVALID", 1, [id]) };
  }
  return { project, entry, issue };
}

function reopenedLine(issue) {
  const paths = issue.changedEvidence.map((item) => item.path).join(", ");
  return `reopened: evidence changed in ${paths}; it ${describeDismissal(issue.reopened.dismissal)}`;
}

function transition(command, root, target, data, history, options, verb) {
  const { entry, issue } = target;
  const markdown = fs.readFileSync(path.join(root, entry.path), "utf8");
  const parsed = parseFrontmatter(markdown, entry.path);
  const lines = issue.reopened ? [reopenedLine(issue), history] : [history];
  const content = replaceFrontmatter(markdown, { ...parsed.data, ...data }, appendHistory(parsed.body, lines));
  const relative = entry.path.split(path.sep).join("/");
  return writeResult(command, root, [{ path: relative, action: "replace", expectedHash: entry.hash, content }], options, {
    data: { id: entry.id, path: relative, from: "open", to: data.status, reopened: issue.reopened },
    text: `${verb} issue ${entry.id}: ${relative}\n`
  });
}

function optionalData(command, options) {
  if (options.dataPath === undefined) return { data: {} };
  return readData(command, options.cwd ?? process.cwd(), options.dataPath);
}

/** `issue resolve <id> [--data <json-file>]`, with an optional `reason`. */
export function resolveIssue(root, id, options = {}) {
  const command = "issue resolve";
  if (!id) return invalid(command, "Usage: story issue resolve <id> [--data <json-file>]");
  const target = openIssue(command, root, id);
  if (target.error) return target.error;
  const read = optionalData(command, options);
  if (read.error) return read.error;
  const extra = Object.keys(read.data).filter((key) => key !== "reason");
  if (extra.length > 0) return invalid(command, `issue resolve --data accepts only reason, not ${extra.join(", ")}`);
  const reason = read.data.reason;
  if (reason !== undefined && (typeof reason !== "string" || reason === "")) {
    return invalid(command, "reason must be non-empty text");
  }
  const history = reason === undefined ? "resolved" : `resolved: ${reason}`;
  return transition(command, root, target, { status: "resolved", dismissal: undefined }, history, options, "Resolved");
}

/**
 * `issue dismiss <id> --data <json-file>` with `code`, optional
 * `record-id`, and `reason`. The dismissal is bound to that exact code, the
 * issue's affected ids, and evidence fingerprints taken from the current
 * bytes, which the author has just judged.
 */
export function dismissIssue(root, id, options = {}) {
  const command = "issue dismiss";
  if (!id || options.dataPath === undefined) return invalid(command, "Usage: story issue dismiss <id> --data <json-file>");
  const target = openIssue(command, root, id);
  if (target.error) return target.error;
  const read = readData(command, options.cwd ?? process.cwd(), options.dataPath);
  if (read.error) return read.error;
  const dismissal = read.data;
  const extra = Object.keys(dismissal).filter((key) => !DISMISSAL_KEYS.has(key));
  if (extra.length > 0) return invalid(command, `issue dismiss --data accepts code, record-id and reason, not ${extra.join(", ")}`);
  if (typeof dismissal.code !== "string" || dismissal.code === "") return invalid(command, "A dismissal names one exact diagnostic code");
  if (typeof dismissal.reason !== "string" || dismissal.reason === "") return invalid(command, "A dismissal needs a reason");
  if (dismissal["record-id"] !== undefined && typeof dismissal["record-id"] !== "string") return invalid(command, "record-id must be a record id");

  const record = { ...target.entry.record, status: "dismissed", dismissal };
  const unbound = unboundReason(record);
  if (unbound !== null) {
    return failure(command, `Issue ${id} ${unbound}, so a dismissal could not be matched exactly`, "ISSUE_DISMISSAL_UNBOUND", 1, [id]);
  }
  const evidence = record.evidence.map((ref) => ({ ...ref }));
  const fingerprinted = { id, evidence };
  const unreadable = hashRefs(command, root, fingerprinted, "evidence", true);
  if (unreadable) return unreadable;
  const on = dismissal["record-id"] === undefined ? "" : ` on ${dismissal["record-id"]}`;
  const history = `dismissed (${dismissal.code}${on}): ${dismissal.reason}`;
  return transition(command, root, target, { status: "dismissed", dismissal, evidence }, history, options, "Dismissed");
}
