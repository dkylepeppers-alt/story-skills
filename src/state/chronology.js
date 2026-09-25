import fs from "node:fs";
import path from "node:path";
import { findMarkers } from "../storage/spans.js";
import { parseFrontmatter } from "../storage/document.js";
import { normalizeCursor } from "./cursor.js";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
const ZONED_CLOCK_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/;
const INSTANT_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:\d{2})$/;
const LOCAL_DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/;

/**
 * Builds a partial story chronology from scene records and chapter source.
 * Reading order (chapter number, then marker order) is independent of story
 * order. `compare` returns `before`, `equal`, `after`, or `unordered`.
 * Equal timestamps do not invent order; an explicit `after` edge does.
 * A date, a civil clock, and a zoned instant are different precision types.
 * Cross-precision pairs stay unordered — a missing timezone is not filled in,
 * and a date is not compared as an exact instant.
 */
export function buildChronology(project) {
  const diagnostics = [];
  const seen = new Set();
  const addDiagnostic = (diagnostic) => {
    const key = `${diagnostic.code}\0${diagnostic.recordIds.join(",")}\0${diagnostic.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    diagnostics.push(diagnostic);
  };

  const chapters = [...project.records.values()]
    .filter((entry) => entry.type === "chapter")
    .sort(compareChapters);
  const sceneEntries = [...project.records.values()]
    .filter((entry) => entry.type === "scene")
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  const sceneIds = new Set(sceneEntries.map((entry) => entry.id));

  const { occurrences, markerDiagnostics } = collectSpans(project.root, chapters);
  for (const diagnostic of markerDiagnostics) addDiagnostic(diagnostic);

  const occurrencesById = new Map();
  for (const occurrence of occurrences) {
    if (!occurrencesById.has(occurrence.id)) occurrencesById.set(occurrence.id, []);
    occurrencesById.get(occurrence.id).push(occurrence);
  }

  for (const [id, spans] of occurrencesById) {
    if (!sceneIds.has(id)) {
      addDiagnostic(issue(
        "SCENE_MARKER_UNMATCHED",
        "error",
        `Scene marker ${id} has no scene record`,
        [id],
        "structural",
        "Add a scene record whose id matches the marker, or remove the marker."
      ));
    }
    if (spans.length > 1) {
      addDiagnostic(issue(
        "SCENE_SPAN_AMBIGUOUS",
        "error",
        `Scene ${id} matches ${spans.length} spans; a scene record must point at exactly one`,
        [id],
        "structural",
        "Leave one <!-- story-scene --> marker for this id."
      ));
    }
  }

  const scenes = new Map();
  const explicitEdges = [];
  const timestamps = new Map();

  for (const entry of sceneEntries) {
    const spans = occurrencesById.get(entry.id) ?? [];
    if (spans.length === 0) {
      addDiagnostic(issue(
        "SCENE_SPAN_MISSING",
        "error",
        `Scene ${entry.id} has no matching span in chapter source`,
        [entry.id],
        "structural",
        "Add <!-- story-scene: " + entry.id + " --> to its chapter, once."
      ));
    }
    const span = chooseSpan(spans, chapters);
    if (span && entry.record["chapter-id"] && span.chapterId !== entry.record["chapter-id"]) {
      addDiagnostic(issue(
        "SCENE_CHAPTER_MISMATCH",
        "error",
        `Scene ${entry.id} declares chapter ${entry.record["chapter-id"]} but its marker is in ${span.chapterId}`,
        [entry.id, entry.record["chapter-id"], span.chapterId],
        "structural",
        "Point chapter-id at the chapter that contains the scene marker."
      ));
    }

    const { beats, duplicateBeats } = beatOrder(span);
    for (const beatId of duplicateBeats) {
      addDiagnostic(issue(
        "DUPLICATE_BEAT_ID",
        "error",
        `Beat ${beatId} occurs more than once in scene ${entry.id}`,
        [beatId, entry.id],
        "structural",
        "Beat ids are unique within a scene. Rename or remove the duplicate marker."
      ));
    }

    const timestamp = parseTimestamp(entry.record.chronology, entry.id, addDiagnostic);
    timestamps.set(entry.id, timestamp);
    scenes.set(entry.id, {
      id: entry.id,
      chapterId: span?.chapterId ?? entry.record["chapter-id"] ?? null,
      path: span?.path ?? null,
      beats: beats.filter((beatId) => !duplicateBeats.has(beatId)),
      duplicateBeats,
      timestamp,
      span
    });

    const after = entry.record.chronology?.after;
    if (after === undefined) continue;
    if (!Array.isArray(after)) {
      addDiagnostic(issue(
        "MALFORMED_CHRONOLOGY",
        "error",
        `Scene ${entry.id} chronology.after must be a list of scene ids`,
        [entry.id],
        "declared",
        "Set chronology.after to a list of scene ids."
      ));
      continue;
    }
    const linked = new Set();
    for (const target of after) {
      if (typeof target !== "string" || target === "" || !sceneIds.has(target)) {
        addDiagnostic(issue(
          "MISSING_SCENE",
          "error",
          `Scene ${entry.id} is after missing scene ${String(target)}`,
          [entry.id, String(target)],
          "declared",
          "Point chronology.after at a scene that exists, or remove the edge."
        ));
        continue;
      }
      if (linked.has(target)) continue;
      linked.add(target);
      explicitEdges.push({ earlier: target, later: entry.id });
    }
  }

  const { cyclic, reach, contradicted, timestampEdges, compOf } = relateScenes(
    [...sceneIds],
    explicitEdges,
    timestamps,
    addDiagnostic
  );

  const constraints = [];
  const constraintKeys = new Set();
  const addConstraint = (earlier, later, reason) => {
    if (earlier === later) return;
    const key = `${earlier}\0${later}\0${reason}`;
    if (constraintKeys.has(key)) return;
    constraintKeys.add(key);
    constraints.push({ earlier, later, reason });
  };
  for (const edge of explicitEdges) addConstraint(edge.earlier, edge.later, "after");
  for (const edge of timestampEdges) addConstraint(edge.earlier, edge.later, "timestamp");
  constraints.sort((left, right) => left.earlier.localeCompare(right.earlier, "en")
    || left.later.localeCompare(right.later, "en")
    || left.reason.localeCompare(right.reason, "en"));

  // A cycle member has a declared edge even when it is a self-loop that adds
  // no constraint, so it is reported under `cyclic` and never as unplaced.
  const placed = new Set(cyclic.flat());
  for (const edge of constraints) {
    placed.add(edge.earlier);
    placed.add(edge.later);
  }
  const storyOrder = {
    constraints,
    cyclic,
    unplaced: [...sceneIds].filter((id) => !placed.has(id)).sort((left, right) => left.localeCompare(right, "en"))
  };

  const readingOrder = readingSequence(chapters, occurrences, scenes);
  const publicScenes = [...scenes.values()]
    .map((scene) => ({
      id: scene.id,
      chapterId: scene.chapterId,
      timestamp: scene.timestamp
    }))
    .sort((left, right) => left.id.localeCompare(right.id, "en"));

  return {
    readingOrder,
    storyOrder,
    scenes: publicScenes,
    diagnostics,
    compare(left, right) {
      return compareCursors(left, right, scenes, reach, contradicted, compOf, addDiagnostic);
    }
  };
}

function compareChapters(left, right) {
  const leftNumber = typeof left.record.number === "number" ? left.record.number : Number.POSITIVE_INFINITY;
  const rightNumber = typeof right.record.number === "number" ? right.record.number : Number.POSITIVE_INFINITY;
  return leftNumber - rightNumber || left.id.localeCompare(right.id, "en");
}

function collectSpans(root, chapters) {
  const occurrences = [];
  const markerDiagnostics = [];
  for (const chapter of chapters) {
    let body;
    try {
      const markdown = fs.readFileSync(path.join(root, chapter.path), "utf8");
      body = parseFrontmatter(markdown, chapter.path).body;
    } catch (error) {
      markerDiagnostics.push(issue(
        "CHAPTER_UNREADABLE",
        "error",
        `Could not read chapter ${chapter.id}: ${error.message}`,
        [chapter.id],
        "structural",
        "Repair the chapter file so its scene markers can be read."
      ));
      continue;
    }
    const markers = findMarkers(body);
    for (const diagnostic of markers.diagnostics) markerDiagnostics.push(diagnostic);
    for (const beat of markers.beats) {
      const owner = markers.scenes.find((scene) => beat.start >= scene.start && beat.start < scene.end);
      if (!owner) {
        markerDiagnostics.push(issue(
          "BEAT_OUTSIDE_SCENE",
          "error",
          `Beat ${beat.id} in ${chapter.path} is outside every scene span`,
          [beat.id, chapter.id],
          "structural",
          "Place the beat marker after a scene marker and before the next scene."
        ));
      }
    }
    markers.scenes.forEach((scene, index) => {
      const beats = markers.beats.filter((beat) => beat.start >= scene.start && beat.start < scene.end);
      occurrences.push({
        id: scene.id,
        chapterId: chapter.id,
        path: chapter.path,
        index,
        beats
      });
    });
  }
  return { occurrences, markerDiagnostics };
}

function chooseSpan(spans, chapters) {
  if (spans.length === 0) return null;
  const chapterIndex = new Map(chapters.map((chapter, index) => [chapter.id, index]));
  return spans.slice().sort((left, right) => {
    const leftChapter = chapterIndex.get(left.chapterId) ?? Number.POSITIVE_INFINITY;
    const rightChapter = chapterIndex.get(right.chapterId) ?? Number.POSITIVE_INFINITY;
    return leftChapter - rightChapter || left.index - right.index;
  })[0];
}

function beatOrder(span) {
  const beats = [];
  const seen = new Set();
  const duplicateBeats = new Set();
  for (const beat of span?.beats ?? []) {
    if (seen.has(beat.id)) duplicateBeats.add(beat.id);
    else {
      seen.add(beat.id);
      beats.push(beat.id);
    }
  }
  return { beats, duplicateBeats };
}

function readingSequence(chapters, occurrences, scenes) {
  const readingOrder = [];
  const placed = new Set();
  for (const chapter of chapters) {
    const inChapter = occurrences
      .filter((occurrence) => occurrence.chapterId === chapter.id)
      .sort((left, right) => left.index - right.index);
    for (const occurrence of inChapter) {
      if (placed.has(occurrence.id) || !scenes.has(occurrence.id)) continue;
      const scene = scenes.get(occurrence.id);
      if (scene.span !== occurrence) continue;
      placed.add(occurrence.id);
      readingOrder.push({
        sceneId: occurrence.id,
        chapterId: chapter.id,
        position: readingOrder.length,
        path: occurrence.path,
        beats: scene.beats
      });
    }
  }
  return readingOrder;
}

function relateScenes(sceneIds, explicitEdges, timestamps, addDiagnostic) {
  const components = stronglyConnected(sceneIds, explicitEdges);
  const compOf = new Map();
  const selfLoops = new Set(explicitEdges.filter((edge) => edge.earlier === edge.later).map((edge) => edge.earlier));
  const cyclicKeys = new Set();
  const cyclic = [];
  for (const members of components) {
    const key = members.slice().sort((left, right) => left.localeCompare(right, "en")).join("|");
    for (const id of members) compOf.set(id, key);
    const loop = members.length === 1 && selfLoops.has(members[0]);
    if (members.length > 1 || loop) {
      cyclicKeys.add(key);
      const ordered = members.slice().sort((left, right) => left.localeCompare(right, "en"));
      cyclic.push(ordered);
      addDiagnostic(issue(
        "CYCLE",
        "error",
        `Scenes form a chronology cycle: ${ordered.join(", ")}`,
        ordered,
        "declared",
        "Remove an after edge so story order is a partial order."
      ));
    }
  }
  cyclic.sort((left, right) => left[0].localeCompare(right[0], "en"));

  const dag = new Map();
  const link = (from, to) => {
    if (!from || !to || from === to) return;
    if (!dag.has(from)) dag.set(from, new Set());
    dag.get(from).add(to);
  };
  for (const edge of explicitEdges) link(compOf.get(edge.earlier), compOf.get(edge.later));

  const componentKeys = [...new Set(compOf.values())];
  let reach = reachableFrom(dag, componentKeys);
  const contradicted = new Set();
  const timestampEdges = [];
  const ids = sceneIds.slice().sort((left, right) => left.localeCompare(right, "en"));

  for (let leftIndex = 0; leftIndex < ids.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < ids.length; rightIndex += 1) {
      const left = ids[leftIndex];
      const right = ids[rightIndex];
      const relation = relateTimestamps(timestamps.get(left), timestamps.get(right));
      if (relation !== "before" && relation !== "after") continue;
      const earlier = relation === "before" ? left : right;
      const later = relation === "before" ? right : left;
      const earlierKey = compOf.get(earlier);
      const laterKey = compOf.get(later);
      const opposite = reach.get(laterKey)?.has(earlierKey) === true;
      const sameCycle = earlierKey === laterKey && cyclicKeys.has(earlierKey);
      if (opposite || sameCycle) {
        contradicted.add(pairKey(earlier, later));
        addDiagnostic(issue(
          "CONTRADICTORY_TIMESTAMP",
          "error",
          `Timestamp order puts ${earlier} before ${later}, which contradicts the declared after edges`,
          [earlier, later],
          "declared",
          "Change the timestamp or the after edge so they agree, or remove one of them."
        ));
        continue;
      }
      if (reach.get(earlierKey)?.has(laterKey) === true) continue;
      link(earlierKey, laterKey);
      timestampEdges.push({ earlier, later });
      reach = reachableFrom(dag, componentKeys);
    }
  }

  return { cyclic, reach, contradicted, timestampEdges, compOf };
}

function compareCursors(leftValue, rightValue, scenes, reach, contradicted, compOf, addDiagnostic) {
  const left = normalizeCursor(leftValue);
  const right = normalizeCursor(rightValue);
  if (left === null || left === "baseline" || right === null || right === "baseline") {
    addDiagnostic(issue(
      "INVALID_CURSOR",
      "error",
      "A chronology cursor needs a scene id and a before or after side",
      [],
      "structural",
      "Pass a scene entry, beat, or scene exit cursor."
    ));
    return "unordered";
  }

  const leftPlace = placeCursor(left, scenes, addDiagnostic);
  const rightPlace = placeCursor(right, scenes, addDiagnostic);
  if (!leftPlace || !rightPlace) return "unordered";
  if (left.sceneId === right.sceneId) {
    if (leftPlace.index === rightPlace.index) return "equal";
    return leftPlace.index < rightPlace.index ? "before" : "after";
  }
  if (contradicted.has(pairKey(left.sceneId, right.sceneId))) return "unordered";
  const leftKey = compOf.get(left.sceneId);
  const rightKey = compOf.get(right.sceneId);
  if (leftKey === undefined || rightKey === undefined) return "unordered";
  if (leftKey === rightKey) return "unordered";
  if (reach.get(leftKey)?.has(rightKey)) return "before";
  if (reach.get(rightKey)?.has(leftKey)) return "after";
  return "unordered";
}

function placeCursor(cursor, scenes, addDiagnostic) {
  const scene = scenes.get(cursor.sceneId);
  if (!scene) {
    addDiagnostic(issue(
      "MISSING_SCENE",
      "error",
      `Cursor references missing scene ${cursor.sceneId}`,
      [cursor.sceneId],
      "declared",
      "Point the cursor at a scene record that exists."
    ));
    return null;
  }
  if (!cursor.beatId) {
    const index = cursor.side === "before" ? 0 : scene.beats.length * 2 + 1;
    return { index };
  }
  if (scene.duplicateBeats.has(cursor.beatId)) return null;
  const beatIndex = scene.beats.indexOf(cursor.beatId);
  if (beatIndex < 0) {
    addDiagnostic(issue(
      "MISSING_BEAT",
      "error",
      `Cursor references missing beat ${cursor.beatId} in scene ${cursor.sceneId}`,
      [cursor.beatId, cursor.sceneId],
      "declared",
      "Declare the beat with <!-- story-beat: " + cursor.beatId + " --> inside the scene, or remove the reference."
    ));
    return null;
  }
  return { index: cursor.side === "before" ? beatIndex * 2 + 1 : beatIndex * 2 + 2 };
}

function pairKey(left, right) {
  return [left, right].sort((a, b) => a.localeCompare(b, "en")).join("\0");
}

function stronglyConnected(nodes, edges) {
  let index = 0;
  const stack = [];
  const indices = new Map();
  const low = new Map();
  const onStack = new Set();
  const components = [];
  const outgoing = new Map(nodes.map((id) => [id, []]));
  for (const edge of edges) {
    if (outgoing.has(edge.earlier) && outgoing.has(edge.later)) outgoing.get(edge.earlier).push(edge.later);
  }

  function strongConnect(node) {
    indices.set(node, index);
    low.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of outgoing.get(node) ?? []) {
      if (!indices.has(next)) {
        strongConnect(next);
        low.set(node, Math.min(low.get(node), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node), indices.get(next)));
      }
    }
    if (low.get(node) === indices.get(node)) {
      const component = [];
      let current;
      do {
        current = stack.pop();
        onStack.delete(current);
        component.push(current);
      } while (current !== node);
      components.push(component);
    }
  }

  for (const node of nodes) {
    if (!indices.has(node)) strongConnect(node);
  }
  return components;
}

function reachableFrom(dag, keys) {
  const memo = new Map();
  function walk(key, stack) {
    if (memo.has(key)) return memo.get(key);
    const seen = new Set();
    memo.set(key, seen);
    stack.add(key);
    for (const next of dag.get(key) ?? []) {
      if (stack.has(next)) continue;
      seen.add(next);
      for (const item of walk(next, stack)) seen.add(item);
    }
    stack.delete(key);
    return seen;
  }
  for (const key of keys) walk(key, new Set());
  return memo;
}

function relateTimestamps(left, right) {
  if (!left || !right) return "unordered";
  if (left.precision === "instant" && right.precision === "instant") {
    if (left.utc === right.utc) return "equal";
    return left.utc < right.utc ? "before" : "after";
  }
  if (left.precision === "date" && right.precision === "date") {
    if (left.day === right.day) return "equal";
    return left.day < right.day ? "before" : "after";
  }
  if (left.precision === "civil" && right.precision === "civil") {
    if (left.day === right.day && left.seconds === right.seconds) return "equal";
    if (left.day !== right.day) return left.day < right.day ? "before" : "after";
    return left.seconds < right.seconds ? "before" : "after";
  }
  if ((left.precision === "date" && right.precision === "civil") || (left.precision === "civil" && right.precision === "date")) {
    if (left.day === right.day) return "unordered";
    return left.day < right.day ? "before" : "after";
  }
  return "unordered";
}

function parseTimestamp(chronology, sceneId, addDiagnostic) {
  if (chronology === undefined || chronology === null) return null;
  if (typeof chronology !== "object" || Array.isArray(chronology)) {
    return failTimestamp(sceneId, addDiagnostic, "chronology must be a mapping");
  }
  const date = fieldText(chronology.date);
  const time = fieldText(chronology.time);
  if (date?.invalid || time?.invalid) return failTimestamp(sceneId, addDiagnostic, "date and time must be strings");
  const dateText = date?.text;
  const timeText = time?.text;
  if (dateText === undefined && timeText === undefined) return null;

  if (timeText !== undefined) {
    const instant = INSTANT_PATTERN.exec(timeText);
    if (instant) {
      if (dateText !== undefined && dateText !== instant[1]) {
        return failTimestamp(sceneId, addDiagnostic, "date and instant disagree");
      }
      if (!validDateText(instant[1]) || !validClock(instant[2])) {
        return failTimestamp(sceneId, addDiagnostic, `instant ${timeText} is not a real timestamp`);
      }
      const utc = Date.parse(`${instant[1]}T${normalizeClock(instant[2])}${instant[3]}`);
      if (Number.isNaN(utc)) return failTimestamp(sceneId, addDiagnostic, `instant ${timeText} is not a real timestamp`);
      return { precision: "instant", utc };
    }
    const localDateTime = LOCAL_DATETIME_PATTERN.exec(timeText);
    if (localDateTime) {
      if (dateText !== undefined && dateText !== localDateTime[1]) {
        return failTimestamp(sceneId, addDiagnostic, "date and civil time disagree");
      }
      if (!validDateText(localDateTime[1]) || !validClock(localDateTime[2])) {
        return failTimestamp(sceneId, addDiagnostic, `civil time ${timeText} is not a real timestamp`);
      }
      return { precision: "civil", day: localDateTime[1], seconds: clockSeconds(localDateTime[2]) };
    }
  }

  if (dateText === undefined || !validDateText(dateText)) {
    return failTimestamp(sceneId, addDiagnostic, "a clock needs a real calendar date, and a date must be YYYY-MM-DD");
  }
  if (timeText === undefined) return { precision: "date", day: dateText };

  const zoned = ZONED_CLOCK_PATTERN.exec(timeText);
  if (zoned) {
    if (!validClock(`${zoned[1]}:${zoned[2]}${zoned[3] === undefined ? "" : `:${zoned[3]}`}`)) {
      return failTimestamp(sceneId, addDiagnostic, `time ${timeText} is not a real clock time`);
    }
    const clock = normalizeClock(`${zoned[1]}:${zoned[2]}${zoned[3] === undefined ? "" : `:${zoned[3]}`}`);
    const utc = Date.parse(`${dateText}T${clock}${zoned[4]}`);
    if (Number.isNaN(utc)) return failTimestamp(sceneId, addDiagnostic, `time ${timeText} is not a real instant`);
    return { precision: "instant", utc };
  }

  if (!CLOCK_PATTERN.test(timeText) || !validClock(timeText)) {
    return failTimestamp(sceneId, addDiagnostic, `time ${timeText} is not a clock time or an explicit instant`);
  }
  return { precision: "civil", day: dateText, seconds: clockSeconds(timeText) };
}

function fieldText(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return { invalid: true };
  return { text: value.trim() };
}

function failTimestamp(sceneId, addDiagnostic, detail) {
  addDiagnostic(issue(
    "MALFORMED_TIMESTAMP",
    "error",
    `Scene ${sceneId} has a malformed timestamp: ${detail}`,
    [sceneId],
    "declared",
    "Use YYYY-MM-DD for a date, HH:MM[:SS] for civil time, or an explicit offset/Z for an instant."
  ));
  return null;
}

function validDateText(text) {
  const match = DATE_PATTERN.exec(text);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

function validClock(text) {
  const match = CLOCK_PATTERN.exec(text);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  return hours <= 23 && minutes <= 59 && seconds <= 59;
}

function normalizeClock(text) {
  const match = CLOCK_PATTERN.exec(text);
  const seconds = match[3] === undefined ? "00" : match[3];
  return `${match[1]}:${match[2]}:${seconds}`;
}

function clockSeconds(text) {
  const match = CLOCK_PATTERN.exec(text);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + seconds;
}

function issue(code, severity, message, recordIds, evidence, action) {
  return { code, severity, message, recordIds, sources: [], evidence, action };
}
