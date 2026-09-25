import { finding } from "../cli/result.js";

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
