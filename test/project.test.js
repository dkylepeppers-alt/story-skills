import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { StorageError } from "../src/contracts.js";
import { importToolkitManuscript } from "../src/import.js";
import { ENTITY_TYPES, ID_PREFIX, allocateId } from "../src/project/identity.js";
import { importMarkdown } from "../src/project/import.js";
import { initProject } from "../src/project/init.js";
import { loadProject } from "../src/project/load.js";
import { renameEntity } from "../src/project/entities.js";
import { makeTempDir, memoryIo } from "./helpers.js";
import { makeProject } from "./support/project.js";

function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

function readBytes(root, relative) {
  return fs.readFileSync(path.join(root, relative));
}

function writeBytes(root, relative, contents) {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function crlf(lines, { trailingNewline = true } = {}) {
  const body = lines.join("\r\n");
  return trailingNewline ? `${body}\r\n` : body;
}

function frontmatterKeys(bytes) {
  const text = bytes.toString("utf8");
  const keys = [];
  let inFrontmatter = false;
  for (const line of text.split("\r\n")) {
    if (line === "---") {
      if (inFrontmatter) break;
      inFrontmatter = true;
      continue;
    }
    if (!inFrontmatter) continue;
    const match = /^([A-Za-z0-9_-]+):/.exec(line);
    if (match) keys.push(match[1]);
  }
  return keys;
}

function assertCrlfOnly(bytes) {
  const text = bytes.toString("utf8");
  expect(text.includes("\r\n")).toBe(true);
  expect(text.replaceAll("\r\n", "").includes("\n")).toBe(false);
}

describe("story-toolkit projects", () => {
  test("round-trip preserves frontmatter key order, CRLF, and trailing newline presence or absence", async () => {
    const p = await makeProject();
    const kept = crlf([
      "---",
      "# keep me",
      "format: story-toolkit",
      "id: chr_keep",
      "name: Kept",
      "schema-version: 1",
      "type: character",
      "---",
      "Zoë said “hello”."
    ]);
    const edited = crlf([
      "---",
      "format: story-toolkit",
      "schema-version: 1",
      "id: chr_edit",
      "type: character",
      "name: Ada",
      "---",
      "Zoë said “hello”."
    ], { trailingNewline: false });
    writeBytes(p.root, "characters/kept.md", kept);
    writeBytes(p.root, "characters/ada.md", edited);
    expect(kept.endsWith("\r\n")).toBe(true);
    expect(edited.endsWith("\n") || edited.endsWith("\r")).toBe(false);

    const unchanged = await renameEntity(p.root, "chr_keep", "Kept");
    expect(unchanged.exitCode).toBe(0);
    expect(readBytes(p.root, "characters/kept.md").equals(Buffer.from(kept))).toBe(true);
    expect(frontmatterKeys(readBytes(p.root, "characters/kept.md"))).toEqual([
      "format", "id", "name", "schema-version", "type"
    ]);
    expect(readBytes(p.root, "characters/kept.md").toString("utf8")).toContain("# keep me");

    const renamed = await renameEntity(p.root, "chr_edit", "Adaline");
    expect(renamed.exitCode).toBe(0);
    expect(renamed.envelope.data.id).toBe("chr_edit");
    expect(renamed.envelope.data.path).toBe("characters/adaline.md");
    const next = readBytes(p.root, "characters/adaline.md");
    assertCrlfOnly(next);
    expect(frontmatterKeys(next)).toEqual(["format", "schema-version", "id", "type", "name"]);
    const text = next.toString("utf8");
    expect(text).toContain("name: Adaline");
    expect(text.endsWith("Zoë said “hello”.")).toBe(true);
    expect(text.endsWith("\n")).toBe(false);
    expect(text.endsWith("\r")).toBe(false);
    expect(fs.existsSync(path.join(p.root, "characters", "ada.md"))).toBe(false);
  });

  test("rename preserves identity and manuscript wording", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const prose = p.read("chapters/one.md");
    await renameEntity(p.root, "chr_ada", "Adaline");
    const project = await p.load();
    expect(project.records.get("chr_ada").id).toBe("chr_ada");
    expect(project.records.get("chr_ada").record.name).toBe("Adaline");
    expect(p.read("chapters/one.md")).toBe(prose);
  });

  test("rename keeps the entity id and updates structural references without touching prose", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addEntity({ id: "chr_bee", type: "character", name: "Bee" });
    await p.addScene({
      id: "scn_cellar",
      title: "Cellar",
      cast: ["chr_ada", "chr_bee"],
      extensions: { portrait: "characters/chr_ada.md" }
    });
    await p.addFact({ id: "fact_ada_home", subject: "chr_ada", predicate: "location", value: "the pier" });
    const chapter = `${p.read("chapters/one.md").replace(/\n?$/, "\n")}Ada waited.\n[Ada](../characters/chr_ada.md)\n[Ada](/characters/chr_ada.md#notes)\n[Ada](https://example.com/ada)\n`;
    p.write("chapters/one.md", chapter);
    const factBefore = readBytes(p.root, "facts/fact_ada_home.md");
    const sceneBefore = p.read("scenes/scn_cellar.md");

    const renamed = await renameEntity(p.root, "chr_ada", "Adaline");
    expect(renamed.exitCode).toBe(0);
    expect(renamed.envelope.data).toMatchObject({ id: "chr_ada", name: "Adaline", path: "characters/adaline.md" });

    const project = await p.load();
    const entity = project.records.get("chr_ada");
    expect(entity.id).toBe("chr_ada");
    expect(entity.record.name).toBe("Adaline");
    expect(entity.path.split(path.sep).join("/")).toBe("characters/adaline.md");
    expect(project.records.get("scn_cellar").record.cast).toEqual(["chr_ada", "chr_bee"]);
    expect(project.records.get("scn_cellar").record.extensions.portrait).toBe("characters/adaline.md");
    expect(project.records.get("fact_ada_home").record.subject).toBe("chr_ada");
    expect(project.records.get("fact_ada_home").record.value).toBe("the pier");

    const chapterAfter = p.read("chapters/one.md");
    expect(chapterAfter).toBe(chapter);
    expect(chapterAfter).toContain("Ada waited.");
    expect(chapterAfter).toContain("[Ada](../characters/chr_ada.md)");
    expect(chapterAfter).toContain("[Ada](/characters/chr_ada.md#notes)");
    expect(chapterAfter).toContain("[Ada](https://example.com/ada)");
    expect(chapterAfter).not.toContain("Adaline waited");
    const stale = renamed.envelope.diagnostics.filter((item) => item.code === "STALE_PROSE_LINK");
    expect(stale.length).toBe(2);
    const staleText = stale.map((item) => item.message).join("\n");
    expect(staleText).toContain("../characters/chr_ada.md");
    expect(staleText).toContain("/characters/chr_ada.md#notes");
    expect(staleText).not.toContain("example.com");
    expect(renamed.envelope.ok).toBe(true);
    expect(readBytes(p.root, "facts/fact_ada_home.md").equals(factBefore)).toBe(true);
    expect(p.read("scenes/scn_cellar.md")).not.toBe(sceneBefore);
    expect(p.read("scenes/scn_cellar.md")).toContain("chr_ada");
  });

  test("rename leaves a prose link inside a code span untouched and unreported", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const chapter = `${p.read("chapters/one.md").replace(/\n?$/, "\n")}\`[Ada](../characters/chr_ada.md)\`\n\`\`\`\n[Ada](../characters/chr_ada.md)\n\`\`\`\n`;
    p.write("chapters/one.md", chapter);
    const renamed = await renameEntity(p.root, "chr_ada", "Adaline");
    expect(renamed.exitCode).toBe(0);
    expect(p.read("chapters/one.md")).toBe(chapter);
    expect(renamed.envelope.diagnostics.filter((item) => item.code === "STALE_PROSE_LINK")).toEqual([]);
  });

  test("rename reports a titled prose link without rewriting it", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const chapter = `${p.read("chapters/one.md").replace(/\n?$/, "\n")}[Ada](../characters/chr_ada.md "portrait")\n`;
    p.write("chapters/one.md", chapter);
    const renamed = await renameEntity(p.root, "chr_ada", "Adaline");
    expect(renamed.exitCode).toBe(0);
    expect(p.read("chapters/one.md")).toBe(chapter);
    const stale = renamed.envelope.diagnostics.filter((item) => item.code === "STALE_PROSE_LINK");
    expect(stale).toHaveLength(1);
    expect(stale[0].severity).toBe("warning");
    expect(stale[0].message).toContain("../characters/chr_ada.md");
    expect(stale[0].message).toContain("portrait");
  });

  test("rename leaves a prose mention of the old name unchanged", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const chapter = `${p.read("chapters/one.md").replace(/\n?$/, "\n")}Ada waited at the pier.\n`;
    p.write("chapters/one.md", chapter);
    const renamed = await renameEntity(p.root, "chr_ada", "Adaline");
    expect(renamed.exitCode).toBe(0);
    expect(p.read("chapters/one.md")).toBe(chapter);
    expect(p.read("chapters/one.md")).toContain("Ada waited at the pier.");
    expect(p.read("chapters/one.md")).not.toContain("Adaline");
    expect(renamed.envelope.diagnostics.filter((item) => item.code === "STALE_PROSE_LINK")).toEqual([]);
  });

  test("rename updates an exact path field on the renamed record without rewriting its prose", async () => {
    const p = await makeProject();
    await p.addEntity({
      id: "chr_ada",
      type: "character",
      name: "Ada",
      sources: [{ path: "characters/chr_ada.md", hash: "a".repeat(64), kind: "author-decision" }]
    });
    const original = p.read("characters/chr_ada.md");
    const withProse = `${original.replace(/\n?$/, "\n")}Ada kept the old name.\n[Ada](./chr_ada.md)\n`;
    p.write("characters/chr_ada.md", withProse);
    const renamed = await renameEntity(p.root, "chr_ada", "Adaline");
    expect(renamed.exitCode).toBe(0);
    const next = p.read("characters/adaline.md");
    expect(next).toContain("path: characters/adaline.md");
    expect(next).toContain("Ada kept the old name.\n[Ada](./chr_ada.md)\n");
    expect(next).not.toContain("path: characters/chr_ada.md");
    expect(renamed.envelope.diagnostics.some((item) => item.code === "STALE_PROSE_LINK")).toBe(true);
  });

  test("init creates only story.md, never overwrites, and assigns an opaque id", () => {
    const cwd = makeTempDir();
    const created = initProject({ title: "Only Story", cwd, dir: "only" });
    expect(created.exitCode).toBe(0);
    const root = created.envelope.data.root;
    expect(fs.readdirSync(root)).toEqual(["story.md"]);
    expect(fs.existsSync(path.join(root, ".story"))).toBe(false);
    expect(created.envelope.data.id).toMatch(/^prj_[0-9a-f]{8}$/);
    expect(created.envelope.data.id).not.toBe("only-story");

    const story = fs.readFileSync(path.join(root, "story.md"), "utf8");
    fs.writeFileSync(path.join(root, "story.md"), `${story}\nUser notes.\n`);
    const again = initProject({ title: "Only Story", cwd, dir: "only" });
    expect(again.exitCode).toBe(1);
    expect(again.envelope.diagnostics[0].code).toBe("PROJECT_EXISTS");
    expect(fs.readFileSync(path.join(root, "story.md"), "utf8")).toBe(`${story}\nUser notes.\n`);

    const occupied = path.join(cwd, "occupied");
    fs.mkdirSync(occupied);
    fs.writeFileSync(path.join(occupied, "notes.txt"), "keep");
    const refused = initProject({ title: "Occupied", cwd, dir: "occupied" });
    expect(refused.exitCode).toBe(1);
    expect(fs.readFileSync(path.join(occupied, "notes.txt"), "utf8")).toBe("keep");
    expect(fs.existsSync(path.join(occupied, "story.md"))).toBe(false);

    const empty = path.join(cwd, "empty");
    fs.mkdirSync(empty);
    const intoEmpty = initProject({ title: "Empty Dir", cwd, dir: "empty" });
    expect(intoEmpty.exitCode).toBe(0);
    expect(fs.readdirSync(empty)).toEqual(["story.md"]);

    const before = fs.readdirSync(cwd);
    const noSlug = initProject({ title: "東京物語", cwd });
    expect(noSlug.exitCode).toBe(2);
    expect(noSlug.envelope.diagnostics[0].code).toBe("INVALID_INVOCATION");
    expect(fs.readdirSync(cwd)).toEqual(before);

    const preview = initProject({ title: "Preview", cwd, dir: "preview", dryRun: true });
    expect(preview.exitCode).toBe(0);
    expect(preview.envelope.data.dryRun).toBe(true);
    expect(fs.existsSync(path.join(cwd, "preview"))).toBe(false);
  });

  test("entity add covers every command-matrix type and dry-run writes nothing", async () => {
    const p = await makeProject();
    const before = new Set(fs.readdirSync(p.root, { recursive: true }).map(String));
    for (const type of ENTITY_TYPES) {
      const argv = ["entity", "add", type, `Sample ${type}`, "--format", "json"];
      if (type === "scene") argv.push("--chapter", "chp_one");
      const result = invoke(p.root, argv);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.out);
      expect(parsed.ok).toBe(true);
      expect(parsed.data.type).toBe(type);
      expect(parsed.data.id).toMatch(new RegExp(`^${ID_PREFIX[type]}_[0-9a-f]{8}$`));
    }
    const project = await loadProject(p.root);
    expect(project.diagnostics.filter((item) => item.code === "SCHEMA_VIOLATION")).toEqual([]);
    for (const type of ENTITY_TYPES) {
      const record = [...project.records.values()].find((entry) => entry.type === type && entry.id !== "chp_one");
      expect(record).toBeDefined();
      if (type === "research" || type === "scene") expect(record.record.title).toBe(`Sample ${type}`);
      else expect(record.record.name).toBe(`Sample ${type}`);
      if (type === "research") expect(record.record.status).toBe("open");
      if (type === "scene") expect(record.record["chapter-id"]).toBe("chp_one");
    }
    expect(fs.existsSync(path.join(p.root, "worldbuilding", "locations"))).toBe(false);
    expect(fs.readdirSync(path.join(p.root, "worldbuilding")).sort()).toEqual([
      "sample-faction.md", "sample-location.md", "sample-object.md", "sample-system.md"
    ]);

    const dry = invoke(p.root, ["entity", "add", "character", "Ghost", "--dry-run", "--format", "json"]);
    expect(dry.code).toBe(0);
    expect(JSON.parse(dry.out).data.dryRun).toBe(true);
    expect(fs.existsSync(path.join(p.root, "characters", "ghost.md"))).toBe(false);
    const missingScene = invoke(p.root, ["entity", "add", "scene", "Nowhere", "--format", "json"]);
    expect(missingScene.code).toBe(2);
    expect(JSON.parse(missingScene.out).diagnostics[0].code).toBe("INVALID_INVOCATION");
    const unknown = invoke(p.root, ["entity", "add", "widget", "Nope", "--format", "json"]);
    expect(unknown.code).toBe(2);
    expect(JSON.parse(unknown.out).diagnostics[0].code).toBe("UNKNOWN_ENTITY_TYPE");
    expect(before.has("characters")).toBe(false);
  });

  test("allocateId keeps imported ids unique and reports exhaustion", () => {
    expect(allocateId("character", [], () => "abcd1234")).toBe("chr_abcd1234");
    expect(allocateId("character", new Set(["chr_abcd1234"]), () => "ffff0000")).toBe("chr_ffff0000");
    try {
      allocateId("scene", new Set(["scn_abcd1234"]), () => "abcd1234");
      throw new Error("expected exhaustion");
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError);
      expect(error.code).toBe("ID_EXHAUSTED");
    }
    try {
      allocateId("widget", [], () => "abcd1234");
      throw new Error("expected unknown type");
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError);
      expect(error.code).toBe("UNKNOWN_ENTITY_TYPE");
    }
  });
});

describe("story-toolkit markdown import", () => {
  test("imports headings in natural file order and warns on ambiguous scene breaks", () => {
    const cwd = makeTempDir();
    const source = path.join(cwd, "drafts");
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, "chapter-10-tenth.md"), "## Chapter 10: Tenth\n\nThe tenth chapter.\n", "utf8");
    fs.writeFileSync(path.join(source, "prologue.md"), "Before the numbered chapters.\n", "utf8");
    fs.writeFileSync(path.join(source, "chapter-2-second.md"), [
      "## Chapter 2: Second",
      "",
      "The second chapter.",
      "",
      "---",
      "",
      "Still the second chapter.",
      ""
    ].join("\n"), "utf8");

    const imported = importMarkdown({ source: "drafts", cwd, out: "imported", title: "Ordered" });
    expect(imported.exitCode).toBe(0);
    expect(imported.envelope.diagnostics.map((item) => item.code)).toEqual(["AMBIGUOUS_SCENE_BREAK"]);
    expect(imported.envelope.diagnostics[0].evidence).toBe("candidate");
    expect(imported.envelope.data.chapters.map((chapter) => chapter.title)).toEqual(["Prologue", "Second", "Tenth"]);
    expect(fs.existsSync(path.join(cwd, "imported", "scenes"))).toBe(false);
    const second = fs.readdirSync(path.join(cwd, "imported", "chapters")).find((name) => name.includes("second"));
    const prose = fs.readFileSync(path.join(cwd, "imported", "chapters", second), "utf8");
    expect(prose).toContain("The second chapter.");
    expect(prose).toContain("Still the second chapter.");
    expect(prose).toContain("\n---\n");
  });

  test("creates scenes only for explicit markers and keeps imported ids unique", () => {
    const cwd = makeTempDir();
    const source = path.join(cwd, "marked");
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, "door.md"), [
      "---",
      "id: chp_door",
      "---",
      "# Chapter 1: Door",
      "",
      "She opened it.",
      "",
      "<!-- story-scene: scn_door -->",
      "",
      "The hinge complained.",
      ""
    ].join("\n"), "utf8");

    const imported = importToolkitManuscript({ source: "marked", cwd, out: "book", title: "Door" });
    expect(imported.exitCode).toBe(0);
    expect(imported.envelope.data.chapters.map((chapter) => chapter.id)).toEqual(["chp_door"]);
    const scene = fs.readFileSync(path.join(cwd, "book", "scenes", "scn_door.md"), "utf8");
    expect(scene).toContain("id: scn_door");
    expect(scene).toContain("chapter-id: chp_door");
    const chapter = fs.readFileSync(path.join(cwd, "book", "chapters", "door.md"), "utf8");
    expect(chapter).toContain("<!-- story-scene: scn_door -->");
    expect(chapter).toContain("The hinge complained.");

    const duplicate = path.join(cwd, "dupes");
    fs.mkdirSync(duplicate);
    const body = "---\nid: chp_same\n---\nOne chapter of prose.\n";
    fs.writeFileSync(path.join(duplicate, "a.md"), body, "utf8");
    fs.writeFileSync(path.join(duplicate, "b.md"), body, "utf8");
    const refused = importMarkdown({ source: "dupes", cwd, out: "should-not-exist" });
    expect(refused.exitCode).toBe(2);
    expect(refused.envelope.ok).toBe(false);
    expect(refused.envelope.diagnostics[0].message).toContain("chp_same");
    expect(fs.existsSync(path.join(cwd, "should-not-exist"))).toBe(false);

    fs.mkdirSync(path.join(cwd, "already"));
    const existing = importMarkdown({ source: "marked", cwd, out: "already" });
    expect(existing.exitCode).toBe(2);
    expect(existing.envelope.diagnostics[0].code).toBe("OUTPUT_EXISTS");
    expect(fs.readdirSync(path.join(cwd, "already"))).toEqual([]);
  });

  test("refuses symlinked and oversized import sources before creating a directory", () => {
    const cwd = makeTempDir();
    const real = path.join(cwd, "real.md");
    fs.writeFileSync(real, "# Chapter 1: Real\n\nProse.\n", "utf8");
    fs.symlinkSync(real, path.join(cwd, "linked.md"));
    const linked = importMarkdown({ source: "linked.md", cwd, out: "from-link" });
    expect(linked.exitCode).toBe(2);
    expect(linked.envelope.diagnostics[0].message).toContain("symlinked");
    expect(fs.existsSync(path.join(cwd, "from-link"))).toBe(false);

    const huge = path.join(cwd, "huge.md");
    fs.writeFileSync(huge, Buffer.alloc(5 * 1024 * 1024 + 1, 0x61));
    const oversized = importMarkdown({ source: "huge.md", cwd, out: "from-huge" });
    expect(oversized.exitCode).toBe(2);
    expect(oversized.envelope.diagnostics[0].message).toContain("exceeds");
    expect(fs.existsSync(path.join(cwd, "from-huge"))).toBe(false);
  });
});
