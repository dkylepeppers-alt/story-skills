import { describe, expect, test } from "bun:test";
import { diffHunks } from "../src/changes/diff.js";
import { checkScope, checkScopeSpec, dialogueCandidates } from "../src/changes/scope.js";
import { FORMAT, SCHEMA_VERSION } from "../src/contracts.js";
import { validateDocument } from "../src/project/schema.js";
import { sha256Hex } from "../src/storage/hash.js";

// Test helper: a one-file scope over the byte offsets of `text` in `before`
// (its `occurrence`-th match). This is not a production quote classifier.
function scopeForText(before, text, occurrence = 0) {
  const needle = Buffer.from(text);
  let start = -1;
  for (let index = 0; index <= occurrence; index += 1) start = before.indexOf(needle, start + 1);
  if (start < 0) throw new Error(`No occurrence ${occurrence} of ${text}`);
  return { "baseline-hash": sha256Hex(before), ranges: [{ start, end: start + needle.length }] };
}

function scopeFor(before, ranges, extra = {}) {
  return { "baseline-hash": sha256Hex(before), ranges, ...extra };
}

const codes = (report) => report.diagnostics.map((item) => item.code);

describe("checkScope", () => {
  test("a dialogue edit cannot alter narration outside its allowed range", () => {
    const before = Buffer.from("Ada paused. “Wait.”\n");
    const after = Buffer.from("Ada smiled. “Stay.”\n");
    const scope = scopeForText(before, "“Wait.”");
    const report = checkScope(before, after, scope);
    expect(report.diagnostics.map((d) => d.code)).toContain("EDIT_OUT_OF_SCOPE");
  });

  test("an edit inside the range passes and reports the replacement", () => {
    const before = Buffer.from("Ada paused. “Wait.”\n");
    const after = Buffer.from("Ada paused. “Stay a while.”\n");
    const report = checkScope(before, after, scopeForText(before, "Wait."));
    expect(report).toMatchObject({ ok: true, changed: true, violations: [] });
    expect(report.diagnostics).toEqual([]);
    expect(report.replacements).toEqual([{ start: 15, end: 20, before: "Wait.", after: "Stay a while." }]);
    expect(checkScope(before, before, scopeForText(before, "Wait."))).toMatchObject({ ok: true, changed: false, replacements: [] });
  });

  test("violations carry before and after evidence as byte spans", () => {
    const before = Buffer.from("Ada paused. “Wait.”\n");
    const after = Buffer.from("Ada smiled. “Stay.”\n");
    const report = checkScope(before, after, scopeForText(before, "Wait."), { path: "chapters/one.md" });
    expect(report.ok).toBe(false);
    expect(report.violations).toEqual([{
      path: "chapters/one.md",
      before: { start: 4, end: 10, text: "paused" },
      after: { start: 4, end: 10, text: "smiled" }
    }]);
    const [diagnostic] = report.diagnostics;
    expect(diagnostic).toMatchObject({ code: "EDIT_OUT_OF_SCOPE", severity: "error", evidence: "structural" });
    expect(diagnostic.message).toContain("chapters/one.md bytes 4-10");
    expect(diagnostic.message).toContain("\"paused\" -> \"smiled\"");
    expect(diagnostic.sources.map((item) => item.kind)).toEqual(["baseline", "working"]);
  });

  test("a range owns both boundaries; an empty range is one insertion point", () => {
    const before = Buffer.from("AB|CD|EF");
    const scope = scopeFor(before, [{ start: 3, end: 5 }]);
    expect(checkScope(before, Buffer.from("AB|xCD|EF"), scope).ok).toBe(true);
    expect(checkScope(before, Buffer.from("AB|CDx|EF"), scope).ok).toBe(true);
    expect(checkScope(before, Buffer.from("AB|xyz|EF"), scope).ok).toBe(true);
    expect(checkScope(before, Buffer.from("AB||EF"), scope).ok).toBe(true);
    expect(checkScope(before, Buffer.from("ABx|CD|EF"), scope).ok).toBe(false);
    expect(checkScope(before, Buffer.from("AB|CD|xEF"), scope).ok).toBe(false);
    expect(checkScope(before, Buffer.from("AB-CD|EF"), scope).ok).toBe(false);
    const point = scopeFor(before, [{ start: 3, end: 3 }]);
    expect(checkScope(before, Buffer.from("AB|new CD|EF"), point).ok).toBe(true);
    expect(checkScope(before, Buffer.from("AB|DD|EF"), point).ok).toBe(false);
    expect(checkScope(before, Buffer.from("ABx|CD|EF"), point).ok).toBe(false);
  });

  test("the schema documents the boundary rule and the scope options", () => {
    const spec = { format: FORMAT, "schema-version": SCHEMA_VERSION, files: [{ path: "a.md", "baseline-hash": "0".repeat(64), ranges: [{ start: 0, end: 0 }], markers: "editable", restriction: "dialogue" }] };
    expect(validateDocument(spec, "scope")).toEqual([]);
    expect(validateDocument({ ...spec, files: [{ ...spec.files[0], markers: "maybe" }] }, "scope").length).toBeGreaterThan(0);
  });

  test("repeated dialogue: only the allowed occurrence may change", () => {
    const before = Buffer.from("Ada said “Wait.” Zoë said “Wait.”\n");
    const second = scopeForText(before, "Wait.", 1);
    expect(checkScope(before, Buffer.from("Ada said “Wait.” Zoë said “Go.”\n"), second).ok).toBe(true);
    const first = checkScope(before, Buffer.from("Ada said “Go.” Zoë said “Wait.”\n"), second);
    expect(first.ok).toBe(false);
    expect(first.violations[0].before.text).toBe("Wait");
    // Deleting one of two identical words cannot say which one went; the
    // check passes because an in-scope reading of the edit exists.
    const repeated = Buffer.from("“Wait. Wait.”\n");
    const later = scopeForText(repeated, " Wait.");
    expect(later.ranges[0].start).toBe(Buffer.byteLength("“Wait."));
    expect(checkScope(repeated, Buffer.from("“Wait.”\n"), later).ok).toBe(true);
    expect(checkScope(repeated, Buffer.from("“Go.”\n"), later).ok).toBe(false);
  });

  test("moving unchanged text is still a change outside the range", () => {
    const before = Buffer.from("One. Two. “Speak.” Three.\n");
    const moved = Buffer.from("Two. One. “Speak.” Three.\n");
    const report = checkScope(before, moved, scopeForText(before, "Speak."));
    expect(report.ok).toBe(false);
    const inside = Buffer.from("One. Two. “Three. Speak.” Three.\n");
    expect(checkScope(before, inside, scopeForText(before, "Speak.")).ok).toBe(true);
  });

  test("Unicode offsets are UTF-8 bytes and must fall on character boundaries", () => {
    const before = Buffer.from("Zoë — “Gehen wir.” Ende.\n");
    const scope = scopeForText(before, "Gehen wir.");
    expect(scope.ranges[0].start).toBe(Buffer.byteLength("Zoë — “"));
    expect(checkScope(before, Buffer.from("Zoë — “Łódź, jetzt.” Ende.\n"), scope).ok).toBe(true);
    expect(checkScope(before, Buffer.from("Zoe — “Gehen wir.” Ende.\n"), scope).ok).toBe(false);
    const split = checkScope(before, before, scopeFor(before, [{ start: 3, end: 5 }]));
    expect(codes(split)).toEqual(["SCOPE_INVALID"]);
    expect(split.diagnostics[0].message).toContain("byte 3 is inside a UTF-8 character");
  });

  test("invalid ranges, stale baselines and deleted files are findings", () => {
    const before = Buffer.from("Short text.\n");
    expect(codes(checkScope(before, before, scopeFor(before, [{ start: 4, end: 2 }])))).toEqual(["SCOPE_INVALID"]);
    expect(codes(checkScope(before, before, scopeFor(before, [{ start: 0, end: 99 }])))).toEqual(["SCOPE_INVALID"]);
    const stale = checkScope(before, before, { "baseline-hash": "0".repeat(64), ranges: [] });
    expect(codes(stale)).toEqual(["SCOPE_BASELINE_MISMATCH"]);
    expect(stale.ok).toBe(false);
    const deleted = checkScope(before, null, scopeFor(before, [{ start: 0, end: 5 }]), { path: "chapters/two.md" });
    expect(codes(deleted)).toEqual(["EDIT_OUT_OF_SCOPE"]);
    expect(deleted.diagnostics[0].message).toContain("chapters/two.md was deleted");
    expect(checkScope(before, null, { "baseline-hash": sha256Hex(before) }).ok).toBe(true);
    expect(checkScope(before, Buffer.from("Anything at all."), { "baseline-hash": sha256Hex(before) }).ok).toBe(true);
    expect(checkScope(before, Buffer.from("Short text!\n"), scopeFor(before, [])).ok).toBe(false);
  });

  test("overlapping and adjacent ranges merge", () => {
    const before = Buffer.from("abcdefghij");
    const scope = scopeFor(before, [{ start: 5, end: 7 }, { start: 2, end: 4 }, { start: 3, end: 5 }]);
    expect(checkScope(before, Buffer.from("abXYZhij"), scope).ok).toBe(true);
    expect(checkScope(before, Buffer.from("aXYZhij"), scope).ok).toBe(false);
  });

  test("text between two ranges must survive in order", () => {
    const before = Buffer.from("Ada said “Go.” Then Zoë said “Stay.”\n");
    const scope = scopeFor(before, [
      { start: before.indexOf("Go."), end: before.indexOf("Go.") + 3 },
      { start: before.indexOf("Stay."), end: before.indexOf("Stay.") + 5 }
    ]);
    expect(checkScope(before, Buffer.from("Ada said “Run.” Then Zoë said “Wait.”\n"), scope).ok).toBe(true);
    const report = checkScope(before, Buffer.from("Ada said “Run.” Later Zoë said “Wait.”\n"), scope);
    expect(report.ok).toBe(false);
    expect(report.violations.map((item) => [item.before.text, item.after.text])).toEqual([["Then", "Later"]]);
  });

  test("a diff beyond the edit limit is reported as one changed middle", () => {
    const before = Buffer.from("one two three four");
    const after = Buffer.from("one 2 three 4");
    expect(diffHunks(before, after)).toHaveLength(2);
    expect(diffHunks(before, after, { maxEdits: 1 })).toEqual([{ before: { start: 4, end: 18 }, after: { start: 4, end: 13 } }]);
  });

  test("story markers are locked unless the scope declares them editable", () => {
    const before = Buffer.from("<!-- story-beat: beat_a -->\n“Hi.”\n<!-- story-beat: beat_b -->\n“Bye.”\n");
    const whole = scopeFor(before, [{ start: 0, end: before.length }]);
    const renamed = Buffer.from("<!-- story-beat: beat_a -->\n“Hi.”\n<!-- story-beat: beat_c -->\n“Bye.”\n");
    const locked = checkScope(before, renamed, whole);
    expect(codes(locked)).toEqual(["MARKER_EDIT_UNDECLARED"]);
    expect(locked.ok).toBe(false);
    expect(checkScope(before, renamed, { ...whole, markers: "editable" }).ok).toBe(true);
    expect(checkScope(before, Buffer.from(before.toString().replace("Hi.", "Hello.")), whole).ok).toBe(true);
  });

  test("a dialogue restriction adds advisory candidate warnings, never a pass or fail", () => {
    const before = Buffer.from("“Wait,” Ada said, turning. “Now.”\n");
    const scope = scopeFor(before, [{ start: 0, end: before.length }], { restriction: "dialogue" });
    const tag = checkScope(before, Buffer.from("“Wait,” Ada whispered, turning. “Now.”\n"), scope);
    expect(tag.ok).toBe(true);
    expect(tag.diagnostics.map((item) => [item.code, item.severity])).toEqual([["DIALOGUE_RESTRICTION_CANDIDATE", "warning"]]);
    expect(tag.diagnostics[0].message).toContain("quote detection is advisory");
    expect(checkScope(before, Buffer.from("“Stop,” Ada said, turning. “Now.”\n"), scope).diagnostics).toEqual([]);
    expect(checkScope(before, Buffer.from("“Wait,” Ada whispered, turning. “Now.”\n"), { ...scope, restriction: "dialogue-and-tags" }).diagnostics).toEqual([]);
    // Out of range stays an error whatever quote detection says.
    const narrow = scopeFor(before, [{ start: 3, end: 8 }], { restriction: "dialogue" });
    expect(checkScope(before, Buffer.from("“Wait,” Ada said, turning. “Later.”\n"), narrow).ok).toBe(false);
  });
});

describe("dialogueCandidates", () => {
  test("offers quoted content apart from tags and beats, with byte offsets", () => {
    const text = "Zoë nodded. “Wait,” she said. \"Go.\"\n\nNo dialogue here.\n<!-- story-beat: beat_x -->\n„Tak“, rzekła. «Oui» — ‘single’\n";
    const buffer = Buffer.from(text);
    const found = dialogueCandidates(buffer).map((item) => [item.kind, item.text]);
    expect(found).toEqual([
      ["tag-or-beat", "Zoë nodded."],
      ["dialogue", "Wait,"],
      ["tag-or-beat", "she said."],
      ["dialogue", "Go."],
      ["dialogue", "Tak"],
      ["tag-or-beat", ", rzekła."],
      ["dialogue", "Oui"],
      ["tag-or-beat", "— ‘single’"]
    ]);
    for (const item of dialogueCandidates(buffer)) {
      expect(buffer.subarray(item.start, item.end).toString()).toBe(item.text);
    }
  });

  test("an unclosed quote runs to the end of its paragraph", () => {
    const buffer = Buffer.from("“I went on and on\n\nNext.\n");
    expect(dialogueCandidates(buffer).map((item) => [item.kind, item.text])).toEqual([["dialogue", "I went on and on"]]);
  });
});

describe("checkScopeSpec", () => {
  const spec = (files) => ({ format: FORMAT, "schema-version": SCHEMA_VERSION, files });

  test("every changed file must be listed; listed files are checked against the baseline", () => {
    const chapter = Buffer.from("Ada paused. “Wait.”\n");
    const baseline = new Map([["chapters/one.md", chapter], ["characters/ada.md", Buffer.from("Ada.\n")], ["notes.md", Buffer.from("x")]]);
    const current = new Map([
      ["chapters/one.md", Buffer.from("Ada paused. “Stay.”\n")],
      ["characters/ada.md", Buffer.from("Ada Quill.\n")],
      ["new.md", Buffer.from("new")]
    ]);
    const scope = spec([{ path: "chapters/one.md", ...scopeForText(chapter, "Wait.") }]);
    const report = checkScopeSpec(scope, baseline, current);
    expect(report.ok).toBe(false);
    expect(report.diagnostics.map((item) => [item.code, item.recordIds[0] ?? null, item.message.split(" ")[0]])).toEqual([
      ["EDIT_OUT_OF_SCOPE", null, "characters/ada.md"],
      ["EDIT_OUT_OF_SCOPE", null, "new.md"],
      ["EDIT_OUT_OF_SCOPE", null, "notes.md"]
    ]);
    expect(report.files.map((item) => [item.path, item.ok])).toEqual([["chapters/one.md", true]]);
    const allowed = checkScopeSpec(spec([
      { path: "chapters/one.md", ...scopeForText(chapter, "Wait.") },
      { path: "characters/ada.md", "baseline-hash": sha256Hex(Buffer.from("Ada.\n")) },
      { path: "notes.md", "baseline-hash": sha256Hex(Buffer.from("x")) },
      { path: "new.md", "baseline-hash": sha256Hex(Buffer.alloc(0)) }
    ]), baseline, current);
    expect(allowed).toMatchObject({ ok: true, diagnostics: [] });
  });

  test("a stale baseline hash, a duplicate path or an invalid document is reported", () => {
    const baseline = new Map([["a.md", Buffer.from("a")]]);
    const stale = checkScopeSpec(spec([{ path: "a.md", "baseline-hash": "0".repeat(64) }]), baseline, baseline);
    expect(stale.diagnostics.map((item) => item.code)).toEqual(["SCOPE_BASELINE_MISMATCH"]);
    const duplicate = checkScopeSpec(spec([
      { path: "a.md", "baseline-hash": sha256Hex(Buffer.from("a")) },
      { path: "a.md", "baseline-hash": sha256Hex(Buffer.from("a")) }
    ]), baseline, baseline);
    expect(duplicate.diagnostics.map((item) => item.code)).toEqual(["SCOPE_INVALID"]);
    const invalid = checkScopeSpec({ files: "all" }, baseline, baseline);
    expect(invalid.ok).toBe(false);
    expect(invalid.diagnostics.every((item) => item.code === "SCOPE_INVALID")).toBe(true);
  });
});
