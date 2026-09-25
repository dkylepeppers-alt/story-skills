import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadProjectSync } from "../project/load.js";
import { buildChronology } from "../state/chronology.js";
import { sha256Hex } from "../storage/hash.js";
import { readSourceSpan } from "../storage/spans.js";
import { checkScopeSpec } from "./scope.js";
import { compareText } from "./snapshot.js";

function finding(code, severity, message, recordIds, sources, action) {
  return { code, severity, message, recordIds, sources, evidence: "structural", action };
}

// Canonical JSON (sorted keys) for deep field comparison.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function changedFields(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => canonical(before[key]) !== canonical(after[key]))
    .sort(compareText);
}

function byId(left, right) {
  return compareText(left.id, right.id);
}

// Writes baseline bytes into a private temporary directory so the ordinary
// loader and chronology read them exactly as they would a working project.
// The copy is removed before comparison returns; it is not a snapshot.
function materialize(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "story-baseline-"));
  for (const [file, bytes] of files) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return root;
}

function compareFiles(baseline, current) {
  const added = [];
  const removed = [];
  const changed = [];
  for (const file of [...new Set([...baseline.keys(), ...current.keys()])].sort(compareText)) {
    const before = baseline.get(file);
    const after = current.get(file);
    if (!before) added.push(file);
    else if (!after) removed.push(file);
    else if (!before.equals(after)) changed.push({ path: file, from: sha256Hex(before), to: sha256Hex(after) });
  }
  return { added, removed, changed };
}

function compareRecords(before, after) {
  const added = [];
  const removed = [];
  const changed = [];
  const moved = [];
  for (const id of [...new Set([...before.records.keys(), ...after.records.keys()])].sort(compareText)) {
    const old = before.records.get(id);
    const now = after.records.get(id);
    if (!old) {
      added.push({ id, type: now.type, path: now.path });
    } else if (!now) {
      removed.push({ id, type: old.type, path: old.path });
    } else {
      if (old.path !== now.path) moved.push({ id, type: now.type, from: old.path, to: now.path });
      if (old.hash !== now.hash) {
        changed.push({ id, type: now.type, path: now.path, fields: changedFields(old.record, now.record), body: old.body !== now.body });
      }
    }
  }
  return { added, removed, changed, moved };
}

// A placed scene's span was just read by the chronology, so it is readable.
function sceneHash(root, placement) {
  if (!placement) return null;
  return sha256Hex(readSourceSpan(root, { path: placement.path, sceneId: placement.sceneId }).bytes);
}

// Scenes that keep their relative reading order: a longest common
// subsequence of the scenes placed in both revisions. A scene outside it was
// moved within the manuscript even if its chapter is unchanged.
function stableScenes(beforeOrder, afterOrder) {
  const common = new Set(beforeOrder.filter((id) => afterOrder.includes(id)));
  const a = beforeOrder.filter((id) => common.has(id));
  const b = afterOrder.filter((id) => common.has(id));
  const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const stable = new Set();
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) {
      stable.add(a[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return stable;
}

function compareScenes(before, after) {
  const place = (project) => {
    const chronology = buildChronology(project);
    const placements = new Map(chronology.readingOrder.map((item) => [item.sceneId, item]));
    const chapters = new Map(chronology.scenes.map((scene) => [scene.id, scene.chapterId]));
    return { chapters, placements, order: chronology.readingOrder.map((item) => item.sceneId) };
  };
  const old = place(before);
  const now = place(after);
  const location = (side, id) => {
    const placement = side.placements.get(id);
    return placement
      ? { chapterId: placement.chapterId, path: placement.path, position: placement.position }
      : { chapterId: side.chapters.get(id) ?? null, path: null, position: null };
  };
  const summary = (side, id) => {
    const { chapterId, path: file } = location(side, id);
    return { id, chapterId, path: file };
  };
  const stable = stableScenes(old.order, now.order);
  const result = { added: [], removed: [], changed: [], moved: [] };
  const ids = (project) => [...project.records.values()].filter((entry) => entry.type === "scene").map((entry) => entry.id);
  for (const id of [...new Set([...ids(before), ...ids(after)])].sort(compareText)) {
    const inBefore = before.records.get(id)?.type === "scene";
    const inAfter = after.records.get(id)?.type === "scene";
    if (!inBefore) {
      result.added.push(summary(now, id));
      continue;
    }
    if (!inAfter) {
      result.removed.push(summary(old, id));
      continue;
    }
    const from = location(old, id);
    const to = location(now, id);
    if (from.chapterId !== to.chapterId || from.path !== to.path || (from.position !== null && to.position !== null && !stable.has(id))) {
      result.moved.push({ id, from, to });
    }
    const fromHash = sceneHash(before.root, old.placements.get(id));
    const toHash = sceneHash(after.root, now.placements.get(id));
    if (fromHash !== null && toHash !== null && fromHash !== toHash) {
      result.changed.push({ id, from: { hash: fromHash }, to: { hash: toHash } });
    }
  }
  return result;
}

function compareFacts(before, after) {
  const facts = (project) => new Map([...project.records.values()].filter((entry) => entry.type === "fact").map((entry) => [entry.id, entry]));
  const old = facts(before);
  const now = facts(after);
  const added = [...now.keys()].filter((id) => !old.has(id)).sort(compareText);
  const removed = [...old.keys()].filter((id) => !now.has(id)).sort(compareText);
  const changed = [];
  for (const id of [...now.keys()].filter((key) => old.has(key)).sort(compareText)) {
    const fields = changedFields(old.get(id).record, now.get(id).record);
    if (fields.length === 0) continue;
    const pick = (record) => Object.fromEntries(fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]]));
    changed.push({ id, fields, from: pick(old.get(id).record), to: pick(now.get(id).record) });
  }
  return { added, removed, changed };
}

function spanHash(root, ref) {
  try {
    return { hash: sha256Hex(readSourceSpan(root, { path: ref.path, sceneId: ref.scene, beatId: ref.beat }).bytes), error: null };
  } catch (error) {
    return { hash: null, error };
  }
}

function removalReason(after, ref, error) {
  if (!fs.existsSync(path.join(after.root, ref.path))) return `file ${ref.path} was deleted`;
  if (error.code === "SCENE_NOT_FOUND") return `scene ${ref.scene} was removed`;
  if (error.code === "BEAT_NOT_FOUND") return `beat ${ref.beat} was removed from scene ${ref.scene}`;
  return `it cannot be read: ${error.message}`;
}

/**
 * Source references whose evidence changed since the baseline. A source the
 * current project can no longer read (a removed scene, beat or file) is an
 * error; a source whose bytes changed since the baseline and no longer match
 * the hash its record stored is stale evidence to re-inspect. Nothing is
 * rewritten: the record keeps its stored hash until someone refreshes it.
 */
function compareSources(baselineRoot, after) {
  const sources = [];
  const diagnostics = [];
  for (const entry of [...after.records.values()].sort(byId)) {
    for (const field of ["sources", "evidence"]) {
      const refs = Array.isArray(entry.record[field]) ? entry.record[field] : [];
      for (const source of refs) {
        if (source === null || typeof source !== "object" || typeof source.path !== "string") continue;
        const ref = { path: source.path };
        if (source.scene) ref.scene = source.scene;
        if (source.beat) ref.beat = source.beat;
        const current = spanHash(after.root, ref);
        const baseline = spanHash(baselineRoot, ref);
        const item = { recordId: entry.id, field, ref, recorded: source.hash ?? null, baseline: baseline.hash, current: current.hash };
        const inMemory = { path: ref.path, hash: source.hash, kind: source.kind };
        if (ref.scene) inMemory.sceneId = ref.scene;
        if (ref.beat) inMemory.beatId = ref.beat;
        if (current.hash === null) {
          sources.push({ ...item, status: "removed" });
          diagnostics.push(finding(
            "SOURCE_REMOVED",
            "error",
            `${entry.path}: ${field} cites ${describe(ref)}, but ${removalReason(after, ref, current.error)}`,
            [entry.id, ...(ref.scene && current.error.code === "SCENE_NOT_FOUND" ? [ref.scene] : [])],
            [inMemory],
            "Point the record at evidence that still exists, or restore the removed source."
          ));
        } else if (baseline.hash !== null && baseline.hash !== current.hash) {
          sources.push({ ...item, status: "changed" });
          if (source.hash !== current.hash) {
            diagnostics.push(finding(
              "STALE_EVIDENCE",
              "warning",
              `${entry.path}: ${field} cites ${describe(ref)}, which changed since the baseline`,
              [entry.id],
              [inMemory],
              "Re-read the changed evidence, then refresh the stored hash or revise the record."
            ));
          }
        }
      }
    }
  }
  return { sources, diagnostics };
}

function describe(ref) {
  if (ref.beat) return `beat ${ref.beat} of scene ${ref.scene} in ${ref.path}`;
  if (ref.scene) return `scene ${ref.scene} in ${ref.path}`;
  return ref.path;
}

/**
 * Compares the working project with a resolved baseline (see
 * resolveBaseline). Records match by stable id, so a renamed file is a move
 * and not a remove plus an add; content change and move are classified
 * independently. Scenes match by id across chapters: a scene whose span
 * bytes are identical after moving is moved, not changed. With
 * `options.scope`, every changed, added and deleted file is checked against
 * the ScopeSpec. The comparison reads only; it never writes to the project,
 * the index or `.story/revisions/`.
 *
 * @returns {import("../contracts.js").ChangeReport}
 */
export function compareRevision(project, resolved, options = {}) {
  const after = typeof project === "string" ? loadProjectSync(project) : project;
  const baselineRoot = materialize(resolved.files);
  try {
    const before = loadProjectSync(baselineRoot);
    const records = compareRecords(before, after);
    const { sources, diagnostics } = compareSources(baselineRoot, after);
    const removedIds = new Set(records.removed.map((item) => item.id));
    const dangling = after.diagnostics.filter((item) => item.code === "DANGLING_REFERENCE" && removedIds.has(item.recordIds[0]));
    const scope = options.scope === undefined ? null : checkScopeSpec(options.scope, resolved.files, resolved.current);
    return {
      baseline: resolved.baseline,
      files: compareFiles(resolved.files, resolved.current),
      ...records,
      scenes: compareScenes(before, after),
      facts: compareFacts(before, after),
      sources,
      scope: scope && { ok: scope.ok, files: scope.files },
      diagnostics: [...(scope?.diagnostics ?? []), ...diagnostics, ...dangling]
    };
  } finally {
    fs.rmSync(baselineRoot, { recursive: true, force: true });
  }
}
