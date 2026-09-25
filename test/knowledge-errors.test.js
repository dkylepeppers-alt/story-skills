import { describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { createStoryProject } from "../src/story.js";
import { makeTempDir, memoryIo, writeMarkdown } from "./helpers.js";
import { makeKnowledgeFixture } from "./support/project.js";

function knowledgeProject() {
  const cwd = makeTempDir();
  const created = createStoryProject({ cwd, title: "Knowledge", force: false });
  const root = created.root;

  writeMarkdown(path.join(root, "characters", "mara-finn.md"), `
name: Mara Finn
role: protagonist
status: alive
`, "# Mara\n");
  return { root, cwd };
}

function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

describe("knowledge CLI errors", () => {
  test("cli errors for an unknown chapter id", () => {
    const { root, cwd } = knowledgeProject();
    const unknown = invoke(cwd, ["knowledge", "mara-finn", "--at", "chapter-09", "--path", root]);
    expect(unknown.code).toBe(1);
    expect(unknown.err).toContain("Unknown chapter chapter-09");
  });

  test("cli errors when continuity state does not parse", () => {
    const { root, cwd } = knowledgeProject();
    writeMarkdown(path.join(root, "chapters", "chapter-01.md"), "title: One\nnumber: 1\nstatus: draft", "# One\n");
    fs.writeFileSync(path.join(root, "continuity", "state.md"), "not frontmatter\n", "utf8");
    const result = invoke(cwd, ["knowledge", "mara-finn", "--at", "chapter-01", "--path", root]);
    expect(result.code).toBe(1);
    expect(result.err).toContain("continuity/state.md");
  });

  test("a missing project is an invalid invocation in text and JSON", () => {
    const cwd = makeTempDir();
    const text = invoke(cwd, ["knowledge", "mara-finn", "--at", "chapter-01"]);
    expect(text.code).toBe(2);
    expect(text.err).toContain("missing story.md");
    const json = invoke(cwd, ["knowledge", "mara-finn", "--at", "chapter-01", "--format", "json"]);
    expect(json.code).toBe(2);
    expect(JSON.parse(json.out).diagnostics[0].code).toBe("PROJECT_NOT_FOUND");
  });
});

describe("knowledge operational failures", () => {
  test("a permission failure reading the project is operational", () => {
    const { root, cwd } = knowledgeProject();
    const realReaddir = fs.readdirSync;
    const spy = spyOn(fs, "readdirSync").mockImplementation((dir, ...args) => {
      if (String(dir).endsWith(`${path.sep}characters`)) {
        throw Object.assign(new Error("EACCES: permission denied, scandir characters"), { code: "EACCES" });
      }
      return realReaddir.call(fs, dir, ...args);
    });
    try {
      const result = invoke(cwd, ["knowledge", "mara-finn", "--at", "chapter-01", "--path", root, "--format", "json"]);
      expect(result.code).toBe(4);
      expect(JSON.parse(result.out).diagnostics[0].code).toBe("OPERATION_FAILED");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("story-toolkit knowledge errors", () => {
  test("an unknown character or a non-character id exits 1", async () => {
    const p = await makeKnowledgeFixture();
    for (const id of ["chr_nobody", "obj_brass_key"]) {
      const result = invoke(p.root, ["knowledge", id, "--scene", "scn_cellar", "--format", "json"]);
      expect(result.code).toBe(1);
      const parsed = JSON.parse(result.out);
      expect(parsed.ok).toBe(false);
      expect(parsed.diagnostics.map((item) => item.code)).toEqual(["CHARACTER_NOT_FOUND"]);
    }
    const text = invoke(p.root, ["knowledge", "chr_nobody", "--scene", "scn_cellar"]);
    expect(text.code).toBe(1);
    expect(text.err).toContain("CHARACTER_NOT_FOUND");
  });

  test("an unknown scene cursor is an error finding", async () => {
    const p = await makeKnowledgeFixture();
    const result = invoke(p.root, ["knowledge", "chr_ada", "--scene", "scn_nowhere"]);
    expect(result.code).toBe(1);
    expect(result.err).toContain("error MISSING_SCENE");
  });

  test("a missing --scene, --at on a toolkit project, or a bad --side is an invalid invocation", async () => {
    const p = await makeKnowledgeFixture();
    const missing = invoke(p.root, ["knowledge", "chr_ada"]);
    expect(missing.code).toBe(2);
    expect(missing.err).toContain("Usage: story knowledge <character-id> --scene <id>");
    const legacy = invoke(p.root, ["knowledge", "chr_ada", "--at", "chapter-01", "--format", "json"]);
    expect(legacy.code).toBe(2);
    expect(JSON.parse(legacy.out).diagnostics[0].code).toBe("INVALID_INVOCATION");
    const beatOnly = invoke(p.root, ["knowledge", "chr_ada", "--beat", "beat_handoff"]);
    expect(beatOnly.code).toBe(2);
    expect(invoke(p.root, ["knowledge", "chr_ada", "--scene", "scn_cellar", "--side", "during"]).code).toBe(2);
    expect(invoke(p.root, ["knowledge", "--scene", "scn_cellar"]).code).toBe(2);
  });

  test("a blocking load error stops the query", async () => {
    const p = await makeKnowledgeFixture();
    p.write("facts/broken.md", "---\nformat: story-toolkit\nschema-version: 1\nid: fact_broken\ntype: fact\n---\n");
    const result = invoke(p.root, ["knowledge", "chr_ada", "--scene", "scn_cellar"]);
    expect(result.code).toBe(2);
  });
});
