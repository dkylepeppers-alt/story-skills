import { finding } from "../cli/result.js";
import { sourceHash } from "../storage/hash.js";

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
