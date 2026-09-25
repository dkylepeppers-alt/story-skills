import { sha256Hex } from "../storage/hash.js";
import { readSourceSpan } from "../storage/spans.js";
import { buildChronology } from "./chronology.js";
import { appliesAt, normalizeCursor } from "./cursor.js";
import { predicateFor, validateFact } from "./predicates.js";

/**
 * Fact records in the loaded project, sorted by id. Only the validated index
 * is read: schema-invalid records and anything outside the record directories
 * (including `work/`) are never state.
 */
export function factEntries(project) {
  return [...project.records.values()]
    .filter((entry) => entry.type === "fact")
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
}

/** The public shape of a fact record in results. */
export function summarizeFact(entry) {
  const fact = entry.record;
  return {
    id: entry.id,
    status: fact.status,
    kind: fact.kind,
    subject: fact.subject,
    predicate: fact.predicate,
    value: fact.value,
    validFrom: fact["valid-from"] ?? "baseline",
    validUntil: fact["valid-until"] ?? null,
    sources: fact.sources ?? [],
    path: entry.path.split("\\").join("/"),
    catalog: predicateFor(fact.predicate).catalog
  };
}

function warning(code, message, recordIds, sources, action) {
  return { code, severity: "warning", message, recordIds, sources, evidence: "structural", action };
}

function sourceRef(source) {
  const ref = { path: source.path, hash: source.hash, kind: source.kind };
  if (source.scene) ref.sceneId = source.scene;
  if (source.beat) ref.beatId = source.beat;
  return ref;
}

/**
 * Checks a fact's declared evidence against the current source bytes. Every
 * factual conclusion needs provenance, so a fact without sources, with a
 * source that cannot be read, or with a stale hash is unresolved rather than
 * established. Returns null when all sources are current.
 */
export function provenanceProblem(root, entry) {
  const sources = entry.record.sources ?? [];
  if (sources.length === 0) {
    return {
      reason: "MISSING_PROVENANCE",
      detail: "no sources",
      diagnostic: warning("MISSING_PROVENANCE", `${entry.path}: fact ${entry.id} has no sources`, [entry.id], [],
        "Add a SourceRef with the exact source span and its hash.")
    };
  }
  for (const source of sources) {
    const ref = sourceRef(source);
    let bytes;
    try {
      bytes = readSourceSpan(root, ref).bytes;
    } catch (error) {
      return {
        reason: "SOURCE_UNREADABLE",
        detail: error.message,
        diagnostic: warning("SOURCE_UNREADABLE", `${entry.path}: source ${source.path} cannot be read: ${error.message}`,
          [entry.id], [ref], "Restore the source or point the fact at evidence that exists.")
      };
    }
    if (sha256Hex(bytes) !== source.hash) {
      return {
        reason: "SOURCE_STALE",
        detail: `source ${source.path} changed`,
        diagnostic: warning("SOURCE_STALE", `${entry.path}: source ${source.path} changed since fact ${entry.id} recorded it`,
          [entry.id], [ref], "Inspect the changed evidence, then refresh the source hash or revise the fact.")
      };
    }
  }
  return null;
}

function startRelation(chronology, left, right) {
  if (left === "baseline" && right === "baseline") return "equal";
  if (left === "baseline") return "before";
  if (right === "baseline") return "after";
  return chronology.compare(left, right);
}

// Whether an assertion has begun by the query: true, false, or "unresolved".
function started(chronology, from, at) {
  if (from === "baseline") return true;
  const relation = chronology.compare(from, at);
  if (relation === "unordered") return "unresolved";
  return relation !== "after";
}

function startOf(entry) {
  return normalizeCursor(entry.record["valid-from"] ?? "baseline");
}

/**
 * Exclusive world assertions for one subject and predicate. A later-starting
 * assertion that has begun replaces an earlier one even after it ends, so an
 * ended hold is not silently revived. Assertions whose starts chronology
 * cannot order stay visible: both applying is a conflict, and one that may
 * have begun later leaves the other unresolved.
 */
function settleExclusive(chronology, candidates, at) {
  const kept = [];
  const uncertain = [];
  for (const current of candidates.filter((item) => item.applies === true)) {
    let replaced = false;
    const doubts = [];
    for (const other of candidates) {
      if (other === current || other.entry.record.value === current.entry.record.value) continue;
      const begun = started(chronology, startOf(other.entry), at);
      if (begun === false) continue;
      const relation = startRelation(chronology, startOf(current.entry), startOf(other.entry));
      if (relation === "before") {
        if (begun === true) replaced = true;
        else doubts.push(other.entry.id);
      } else if (relation === "unordered" && other.applies !== true) {
        doubts.push(other.entry.id);
      }
    }
    if (replaced) continue;
    if (doubts.length > 0) uncertain.push({ item: current, doubts });
    else kept.push(current);
  }
  return { kept, uncertain };
}

function unresolvedItem(entry, reason, detail) {
  return { ...summarizeFact(entry), reason, detail };
}

function conflictFor(kept) {
  const values = [...new Set(kept.map((item) => item.entry.record.value))].sort();
  if (values.length < 2) return null;
  const first = kept[0].entry.record;
  return {
    code: "STATE_CONFLICT",
    subject: first.subject,
    predicate: first.predicate,
    factIds: kept.map((item) => item.entry.id).sort(),
    values
  };
}

/**
 * Established applicable state at a story cursor (design §6). Only
 * `established` facts with current provenance count; proposals, retracted and
 * superseded records, and exploratory material never do. The result is a pure
 * function of the loaded record set, so a historical query passes that
 * revision's project snapshot rather than reinterpreting current lifecycle
 * fields.
 *
 * @returns {{ facts: object[], conflicts: object[], unresolved: object[], diagnostics: object[] }}
 */
export function resolveState(project, cursor, options = {}) {
  const chronology = options.chronology ?? buildChronology(project);
  const diagnostics = [];
  const unresolved = [];
  const applicable = [];
  const query = normalizeCursor(cursor);
  if (query === null || query === "baseline") {
    diagnostics.push({
      code: "INVALID_CURSOR",
      severity: "error",
      message: "A state query needs a scene entry, beat, or scene exit cursor",
      recordIds: [],
      sources: [],
      evidence: "structural",
      action: "Pass --scene with an optional --beat and --side before|after."
    });
  }
  const before = chronology.diagnostics.length;

  for (const entry of factEntries(project)) {
    if (entry.record.status !== "established") continue;
    const invalid = validateFact(project, entry);
    if (invalid.length > 0) {
      diagnostics.push(...invalid);
      unresolved.push(unresolvedItem(entry, "FACT_INVALID", invalid.map((item) => item.message).join("; ")));
      continue;
    }
    const problem = provenanceProblem(project.root, entry);
    if (problem) {
      diagnostics.push(problem.diagnostic);
      unresolved.push(unresolvedItem(entry, problem.reason, problem.detail));
      continue;
    }
    const applies = appliesAt(chronology, entry.record, cursor);
    if (applies === false) {
      applicable.push({ entry, applies });
      continue;
    }
    if (applies === "unresolved") {
      unresolved.push(unresolvedItem(entry, "UNORDERED", "chronology cannot place the fact's validity window against the cursor"));
    }
    applicable.push({ entry, applies });
  }

  const facts = [];
  const conflicts = [];
  const groups = new Map();
  for (const item of applicable) {
    const fact = item.entry.record;
    const predicate = predicateFor(fact.predicate);
    if (fact.kind === "world" && predicate.cardinality === "exclusive") {
      const key = `${fact.subject}\0${fact.predicate}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    } else if (item.applies === true) {
      facts.push(summarizeFact(item.entry));
    }
  }
  for (const candidates of groups.values()) {
    const { kept, uncertain } = settleExclusive(chronology, candidates, cursor);
    for (const item of kept) facts.push(summarizeFact(item.entry));
    for (const { item, doubts } of uncertain) {
      unresolved.push(unresolvedItem(item.entry, "MAY_BE_REPLACED",
        `a later ${item.entry.record.predicate} assertion may already apply: ${doubts.sort().join(", ")}`));
    }
    const conflict = conflictFor(kept);
    if (conflict) {
      conflicts.push(conflict);
      diagnostics.push({
        code: "STATE_CONFLICT",
        severity: "error",
        message: `${conflict.subject} has conflicting ${conflict.predicate} values at this cursor: ${conflict.values.join(", ")}`,
        recordIds: [conflict.subject, ...conflict.factIds],
        sources: [],
        evidence: "declared",
        action: "Order the assertions in chronology, end one with valid-until, or retract or supersede one."
      });
    }
  }
  diagnostics.push(...chronology.diagnostics.slice(before));
  const byId = (left, right) => left.id.localeCompare(right.id, "en");
  return {
    facts: facts.sort(byId),
    conflicts: conflicts.sort((left, right) => left.subject.localeCompare(right.subject, "en")
      || left.predicate.localeCompare(right.predicate, "en")),
    unresolved: unresolved.sort(byId),
    diagnostics
  };
}
