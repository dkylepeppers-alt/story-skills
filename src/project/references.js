import path from "node:path";
import { findMarkers } from "../storage/spans.js";

// Fact subject and value are free text unless they use a record id shape
// (`chr_ada`, `obj_brass_key`). Dedicated schema fields are ids even when the
// text does not match that shape. Removal also matches the target id exactly,
// so an explicit id without an underscore is still a dependency.
const ID_REFERENCE = /^[a-z][a-z0-9]*_[a-z0-9_-]+$/;

const SCALAR_FIELDS = [
  ["chapter-id", "chapter-id", true],
  ["scene-id", "scene-id", true],
  ["beat-id", "beat-id", true]
];

const LIST_FIELDS = [
  ["cast", "cast", false],
  ["affected-ids", "affected-ids", true],
  ["scope-ids", "scope-ids", true],
  ["supersedes", "supersedes", true],
  ["depicts", "depicts", true],
  ["used-by", "used-by", true],
  ["unresolved-facts", "unresolved-facts", true]
];

const CURSOR_FIELDS = ["valid-from", "valid-until"];
const SOURCE_LIST_FIELDS = ["sources", "evidence"];

export function isIdReference(value) {
  return typeof value === "string" && ID_REFERENCE.test(value);
}

function slash(value) {
  return String(value).split(path.sep).join("/");
}

function pushId(refs, field, id, required) {
  if (typeof id !== "string" || id.length === 0) return;
  refs.push({ field, id, required });
}

function addTextRef(refs, field, value, targetId) {
  if (typeof value !== "string" || value.length === 0) return;
  if (isIdReference(value) || (targetId !== undefined && value === targetId)) {
    pushId(refs, field, value, true);
  }
}

function addCursor(refs, field, cursor) {
  if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return;
  pushId(refs, field, cursor.scene, true);
  pushId(refs, `${field}.beat`, cursor.beat, true);
}

function addSource(refs, field, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return;
  pushId(refs, field, source.scene, true);
  pushId(refs, `${field}.beat`, source.beat, true);
}

/**
 * Schema id references on one record. `targetId` adds an exact subject/value
 * match for removal; the loader omits it and ignores free text.
 */
export function referencesInRecord(record, targetId) {
  const refs = [];
  const data = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  addTextRef(refs, "subject", data.subject, targetId);
  addTextRef(refs, "value", data.value, targetId);
  for (const field of CURSOR_FIELDS) addCursor(refs, field, data[field]);
  for (const field of SOURCE_LIST_FIELDS) {
    if (!Array.isArray(data[field])) continue;
    for (const source of data[field]) addSource(refs, field, source);
  }
  addSource(refs, "source", data.source);
  for (const [key, field, required] of SCALAR_FIELDS) pushId(refs, field, data[key], required);
  for (const [key, field, required] of LIST_FIELDS) {
    if (!Array.isArray(data[key])) continue;
    for (const id of data[key]) pushId(refs, field, id, required);
  }
  const after = data.chronology && Array.isArray(data.chronology.after) ? data.chronology.after : [];
  for (const id of after) pushId(refs, "after", id, false);
  const dismissal = data.dismissal;
  if (dismissal && typeof dismissal === "object" && !Array.isArray(dismissal)) {
    pushId(refs, "dismissal.record-id", dismissal["record-id"], true);
  }
  if (Array.isArray(data.references)) {
    for (const item of data.references) {
      if (item && typeof item === "object") pushId(refs, "references", item.asset, true);
    }
  }
  return refs;
}

export function projectEntries(project) {
  return [...project.records.values(), ...(project.unindexed ?? [])];
}

function inspectEntry(entry, targetId) {
  const refs = referencesInRecord(entry?.record, targetId);
  const beats = [];
  if (entry?.record?.type === "chapter" && typeof entry.body === "string") {
    const markers = findMarkers(entry.body);
    for (const scene of markers.scenes) {
      refs.push({ field: "story-scene", id: scene.id, required: true });
    }
    for (const beat of markers.beats) beats.push(beat.id);
  }
  return { refs, beats };
}

function knownIds(project, beats) {
  const known = new Set(beats);
  for (const entry of projectEntries(project)) {
    if (typeof entry.id === "string" && entry.id.length > 0) known.add(entry.id);
  }
  return known;
}

/**
 * Dangling schema and manuscript references. Beat markers count as existing
 * anchors; scene markers do not, so deleting a scene file still reports the
 * `story-scene` comment that names it.
 */
export function danglingReferenceDiagnostics(project) {
  const diagnostics = [];
  const beats = [];
  const refs = [];
  for (const entry of projectEntries(project)) {
    const found = inspectEntry(entry);
    beats.push(...found.beats);
    for (const ref of found.refs) {
      refs.push({ ...ref, ownerId: entry.id, ownerPath: slash(entry.path) });
    }
  }
  const known = knownIds(project, beats);
  for (const ref of refs) {
    if (known.has(ref.id)) continue;
    const recordIds = typeof ref.ownerId === "string" ? [ref.id, ref.ownerId] : [ref.id];
    diagnostics.push({
      code: "DANGLING_REFERENCE",
      severity: "error",
      message: `${ref.ownerPath}: ${ref.field} references missing id ${ref.id}`,
      recordIds,
      sources: [],
      evidence: "structural",
      action: "Restore the referenced record, or update the reference so it names an id that exists."
    });
  }
  return diagnostics;
}

/**
 * References to `targetId` from every parsed record, including schema-invalid
 * records the validated index omitted, and from manuscript scene markers.
 * Cast lists and scene `chronology.after` are optional; every other schema
 * reference and every scene marker is required.
 */
export function classifyReferences(project, targetId) {
  const required = [];
  const optional = [];
  for (const entry of projectEntries(project)) {
    if (entry.id === targetId) continue;
    const matched = inspectEntry(entry, targetId).refs.filter((ref) => ref.id === targetId);
    if (matched.length === 0) continue;
    const requiredFields = [];
    const optionalFields = [];
    for (const ref of matched) {
      const list = ref.required ? requiredFields : optionalFields;
      if (!list.includes(ref.field)) list.push(ref.field);
    }
    if (requiredFields.length > 0) {
      const fact = requiredFields.includes("subject") || requiredFields.includes("value");
      required.push({ entry, fields: requiredFields, kind: fact ? "fact" : "schema" });
    }
    if (optionalFields.length > 0) optional.push({ entry, fields: optionalFields });
  }
  return { required, optional };
}
