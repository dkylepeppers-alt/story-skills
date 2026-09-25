import { isIdReference } from "../project/references.js";

// The predicate catalog (design §6). Exclusive predicates hold one value per
// subject at a time: a later assertion that chronology places after an earlier
// one replaces it, and two that overlap without such an order are a conflict.
// Additive predicates may hold several values at once, and each lasts until
// its own `valid-until`. Knowledge and belief are additive and belong to their
// own epistemic kinds, so they never become objective world assertions.
const EXCLUSIVE = { cardinality: "exclusive", ends: "replacement-or-valid-until" };
const ADDITIVE = { cardinality: "additive", ends: "valid-until" };

export const PREDICATES = Object.freeze({
  location: {
    ...EXCLUSIVE,
    subjects: ["character", "object", "faction"],
    value: { type: "id-or-text", types: ["location"] }
  },
  holder: {
    ...EXCLUSIVE,
    subjects: ["object"],
    value: { type: "id", types: ["character", "faction"] }
  },
  availability: {
    ...EXCLUSIVE,
    subjects: ["object", "location", "system"],
    value: { type: "enum", values: ["available", "unavailable", "hidden", "lost", "destroyed"] }
  },
  status: {
    ...EXCLUSIVE,
    subjects: ["character", "faction", "object", "location"],
    value: { type: "text" }
  },
  injury: {
    ...ADDITIVE,
    subjects: ["character"],
    value: { type: "text" }
  },
  affiliation: {
    ...ADDITIVE,
    subjects: ["character"],
    value: { type: "id", types: ["faction"] }
  },
  relationship: {
    ...ADDITIVE,
    subjects: ["character", "faction"],
    value: { type: "id", types: ["character", "faction"] }
  },
  knows: {
    ...ADDITIVE,
    kinds: ["knowledge"],
    subjects: ["character"],
    value: { type: "id-or-text", types: null }
  },
  believes: {
    ...ADDITIVE,
    kinds: ["belief"],
    subjects: ["character"],
    value: { type: "id-or-text", types: null }
  }
});

// Knowledge and belief each have exactly one predicate.
const EPISTEMIC_PREDICATE = { knowledge: "knows", belief: "believes" };

/**
 * The catalog entry for a predicate. A predicate outside the catalog is a
 * free-text claim: it stays retrievable and source-linked, is additive, and
 * is never treated as an executable rule.
 */
export function predicateFor(name) {
  if (typeof name === "string" && Object.hasOwn(PREDICATES, name)) {
    return { name, catalog: true, ...PREDICATES[name] };
  }
  return { name, catalog: false, ...ADDITIVE };
}

function issue(code, message, recordIds, action) {
  return { code, severity: "error", message, recordIds, sources: [], evidence: "declared", action };
}

function isText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function recordType(project, id) {
  return project.records.get(id)?.type;
}

function checkKind(fact, predicate) {
  const expected = EPISTEMIC_PREDICATE[fact.kind];
  if (predicate.kinds && !predicate.kinds.includes(fact.kind)) {
    return `predicate ${predicate.name} is only for ${predicate.kinds.join(", ")} facts, not ${fact.kind}`;
  }
  if (expected !== undefined && predicate.name !== expected) {
    return `${fact.kind} facts use the ${expected} predicate, not ${predicate.name}`;
  }
  return null;
}

function checkSubject(project, fact, predicate) {
  if (!predicate.catalog) return isText(fact.subject) ? null : "subject must be non-empty text";
  const type = recordType(project, fact.subject);
  if (type === undefined) return `subject ${fact.subject} is not a record id`;
  if (!predicate.subjects.includes(type)) {
    return `subject ${fact.subject} is a ${type}; ${predicate.name} takes ${predicate.subjects.join(", ")}`;
  }
  return null;
}

function checkValue(project, fact, predicate) {
  const value = fact.value;
  const rule = predicate.catalog ? predicate.value : { type: "text" };
  if (rule.type === "enum") {
    return rule.values.includes(value) ? null : `value ${value} is not one of ${rule.values.join(", ")}`;
  }
  const mustBeId = rule.type === "id" || (rule.type === "id-or-text" && isIdReference(value));
  if (!mustBeId) return isText(value) ? null : "value must be non-empty text";
  const type = recordType(project, value);
  if (type === undefined) return `value ${value} is not a record id`;
  if (rule.types !== null && !rule.types.includes(type)) {
    return `value ${value} is a ${type}; ${predicate.name} takes ${rule.types.join(", ")}`;
  }
  return null;
}

/**
 * Validates one fact record against the predicate catalog: the epistemic kind
 * matches the predicate, and the subject and value have the predicate's
 * types. Schema shape (status, kind, cursors, source refs) is already checked
 * by the loader.
 */
export function validateFact(project, entry) {
  const fact = entry.record;
  const predicate = predicateFor(fact.predicate);
  const diagnostics = [];
  const kind = checkKind(fact, predicate);
  if (kind) {
    diagnostics.push(issue("FACT_KIND_PREDICATE", `${entry.path}: ${kind}`, [entry.id],
      "Use knows for knowledge, believes for belief, and a world predicate for world and reader-reveal facts."));
  }
  const subject = checkSubject(project, fact, predicate);
  if (subject) {
    const ids = isText(fact.subject) ? [entry.id, fact.subject] : [entry.id];
    diagnostics.push(issue("FACT_SUBJECT_INVALID", `${entry.path}: ${subject}`, ids,
      "Point the subject at a record of a type the predicate accepts."));
  }
  const value = checkValue(project, fact, predicate);
  if (value) {
    const ids = isIdReference(fact.value) ? [entry.id, fact.value] : [entry.id];
    diagnostics.push(issue("FACT_VALUE_INVALID", `${entry.path}: ${value}`, ids,
      "Give the value the type the predicate catalog declares."));
  }
  return diagnostics;
}
