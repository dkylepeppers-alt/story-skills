/**
 * Story-time cursors. Scene entry is before every beat in the scene; scene
 * exit is after every beat. `valid-from` is inclusive and `valid-until` is
 * exclusive. Frontmatter cursors use `scene`/`beat`; in-memory cursors use
 * `sceneId`/`beatId`.
 */

export function sceneEntry(sceneId) {
  return { sceneId, side: "before" };
}

export function sceneExit(sceneId) {
  return { sceneId, side: "after" };
}

export function beatCursor(sceneId, beatId, side) {
  return { sceneId, beatId, side };
}

/**
 * @param {object|string|null|undefined} value
 * @returns {object|string|null} A cursor, `"baseline"`, or null when the value is not a cursor.
 */
export function normalizeCursor(value) {
  if (value === "baseline") return "baseline";
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) return null;
  const sceneId = value.sceneId ?? value.scene;
  const side = value.side;
  if (typeof sceneId !== "string" || sceneId === "" || (side !== "before" && side !== "after")) return null;
  const beatId = value.beatId ?? value.beat;
  const cursor = { sceneId, side };
  if (typeof beatId === "string" && beatId !== "") cursor.beatId = beatId;
  return cursor;
}

/**
 * Whether a fact's validity window includes `at`. Returns `unresolved` when
 * chronology cannot place the query relative to a boundary that would otherwise
 * decide the question. A boundary that already excludes the query wins over an
 * unresolved boundary.
 *
 * @returns {true|false|"unresolved"}
 */
export function appliesAt(chronology, fact, at) {
  const query = normalizeCursor(at);
  if (query === null || query === "baseline") return "unresolved";

  const fromRaw = fact["valid-from"] ?? fact.validFrom;
  const untilRaw = fact["valid-until"] ?? fact.validUntil;
  const from = fromRaw === undefined ? "baseline" : normalizeCursor(fromRaw);
  if (from === null) return "unresolved";
  const until = untilRaw === undefined || untilRaw === null ? null : normalizeCursor(untilRaw);
  if (untilRaw !== undefined && untilRaw !== null && (until === null || until === "baseline")) return "unresolved";

  let started = true;
  if (from !== "baseline") {
    const relation = chronology.compare(from, query);
    if (relation === "unordered") started = "unresolved";
    else if (relation === "after") started = false;
  }

  let ended = false;
  if (until !== null) {
    const relation = chronology.compare(until, query);
    if (relation === "unordered") ended = "unresolved";
    else if (relation === "before" || relation === "equal") ended = true;
  }

  if (started === false || ended === true) return false;
  if (started === "unresolved" || ended === "unresolved") return "unresolved";
  return true;
}
