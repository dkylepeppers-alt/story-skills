import { validateDocument } from "../project/schema.js";
import { sha256Hex } from "../storage/hash.js";
import { findMarkers } from "../storage/spans.js";
import { diffHunks } from "./diff.js";

/**
 * Edit scope checks (design §8). A ScopeSpec names files and the exact
 * half-open UTF-8 byte ranges `[start, end)` of their baseline that an edit
 * may change. Everything outside the ranges must survive byte for byte and in
 * order.
 *
 * Boundary rule (also documented in schemas/scope.schema.json): a range owns
 * both of its boundaries, so text may be inserted at `start` or at `end`.
 * Replacing a range's bytes can always be written as an insertion at its
 * start, so no narrower rule is observable in the edited bytes. An empty range
 * `[p, p)` permits insertion at `p` only. Overlapping and touching ranges
 * merge. A listed file without `ranges` may change freely, including being
 * deleted; `ranges: []` allows no change.
 *
 * The verdict asks whether some in-scope edit produces the edited bytes, so
 * an ambiguous diff of repeated text never invents a violation. Violations
 * are then located with a token diff for before/after evidence.
 */

const EMPTY_HASH = sha256Hex(Buffer.alloc(0));

function finding(code, severity, message, sources = [], action) {
  return { code, severity, message, recordIds: [], sources, evidence: "structural", action };
}

function isContinuation(buffer, offset) {
  return offset > 0 && offset < buffer.length && (buffer[offset] & 0xc0) === 0x80;
}

function excerpt(text) {
  return JSON.stringify(text.length > 80 ? `${text.slice(0, 77)}...` : text);
}

function rangeProblems(before, ranges, label) {
  const problems = [];
  for (const [index, range] of ranges.entries()) {
    const where = `${label} range ${index + 1} [${range.start}, ${range.end})`;
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0) problems.push(`${where} needs integer offsets of at least 0`);
    else if (range.start > range.end) problems.push(`${where} starts after it ends`);
    else if (range.end > before.length) problems.push(`${where} ends past the baseline's ${before.length} bytes`);
    else {
      for (const offset of [range.start, range.end]) {
        if (isContinuation(before, offset)) {
          problems.push(`${where}: byte ${offset} is inside a UTF-8 character`);
          break;
        }
      }
    }
  }
  return problems;
}

function mergeRanges(ranges) {
  const sorted = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end);
  const merged = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ start: range.start, end: range.end });
  }
  return merged;
}

// Whether `after` is `before` with only the merged ranges replaced. Fixed
// segments must appear in order; leftmost matching is complete for this
// pattern. Returns the replacement for each range, or null.
function matchRanges(before, after, ranges) {
  const fixed = [];
  let cursor = 0;
  for (const range of ranges) {
    fixed.push(before.subarray(cursor, range.start));
    cursor = range.end;
  }
  fixed.push(before.subarray(cursor));
  const head = fixed[0];
  const tail = fixed[fixed.length - 1];
  if (head.length + tail.length > after.length) return null;
  if (!after.subarray(0, head.length).equals(head)) return null;
  if (!after.subarray(after.length - tail.length).equals(tail)) return null;
  const limit = after.length - tail.length;
  const replacements = [];
  let position = head.length;
  for (let index = 1; index < fixed.length - 1; index += 1) {
    const found = after.subarray(0, limit).indexOf(fixed[index], position);
    if (found < 0) return null;
    replacements.push([position, found]);
    position = found + fixed[index].length;
  }
  replacements.push([position, limit]);
  return replacements.map(([start, end], index) => ({ range: ranges[index], start, end }));
}

function covered(hunk, ranges) {
  return ranges.some((range) => range.start <= hunk.before.start && hunk.before.end <= range.end);
}

function violation(path, before, after, hunk) {
  return {
    path,
    before: { start: hunk.before.start, end: hunk.before.end, text: before.subarray(hunk.before.start, hunk.before.end).toString("utf8") },
    after: { start: hunk.after.start, end: hunk.after.end, text: after.subarray(hunk.after.start, hunk.after.end).toString("utf8") }
  };
}

function violationFinding(item) {
  const { path, before, after } = item;
  return finding(
    "EDIT_OUT_OF_SCOPE",
    "error",
    `${path} bytes ${before.start}-${before.end} changed outside the allowed ranges: ${excerpt(before.text)} -> ${excerpt(after.text)}`,
    [
      { path, start: before.start, end: before.end, hash: sha256Hex(Buffer.from(before.text, "utf8")), kind: "baseline" },
      { path, start: after.start, end: after.end, hash: sha256Hex(Buffer.from(after.text, "utf8")), kind: "working" }
    ],
    "Restore the text outside the declared ranges, or widen the scope explicitly if the author allows it."
  );
}

function markerSequence(buffer) {
  const { scenes, beats } = findMarkers(buffer.toString("utf8"));
  return [...scenes.map((item) => [item.start, `scene:${item.id}`]), ...beats.map((item) => [item.start, `beat:${item.id}`])]
    .sort((left, right) => left[0] - right[0])
    .map((item) => item[1])
    .join("\n");
}

// The changed part of one replacement, trimmed of the bytes it shares with
// the range it replaced, as a baseline span.
function changedSpan(before, after, replacement) {
  const old = before.subarray(replacement.range.start, replacement.range.end);
  const next = after.subarray(replacement.start, replacement.end);
  let prefix = 0;
  while (prefix < old.length && prefix < next.length && old[prefix] === next[prefix]) prefix += 1;
  let suffix = 0;
  while (suffix < old.length - prefix && suffix < next.length - prefix
    && old[old.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix += 1;
  let start = replacement.range.start + prefix;
  let end = replacement.range.end - suffix;
  while (isContinuation(before, start)) start -= 1;
  while (end > start && isContinuation(before, end)) end += 1;
  return { start, end };
}

function restrictionFindings(path, before, after, replacements, restriction) {
  const kinds = restriction === "dialogue" ? new Set(["dialogue"]) : new Set(["dialogue", "tag-or-beat"]);
  const candidates = dialogueCandidates(before).filter((item) => kinds.has(item.kind));
  const findings = [];
  for (const replacement of replacements) {
    const span = changedSpan(before, after, replacement);
    if (before.subarray(replacement.range.start, replacement.range.end).equals(after.subarray(replacement.start, replacement.end))) continue;
    if (candidates.some((item) => item.start <= span.start && span.end <= item.end)) continue;
    const text = before.subarray(span.start, span.end).toString("utf8");
    findings.push(finding(
      "DIALOGUE_RESTRICTION_CANDIDATE",
      "warning",
      `${path} bytes ${span.start}-${span.end} (${excerpt(text)}) changed outside the quoted ${restriction === "dialogue" ? "dialogue" : "dialogue, tags and beats"} that quote detection found; quote detection is advisory, so verify the change is allowed`,
      [{ path, start: span.start, end: span.end, hash: sha256Hex(Buffer.from(text, "utf8")), kind: "baseline" }],
      "Check the change against the author's restriction; the declared ranges, not quote detection, decide the scope."
    ));
  }
  return findings;
}

/**
 * Checks one file's edit against its scope entry. `after` is null when the
 * file was deleted.
 *
 * @returns {{ ok: boolean, path: string, changed: boolean, replacements: object[], violations: object[], diagnostics: object[] }}
 */
export function checkScope(before, after, fileScope, options = {}) {
  const path = options.path ?? fileScope.path ?? "file";
  const report = { ok: true, path, changed: after === null || !before.equals(after), replacements: [], violations: [], diagnostics: [] };
  const fail = (diagnostic) => {
    report.diagnostics.push(diagnostic);
    report.ok = false;
    return report;
  };
  if (sha256Hex(before) !== fileScope["baseline-hash"]) {
    return fail(finding("SCOPE_BASELINE_MISMATCH", "error",
      `${path}: the scope's baseline-hash does not match the baseline bytes (${sha256Hex(before)})`, [],
      "Build the scope against the same baseline revision, or pick the matching --since."));
  }
  if (fileScope.ranges === undefined) return report;
  const problems = rangeProblems(before, fileScope.ranges, path);
  if (problems.length > 0) {
    for (const problem of problems) {
      report.diagnostics.push(finding("SCOPE_INVALID", "error", problem, [], "Give each range UTF-8 character-boundary offsets inside the baseline file."));
    }
    report.ok = false;
    return report;
  }
  if (after === null) {
    return fail(finding("EDIT_OUT_OF_SCOPE", "error", `${path} was deleted, but its scope allows only the listed ranges to change`, [],
      "Restore the file, or list it without ranges if the author allows removing it."));
  }
  if (!report.changed) return report;

  const ranges = mergeRanges(fileScope.ranges);
  const matched = matchRanges(before, after, ranges);
  if (matched === null) {
    let hunks = diffHunks(before, after).filter((hunk) => !covered(hunk, ranges));
    // Unreachable in practice (a fully covered diff implies a match); if it
    // ever happens, report the whole changed middle rather than nothing.
    if (hunks.length === 0) hunks = diffHunks(before, after, { coarse: true });
    for (const hunk of hunks) {
      const item = violation(path, before, after, hunk);
      report.violations.push(item);
      report.diagnostics.push(violationFinding(item));
    }
    report.ok = false;
    return report;
  }
  report.replacements = matched
    .filter((item) => !before.subarray(item.range.start, item.range.end).equals(after.subarray(item.start, item.end)))
    .map((item) => ({
      start: item.range.start,
      end: item.range.end,
      before: before.subarray(item.range.start, item.range.end).toString("utf8"),
      after: after.subarray(item.start, item.end).toString("utf8")
    }));
  if ((fileScope.markers ?? "locked") === "locked" && markerSequence(before) !== markerSequence(after)) {
    fail(finding("MARKER_EDIT_UNDECLARED", "error",
      `${path}: the edit adds, removes or renames story scene or beat markers, which this scope does not declare editable`, [],
      "Restore the markers, or set markers: editable in the scope when the author allows tag or beat edits."));
  }
  if (fileScope.restriction !== undefined) {
    report.diagnostics.push(...restrictionFindings(path, before, after, matched, fileScope.restriction));
  }
  return report;
}

const OPENERS = new Map([["“", ["”"]], ["„", ["“", "”"]], ["«", ["»"]], ["\"", ["\""]]]);
const MARKER_LINE = /^\s*<!--\s*story-(?:scene|beat):/;

/**
 * Candidate dialogue ranges, for an agent choosing an explicit scope. Quoted
 * content (inside the marks) is `dialogue`; the rest of a paragraph that
 * contains dialogue is `tag-or-beat` (speech tags and action beats). This is
 * advisory: it never decides a scope and never proves narration unchanged.
 * Single quotes are not treated as dialogue because they double as
 * apostrophes. An unclosed quote runs to the end of its paragraph.
 *
 * @returns {{ start: number, end: number, kind: "dialogue"|"tag-or-beat", text: string }[]}
 */
export function dialogueCandidates(buffer) {
  const text = buffer.toString("utf8");
  const paragraphs = [];
  let current = null;
  let offset = 0;
  for (const line of text.split(/(?<=\n)/)) {
    const bytes = Buffer.byteLength(line, "utf8");
    const content = line.replace(/\r?\n$/, "");
    if (content.trim() === "" || MARKER_LINE.test(content)) {
      current = null;
    } else {
      if (current === null) {
        current = { start: offset, text: "" };
        paragraphs.push(current);
      }
      current.text += line;
    }
    offset += bytes;
  }
  const candidates = [];
  for (const paragraph of paragraphs) candidates.push(...paragraphCandidates(paragraph.text.replace(/\r?\n$/, ""), paragraph.start));
  return candidates;
}

// Quote marks are single UTF-16 code units, so string indices are safe here;
// offsets are converted to UTF-8 bytes at the end.
function paragraphCandidates(text, base) {
  const pieces = [];
  let plain = 0;
  let index = 0;
  while (index < text.length) {
    const closers = OPENERS.get(text[index]);
    if (!closers) {
      index += 1;
      continue;
    }
    let close = index + 1;
    while (close < text.length && !closers.includes(text[close])) close += 1;
    pieces.push(["tag-or-beat", plain, index], ["dialogue", index + 1, close]);
    index = close + 1;
    plain = index;
  }
  if (pieces.length === 0) return [];
  pieces.push(["tag-or-beat", plain, text.length]);
  const found = [];
  for (const [kind, from, to] of pieces) {
    const slice = text.slice(from, to);
    const lead = kind === "dialogue" ? 0 : slice.length - slice.trimStart().length;
    const value = kind === "dialogue" ? slice : slice.trim();
    if (value === "") continue;
    const start = base + Buffer.byteLength(text.slice(0, from + lead), "utf8");
    found.push({ start, end: start + Buffer.byteLength(value, "utf8"), kind, text: value });
  }
  return found;
}

/**
 * Checks a whole ScopeSpec. `baseline` and `current` map project-relative
 * paths to bytes. A changed, added or deleted file that the scope does not
 * list is out of scope. A file absent from the baseline is checked against
 * empty bytes, so listing a new file takes the empty-content hash.
 *
 * @returns {{ ok: boolean, files: object[], diagnostics: object[] }}
 */
export function checkScopeSpec(spec, baseline, current) {
  const invalid = validateDocument(spec, "scope");
  if (invalid.length > 0) {
    return {
      ok: false,
      files: [],
      diagnostics: invalid.map((item) => finding("SCOPE_INVALID", "error", `scope: ${item.message}`, [], "Fix the scope document to match schemas/scope.schema.json."))
    };
  }
  const diagnostics = [];
  const files = [];
  const listed = new Set();
  for (const entry of spec.files) {
    if (listed.has(entry.path)) {
      diagnostics.push(finding("SCOPE_INVALID", "error", `scope lists ${entry.path} more than once`, [], "List each file once, with all of its ranges."));
      continue;
    }
    listed.add(entry.path);
    const before = baseline.get(entry.path) ?? Buffer.alloc(0);
    const after = current.has(entry.path) ? current.get(entry.path) : null;
    const report = after === null && !baseline.has(entry.path) && entry["baseline-hash"] === EMPTY_HASH
      ? { ok: true, path: entry.path, changed: false, replacements: [], violations: [], diagnostics: [] }
      : checkScope(before, after, entry, { path: entry.path });
    files.push(report);
    diagnostics.push(...report.diagnostics);
  }
  const paths = [...new Set([...baseline.keys(), ...current.keys()])].sort();
  for (const path of paths) {
    if (listed.has(path)) continue;
    const before = baseline.get(path);
    const after = current.get(path);
    if (before && after && before.equals(after)) continue;
    const what = !before ? "was added" : !after ? "was deleted" : "changed";
    diagnostics.push(finding("EDIT_OUT_OF_SCOPE", "error", `${path} ${what} but is not in the scope`, [],
      "Restore the file, or add it to the scope if the author allows the change."));
  }
  return { ok: !diagnostics.some((item) => item.severity === "error"), files, diagnostics };
}
