import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeTransaction } from "../src/storage/transaction.js";
import { parseFrontmatter } from "../src/frontmatter.js";
import { sha256Hex, sourceHash } from "../src/storage/hash.js";
import { findMarkers, readSourceSpan } from "../src/storage/spans.js";
import { loadProject } from "../src/project/load.js";
import { makeKnowledgeFixture, makeProject, setRecordField } from "./support/project.js";

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "story-toolkit-escape-"));
}

function expectErrorCode(fn, code) {
  try {
    fn();
  } catch (error) {
    expect(error).toMatchObject({ code });
    return;
  }
  throw new Error(`Expected error code ${code}, but nothing was thrown`);
}

describe("source-preserving storage", () => {
  test("metadata edits preserve CRLF and Unicode manuscript bytes", async () => {
    const p = await makeProject({ body: '\r\n“Stay,” Zoë said.\r\n' });
    const before = p.bytes("chapters/one.md").body;
    await setRecordField(p.root, "chp_one", "title", "A new title");
    expect(p.bytes("chapters/one.md").body).toEqual(before);
  });

  test("a stale write set changes none of its targets", async () => {
    const p = await makeProject();
    const writes = p.twoFileReplacement();
    await p.write(writes[1].path, "an external edit");
    await expect(writeTransaction(p.root, writes, {})).rejects.toMatchObject({ code: "STALE_SOURCE" });
    expect(p.read(writes[0].path)).toBe(p.initial(writes[0].path));
  });

  test("scene spans select marker-to-marker body bytes and exclude frontmatter", async () => {
    const p = await makeProject({ body: "\nOpening prose.\n" });
    await p.addScene({ id: "scn_first", title: "First" });
    await p.write("chapters/one.md", `${p.read("chapters/one.md")}Middle prose.\n`);
    await p.addScene({ id: "scn_second", title: "Second" });
    await p.write("chapters/one.md", `${p.read("chapters/one.md")}Closing prose.\n`);

    const body = p.bytes("chapters/one.md").body;
    const file = p.read("chapters/one.md");
    const first = readSourceSpan(p.root, { path: "chapters/one.md", sceneId: "scn_first" });
    const second = readSourceSpan(p.root, { path: "chapters/one.md", sceneId: "scn_second" });

    expect(first.text).toContain("<!-- story-scene: scn_first -->");
    expect(first.text).toContain("Middle prose.");
    expect(first.text).not.toContain("scn_second");
    expect(first.text).not.toContain("format:");
    expect(first.start).toBeGreaterThanOrEqual(file.indexOf("<!-- story-scene: scn_first -->"));
    expect(second.text).toContain("Closing prose.");
    expect(second.end).toBe(file.length);

    expect(first.bytes).toEqual(Buffer.from(first.text, "utf8"));
    expect(sha256Hex(first.bytes)).toBe(sourceHash(p.root, { path: "chapters/one.md", sceneId: "scn_first" }));
  });

  test("beat spans end at the next beat marker or the scene end", async () => {
    const p = await makeProject({ body: "\n<!-- story-scene: scn_one -->\n" });
    p.write("chapters/one.md", `${p.read("chapters/one.md")}<!-- story-beat: beat_arrival -->\nArrival.\n<!-- story-beat: beat_departure -->\nDeparture.\n`);

    const arrival = readSourceSpan(p.root, { path: "chapters/one.md", sceneId: "scn_one", beatId: "beat_arrival" });
    const departure = readSourceSpan(p.root, { path: "chapters/one.md", sceneId: "scn_one", beatId: "beat_departure" });

    expect(arrival.text).toContain("Arrival.");
    expect(arrival.text).not.toContain("Departure.");
    expect(departure.text).toContain("Departure.");
    expect(departure.end).toBe(readSourceSpan(p.root, { path: "chapters/one.md", sceneId: "scn_one" }).end);
  });

  test("marker comments that break the documented syntax are reported", async () => {
    const markers = findMarkers("<!-- story-scene: scn_ok -->\n<!-- story-scene: Not An Id -->\n<!--story-beat:beat_x-->\n");
    expect(markers.scenes.map((scene) => scene.id)).toEqual(["scn_ok"]);
    expect(markers.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["MALFORMED_MARKER", "MALFORMED_MARKER"]);
  });

  test("word counts exclude scene and beat markers", async () => {
    const { wordCount } = await import("../src/markdown.js");
    expect(wordCount("<!-- story-scene: scn_one -->\nTwo words.\n<!-- story-beat: beat_x -->\nMore words.")).toBe(4);
  });

  test("transactions write staged content and clean preimages after success", async () => {
    const p = await makeProject();

    const created = await writeTransaction(p.root, [
      { path: "chapters/two.md", action: "create", expectedHash: null, content: "Chapter two.\n" },
      ...p.twoFileReplacement()
    ], {});
    expect(created.ok).toBe(true);
    expect(p.read("chapters/two.md")).toBe("Chapter two.\n");
    expect(p.read("story.md")).toContain("<!-- touched by the test transaction -->");

    await p.write("facts/obsolete.md", "obsolete original\n");
    await writeTransaction(p.root, [
      { path: "facts/obsolete.md", action: "replace", expectedHash: p.hash("facts/obsolete.md"), content: "obsolete\n" }
    ], {});
    await writeTransaction(p.root, [
      { path: "facts/obsolete.md", action: "remove", expectedHash: p.hash("facts/obsolete.md") }
    ], {});

    expect(fs.existsSync(path.join(p.root, "facts", "obsolete.md"))).toBe(false);
    expect(fs.readdirSync(path.join(p.root, ".story", "transactions"))).toEqual([]);
    expect(fs.readdirSync(path.join(p.root, ".story"))).toEqual(["transactions"]);
  });

  test("create asserts absence and replace requires a hash", async () => {
    const p = await makeProject();
    await expect(writeTransaction(p.root, [
      { path: "chapters/one.md", action: "create", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "STALE_SOURCE" });
    await expect(writeTransaction(p.root, [
      { path: "chapters/two.md", action: "create", expectedHash: p.hash("story.md"), content: "x" }
    ], {})).rejects.toMatchObject({ code: "INVALID_WRITE" });
    await expect(writeTransaction(p.root, [
      { path: "chapters/two.md", action: "replace", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "INVALID_WRITE" });
  });

  test("a dry run validates the set without persistent changes", async () => {
    const p = await makeProject();
    const writes = p.twoFileReplacement();
    const result = await writeTransaction(p.root, writes, { dryRun: true });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(p.read("story.md")).toBe(p.initial("story.md"));
    expect(fs.existsSync(path.join(p.root, ".story"))).toBe(false);

    await p.write(writes[1].path, "an external edit");
    await expect(writeTransaction(p.root, writes, { dryRun: true })).rejects.toMatchObject({ code: "STALE_SOURCE" });
    expect(p.read(writes[0].path)).toBe(p.initial(writes[0].path));
  });

  test("paths that escape the project root are rejected for writes", async () => {
    const p = await makeProject();
    await expect(writeTransaction(p.root, [
      { path: "../escape.md", action: "create", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "PATH_ESCAPE" });
    await expect(writeTransaction(p.root, [
      { path: "chapters/../../escape.md", action: "create", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "PATH_ESCAPE" });
    await expect(writeTransaction(p.root, [
      { path: "/etc/passwd", action: "create", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "PATH_ESCAPE" });

    const outside = tempRoot();
    fs.writeFileSync(path.join(outside, "target.md"), "outside\n");
    fs.symlinkSync(path.join(outside, "target.md"), path.join(p.root, "link.md"));
    await expect(writeTransaction(p.root, [
      { path: "link.md", action: "replace", expectedHash: sha256Hex(Buffer.from("outside\n")), content: "x" }
    ], {})).rejects.toMatchObject({ code: "SYMLINK_ESCAPE" });
    expect(fs.readFileSync(path.join(outside, "target.md"), "utf8")).toBe("outside\n");
  });

  test("case collisions are reported instead of creating ambiguous files", async () => {
    const p = await makeProject();
    await expect(writeTransaction(p.root, [
      { path: "chapters/ONE.md", action: "create", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "CASE_COLLISION" });
  });

  test("the .story lock keeps a second toolkit writer out", async () => {
    const p = await makeProject();
    fs.mkdirSync(path.join(p.root, ".story"), { recursive: true });
    fs.writeFileSync(path.join(p.root, ".story", "lock"), JSON.stringify({ pid: 1, acquiredAt: Date.now() }));
    await expect(writeTransaction(p.root, p.twoFileReplacement(), {})).rejects.toMatchObject({ code: "LOCKED" });
    expect(p.read("story.md")).toBe(p.initial("story.md"));

    const lockPath = path.join(p.root, ".story", "lock");
    const stale = new Date(Date.now() - 120_000);
    fs.utimesSync(lockPath, stale, stale);
    await expect(writeTransaction(p.root, p.twoFileReplacement(), {})).rejects.toMatchObject({ code: "LOCKED" });
    expect(p.read("story.md")).toBe(p.initial("story.md"));
  });

  test("a missing replace target is an actionable diagnostic", async () => {
    const p = await makeProject();
    await expect(writeTransaction(p.root, [
      { path: "chapters/missing.md", action: "replace", expectedHash: sha256Hex(Buffer.from("x")), content: "x" }
    ], {})).rejects.toMatchObject({ code: "MISSING_FILE" });
  });

  test("creating into a missing directory is an actionable diagnostic", async () => {
    const p = await makeProject();
    await expect(writeTransaction(p.root, [
      { path: "facts/nested/deep.md", action: "create", expectedHash: null, content: "x" }
    ], {})).rejects.toMatchObject({ code: "MISSING_PATH" });
  });

  test("permission failures surface as coded storage diagnostics, not raw fs errors", async () => {
    if (typeof process.getuid === "function" && process.getuid() === 0) {
      return; // permission bits do not bind root, so the EACCES paths cannot be exercised
    }
    const p = await makeProject();
    const target = path.join(p.root, "chapters", "one.md");
    const originalHash = p.hash("chapters/one.md");
    fs.chmodSync(target, 0o000);
    try {
      await expect(writeTransaction(p.root, [
        { path: "chapters/one.md", action: "replace", expectedHash: originalHash, content: "x" }
      ], {})).rejects.toMatchObject({ code: "ACCESS_DENIED", details: { fsCode: "EACCES" } });
      await expect(writeTransaction(p.root, [
        { path: "chapters/one.md", action: "replace", expectedHash: originalHash, content: "x" }
      ], { dryRun: true })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    } finally {
      fs.chmodSync(target, 0o644);
    }

    const writable = p.hash("chapters/one.md");
    const chapterDir = path.join(p.root, "chapters");
    fs.chmodSync(chapterDir, 0o555);
    try {
      await expect(writeTransaction(p.root, [
        { path: "chapters/one.md", action: "replace", expectedHash: writable, content: "x" }
      ], {})).rejects.toMatchObject({ code: "ACCESS_DENIED", details: { fsCode: "EACCES" } });
    } finally {
      fs.chmodSync(chapterDir, 0o755);
    }
    expect(p.read("chapters/one.md")).toBe(p.initial("chapters/one.md"));
  });
});

describe("frontmatter document parsing", () => {
  test("nested lists, block scalars, quotes, and null values parse and preserve bytes", async () => {
    const p = await makeProject();
    const markdown = [
      "---",
      "format: story-toolkit",
      "schema-version: 1",
      "id: rec_nested",
      "type: fact",
      "status: established",
      "kind: world",
      "valid-from:",
      "  scene: scn_cellar",
      "  side: after",
      "sources:",
      "  - path: chapters/one.md",
      "    hash: abcd",
      "explanation: |",
      "  First line",
      "  Second line",
      "quoted: 'She said \"hi\"'",
      "empty:",
      "---",
      "Body stays."
    ].join("\n");
    p.write("facts/nested.md", `${markdown}\n`);

    const parsed = parseFrontmatter(p.read("facts/nested.md"), "facts/nested.md");
    expect(parsed.data).toEqual({
      format: "story-toolkit",
      "schema-version": 1,
      id: "rec_nested",
      type: "fact",
      status: "established",
      kind: "world",
      "valid-from": { scene: "scn_cellar", side: "after" },
      sources: [{ path: "chapters/one.md", hash: "abcd" }],
      explanation: "First line\nSecond line\n",
      quoted: 'She said "hi"',
      empty: null
    });

    const updated = p.read("facts/nested.md").replace("rec_nested", "rec_nested");
    const rewritten = await (async () => {
      const { replaceFrontmatter } = await import("../src/storage/document.js");
      return replaceFrontmatter(p.read("facts/nested.md"), { ...parsed.data, status: "superseded" });
    })();
    expect(rewritten).toContain("valid-from:\n  scene: scn_cellar");
    expect(rewritten).toContain("explanation: |\n  First line\n  Second line");
    expect(rewritten).toContain("status: superseded");
    expect(updated).toBe(p.read("facts/nested.md"));
  });

  test("invalid YAML and duplicate mapping keys are rejected before mutation", async () => {
    const p = await makeProject();
    p.write("facts/broken.md", "---\nbad: \"a\\qb\"\n---\nBody\n");
    expectErrorCode(() => parseFrontmatter(p.read("facts/broken.md"), "facts/broken.md"), "INVALID_YAML");

    p.write("facts/dupes.md", "---\ntitle: A\ntitle: B\n---\nBody\n");
    expectErrorCode(() => parseFrontmatter(p.read("facts/dupes.md"), "facts/dupes.md"), "DUPLICATE_KEY");
  });
});

describe("project loading", () => {
  test("a fixture project loads with records indexed by id and no diagnostics", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    expect(project.diagnostics).toEqual([]);
    expect([...project.records.keys()].sort()).toEqual(["chp_one", "chr_zoe", "fact_key_handoff", "obj_brass_key", "prj_00000001", "scn_cellar"]);
    expect(project.records.get("chp_one").path).toBe("chapters/one.md");
    expect(project.records.get("chp_one").hash).toBe(p.hash("chapters/one.md"));
  });

  test("duplicate record ids are reported, not silently overwritten", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_dupe", type: "character", name: "First" });
    p.write("characters/other.md", `${p.read("characters/chr_dupe.md")}`);
    const project = await p.load();
    expect(project.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["DUPLICATE_RECORD_ID"]);
  });
});
