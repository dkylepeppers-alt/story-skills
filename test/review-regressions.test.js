import { expect, test, spyOn } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseFrontmatter, replaceFrontmatter } from "../src/storage/document.js";
import { readSourceSpan } from "../src/storage/spans.js";
import { writeTransaction } from "../src/storage/transaction.js";
import { validateDocument, validateRecord } from "../src/project/schema.js";
import { makeProject } from "./support/project.js";

const repo = path.resolve(import.meta.dir, "..");

test("project schemas and loader run in Node, not only Bun", () => {
  const result = spawnSync("node", ["--input-type=module", "-e", `
    import { validateRecord } from './src/project/schema.js';
    import { loadProject } from './src/project/load.js';
    const findings = validateRecord({format:'story-toolkit', 'schema-version':1, id:'prj_test', type:'project', title:'Test'});
    if (findings.length || typeof loadProject !== 'function') process.exit(1);
  `], { cwd: repo, encoding: "utf8" });
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
});

test.each([">-", "|2- # keep", "# nested collection"])("metadata editing preserves YAML continuation: %s", (header) => {
  const lines = header.startsWith("#") ? "  nested: value" : "  first\n  second";
  const original = `---\nnote: ${header}\n${lines}\ntitle: Old\n---\nExact body.\n`;
  const parsed = parseFrontmatter(original);
  const updated = replaceFrontmatter(original, { ...parsed.data, title: "New" });
  expect(parseFrontmatter(updated).data).toEqual({ ...parsed.data, title: "New" });
  expect(updated).toContain(`note: ${header}\n${lines}`);
  expect(parseFrontmatter(updated).body).toBe("Exact body.\n");
});

test("editing nested scalar text retains intentional blank lines", () => {
  const original = "---\nconfig:\n  note: before\n---\nBody\n";
  const next = { config: { note: "first\n\nthird\n" } };
  expect(parseFrontmatter(replaceFrontmatter(original, next)).data).toEqual(next);
});

test("scene and beat offsets identify exact UTF-8 bytes", async () => {
  const p = await makeProject({ body: "Zoë 🌊\n<!-- story-scene: scn_one -->\nCafé.\n<!-- story-beat: beat_one -->\nÀ demain.\n" });
  const raw = p.bytes("chapters/one.md").raw;
  for (const ref of [{ sceneId: "scn_one" }, { sceneId: "scn_one", beatId: "beat_one" }]) {
    const span = readSourceSpan(p.root, { path: "chapters/one.md", ...ref });
    expect(raw.subarray(span.start, span.end)).toEqual(span.bytes);
    expect(span.end).toBe(raw.length);
  }
});

test("loader includes nested world records, matter and the series record", async () => {
  const p = await makeProject();
  await p.addEntity({ id: "loc_mill", type: "location", name: "Mill" });
  p.write("worldbuilding/locations/mill.md", p.read("worldbuilding/loc_mill.md"));
  fs.unlinkSync(path.join(p.root, "worldbuilding/loc_mill.md"));
  await p.addEntity({ id: "mtr_preface", type: "matter", name: "Preface" });
  p.write("series.md", "---\nformat: story-toolkit\nschema-version: 1\nid: ser_test\ntype: series\nbooks: []\n---\n");
  const project = await p.load();
  expect(project.diagnostics).toEqual([]);
  expect([...project.records.keys()]).toEqual(expect.arrayContaining(["loc_mill", "mtr_preface", "ser_test"]));
});

test("loader reports directory errors instead of rejecting the entire project", async () => {
  const p = await makeProject();
  p.write("worldbuilding", "this is a file");
  const project = await p.load();
  expect(project.records.has("prj_00000001")).toBe(true);
  expect(project.diagnostics.some(d => d.code === "RECORD_UNREADABLE")).toBe(true);
});

test("invalid records are diagnosed without entering the validated index", async () => {
  const p = await makeProject();
  p.write("facts/bad.md", "---\nformat: story-toolkit\nschema-version: 1\nid: fact_bad\ntype: fact\n---\n");
  const project = await p.load();
  expect(project.diagnostics.length).toBeGreaterThan(0);
  expect(project.records.has("fact_bad")).toBe(false);
});

test("schema input errors produce diagnostics instead of prototype lookups or crashes", () => {
  expect(validateRecord({ format: "story-toolkit", "schema-version": 1, type: "constructor" })[0].code).toBe("UNKNOWN_RECORD_TYPE");
  expect(validateDocument(null, "proposal")[0].code).toBe("SCHEMA_VIOLATION");
  expect(validateRecord({ "schema-version": 2, title: "Old project" })[0].code).toBe("FORMAT_UPSTREAM_V2");
});

test("transactions reject normalized aliases before any writes", async () => {
  const p = await makeProject();
  const writes = p.twoFileReplacement();
  await expect(writeTransaction(p.root, [writes[0], { ...writes[0], path: "./story.md" }])).rejects.toMatchObject({ code: "INVALID_WRITE" });
  expect(p.read("story.md")).toBe(p.initial("story.md"));
  expect(fs.existsSync(path.join(p.root, ".story"))).toBe(false);
});

test("an old live lock cannot be stolen after a time threshold", async () => {
  const p = await makeProject();
  p.write(".story/lock", JSON.stringify({ pid: process.pid, acquiredAt: 1 }));
  fs.utimesSync(path.join(p.root, ".story/lock"), new Date(0), new Date(0));
  await expect(writeTransaction(p.root, p.twoFileReplacement())).rejects.toMatchObject({ code: "LOCKED" });
  expect(p.read("story.md")).toBe(p.initial("story.md"));
  expect(fs.existsSync(path.join(p.root, ".story/lock"))).toBe(true);
});

test.each([".story", ".story/transactions"])("transaction internals cannot escape through %s", async (relative) => {
  const p = await makeProject();
  const outside = await makeProject();
  fs.mkdirSync(path.dirname(path.join(p.root, relative)), { recursive: true });
  fs.symlinkSync(outside.root, path.join(p.root, relative));
  const before = fs.readdirSync(outside.root);
  await expect(writeTransaction(p.root, p.twoFileReplacement())).rejects.toMatchObject({ code: "SYMLINK_ESCAPE" });
  expect(fs.readdirSync(outside.root)).toEqual(before);
  expect(p.read("story.md")).toBe(p.initial("story.md"));
});

test("transaction write sets cannot replace their own lock", async () => {
  const p = await makeProject();
  p.write(".story/keep", "keep");
  await expect(writeTransaction(p.root, [{ path: ".story/lock", action: "create", expectedHash: null, content: "bad" }])).rejects.toMatchObject({ code: "INVALID_WRITE" });
});

test("rollback preserves external edits to an already applied file", async () => {
  const p = await makeProject();
  const rename = fs.renameSync;
  const spy = spyOn(fs, "renameSync").mockImplementation((from, to) => {
    rename(from, to);
    if (to === path.join(p.root, "story.md")) {
      p.write("story.md", "external edit after first replacement");
      p.write("chapters/one.md", "external edit before second replacement");
    }
  });
  try {
    await expect(writeTransaction(p.root, p.twoFileReplacement())).rejects.toMatchObject({ code: "ROLLBACK_CONFLICT" });
    expect(p.read("story.md")).toBe("external edit after first replacement");
    expect(p.read("chapters/one.md")).toBe("external edit before second replacement");
    expect(fs.readdirSync(path.join(p.root, ".story/transactions"))).toHaveLength(1);
  } finally {
    spy.mockRestore();
  }
});

test("editing a scalar retains trailing blank lines in its value", () => {
  const original = "---\nnote: before\n---\nBody\n";
  const data = { note: "first\n\n" };
  expect(parseFrontmatter(replaceFrontmatter(original, data)).data).toEqual(data);
});

test("loader never follows an assets parent symlink into another project", async () => {
  const p = await makeProject();
  const outside = await makeProject();
  outside.write("records/hidden.md", outside.read("story.md").replace("prj_00000001", "prj_hidden"));
  fs.symlinkSync(outside.root, path.join(p.root, "assets"));
  const loaded = await p.load();
  expect(loaded.records.has("prj_hidden")).toBe(false);
  expect(loaded.diagnostics.some(d => d.code === "RECORD_UNREADABLE")).toBe(true);
});
