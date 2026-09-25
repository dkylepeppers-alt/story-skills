import fs from "node:fs";
import { FRONTMATTER_PATTERN } from "./document.js";
import { resolveWithinRoot } from "./paths.js";
import { StorageError } from "../contracts.js";

// Scene and beat markers anchor spans inside chapter bodies. The documented
// syntax is a whole HTML comment of the form
//   <!-- story-scene: scn_7f83d6a2 -->   /   <!-- story-beat: beat_key_handoff -->
// optionally indented, with ids limited to lowercase letters, digits,
// underscores and hyphens. A comment that looks like a marker but does not
// match this syntax is reported as MALFORMED_MARKER rather than silently
// treated as prose or as an anchor.
const SCENE_MARKER_PATTERN = /^[ \t]*<!--\s+story-scene:\s+([a-z0-9][a-z0-9_-]*)\s*-->\s*$/;
const BEAT_MARKER_PATTERN = /^[ \t]*<!--\s+story-beat:\s+([a-z0-9][a-z0-9_-]*)\s*-->\s*$/;
const MARKER_LOOKALIKE_PATTERN = /<!--\s*story-(?:scene|beat):/;

/**
 * Marker-boundary convention (the single convention used by all hashing and
 * range operations): a span starts at the first byte of the line containing
 * the selected marker, and ends immediately before the first byte of the line
 * containing the next marker of the same kind, or at the end of the body. The
 * marker comment itself is inside its span; frontmatter is never part of a
 * scene or beat span. Beat spans end at the next beat marker within the scene
 * or at the scene span's end.
 *
 * Spans operate on the decoded UTF-8 text of the file body; hashing encodes
 * exactly the selected substring, so hashes always cover actual source bytes.
 */

export function findMarkers(body) {
  const lines = body.split(/(?<=\n)/);
  const scenes = [];
  const beats = [];
  const diagnostics = [];
  let offset = 0;

  for (const line of lines) {
    const content = line.replace(/\r?\n$/, "");
    const sceneMatch = SCENE_MARKER_PATTERN.exec(content);
    const beatMatch = sceneMatch ? null : BEAT_MARKER_PATTERN.exec(content);
    if (sceneMatch) {
      scenes.push({ id: sceneMatch[1], start: offset, end: offset });
    } else if (beatMatch) {
      beats.push({ id: beatMatch[1], start: offset, end: offset });
    } else if (MARKER_LOOKALIKE_PATTERN.test(content)) {
      diagnostics.push({
        code: "MALFORMED_MARKER",
        severity: "error",
        message: `Marker comment does not match the documented syntax: ${content.trim()}`,
        recordIds: [],
        sources: [],
        evidence: "structural",
        action: "Rewrite the marker as <!-- story-scene: <scene-id> --> or <!-- story-beat: <beat-id> --> with a lowercase id."
      });
    }
    offset += line.length;
  }

  for (const scene of scenes) {
    const next = scenes.find((other) => other.start > scene.start);
    scene.end = next ? next.start : body.length;
  }
  for (const beat of beats) {
    const containingScene = [...scenes].reverse().find((scene) => scene.start <= beat.start);
    const nextBeat = beats.find((other) => other.start > beat.start
      && (!containingScene || other.start < containingScene.end));
    beat.end = nextBeat ? nextBeat.start : containingScene ? containingScene.end : body.length;
  }

  return { scenes, beats, diagnostics };
}

/** Strips well-formed scene and beat marker lines, e.g. for word counts. */
export function stripMarkers(text) {
  return text
    .split(/(?<=\n)/)
    .filter((line) => {
      const content = line.replace(/\r?\n$/, "");
      return !(SCENE_MARKER_PATTERN.test(content) || BEAT_MARKER_PATTERN.test(content));
    })
    .join("");
}

/**
 * Selects the exact source span for a SourceRef over real file bytes. With a
 * sceneId the selection is a body span (frontmatter excluded) per the marker
 * convention above; without one the whole file — frontmatter included — is
 * the selected source, so any edit marks the reference stale. `start`/`end`
 * are offsets in the decoded file text; `bytes` carries the exact UTF-8
 * encoding of the selected span, which is what hashing covers.
 */
export function readSourceSpan(root, ref) {
  const absPath = resolveWithinRoot(root, ref.path);
  const bytes = fs.readFileSync(absPath);
  const text = bytes.toString("utf8");

  if (!ref.sceneId) {
    return { text, bytes, start: 0, end: bytes.length };
  }

  const frontmatter = FRONTMATTER_PATTERN.exec(text);
  const body = frontmatter ? text.slice(frontmatter[0].length) : text;
  const bodyOffset = frontmatter ? frontmatter[0].length : 0;
  const markers = findMarkers(body);

  const scene = markers.scenes.find((marker) => marker.id === ref.sceneId);
  if (!scene) {
    throw new StorageError("SCENE_NOT_FOUND", `No scene marker ${ref.sceneId} in ${ref.path}`);
  }

  if (!ref.beatId) {
    const span = body.slice(scene.start, scene.end);
    return { text: span, bytes: Buffer.from(span, "utf8"), start: bodyOffset + scene.start, end: bodyOffset + scene.end };
  }

  const beat = markers.beats.find((marker) => marker.id === ref.beatId
    && marker.start >= scene.start && marker.end <= scene.end);
  if (!beat) {
    throw new StorageError("BEAT_NOT_FOUND", `No beat marker ${ref.beatId} in scene ${ref.sceneId} of ${ref.path}`);
  }
  const span = body.slice(beat.start, beat.end);
  return { text: span, bytes: Buffer.from(span, "utf8"), start: bodyOffset + beat.start, end: bodyOffset + beat.end };
}
