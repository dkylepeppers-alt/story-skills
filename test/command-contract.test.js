import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { COMMANDS } from "../src/commands.js";
import { createStoryProject } from "../src/story.js";
import { makeTempDir, memoryIo } from "./helpers.js";

const UNIMPLEMENTED = [
  "context", "snapshot", "reconcile", "fact", "decision", "issue",
  "assets", "shots", "setup", "installation"
];

function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

function assertSingleEnvelope(result, code, ok) {
  expect(result.code).toBe(code);
  expect(result.out.includes("\n")).toBe(false);
  const parsed = JSON.parse(result.out);
  expect(result.out).toBe(JSON.stringify(parsed));
  expect(Object.keys(parsed).sort()).toEqual(["apiVersion", "command", "data", "diagnostics", "ok", "writes"]);
  expect(parsed.apiVersion).toBe(1);
  expect(parsed.ok).toBe(ok);
  expect(result.err.includes("apiVersion")).toBe(false);
  expect(result.err.includes(result.out)).toBe(false);
  return parsed;
}

function snapshot(root) {
  const files = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files[path.relative(root, full)] = fs.readFileSync(full);
    }
  };
  walk(root);
  return files;
}

describe("command result contract", () => {
  test("--format json writes exactly one result envelope to stdout and nothing else", () => {
    const cwd = makeTempDir();
    expect(invoke(cwd, ["init", "Json Tale", "--toolkit", "--dir", "tale"]).code).toBe(0);
    const root = path.join(cwd, "tale");

    const added = invoke(root, ["entity", "add", "character", "Ada", "--format", "json"]);
    const addedEnvelope = assertSingleEnvelope(added, 0, true);
    expect(addedEnvelope.command).toBe("entity add");
    expect(addedEnvelope.data.id).toMatch(/^chr_[0-9a-f]{8}$/);
    const id = addedEnvelope.data.id;

    const shown = invoke(root, ["entity", "show", id, "--format", "json"]);
    const shownEnvelope = assertSingleEnvelope(shown, 0, true);
    expect(shownEnvelope.command).toBe("entity show");
    expect(shownEnvelope.data).toMatchObject({ id, type: "character", name: "Ada" });
    expect(shownEnvelope.diagnostics).toEqual([]);
    expect(shown.err).toBe("story: entity show\n");

    const missingPolicy = invoke(root, ["entity", "remove", id, "--format", "json"]);
    const missingEnvelope = assertSingleEnvelope(missingPolicy, 2, false);
    expect(missingEnvelope.command).toBe("entity remove");
    expect(missingEnvelope.diagnostics[0].code).toBe("INVALID_INVOCATION");
    expect(missingEnvelope.writes).toEqual([]);

    const unknownOption = invoke(root, ["entity", "show", id, "--not-an-option", "--format", "json"]);
    const optionEnvelope = assertSingleEnvelope(unknownOption, 2, false);
    expect(optionEnvelope.diagnostics[0].code).toBe("INVALID_INVOCATION");
    expect(optionEnvelope.diagnostics[0].message).toContain("Unknown option");

    const unknown = invoke(cwd, ["context", "--format", "json"]);
    const unknownEnvelope = assertSingleEnvelope(unknown, 2, false);
    expect(unknownEnvelope.command).toBe("context");
    expect(unknownEnvelope.ok).toBe(false);
    expect(unknownEnvelope.diagnostics[0].message).toContain("Unknown command: context");
    expect(unknown.out.startsWith("{")).toBe(true);
    expect(unknown.out.endsWith("}")).toBe(true);
  });

  test("a command run from a nested directory resolves the project and a command outside any project fails", () => {
    const cwd = makeTempDir();
    expect(invoke(cwd, ["init", "Nested Tale", "--toolkit", "--dir", "tale"]).code).toBe(0);
    const root = path.join(cwd, "tale");
    const added = invoke(root, ["entity", "add", "character", "Ada", "--format", "json"]);
    expect(added.code).toBe(0);
    const id = JSON.parse(added.out).data.id;

    const nested = path.join(root, "chapters", "drafts");
    fs.mkdirSync(nested, { recursive: true });
    const inside = invoke(nested, ["entity", "show", id]);
    expect(inside.code).toBe(0);
    expect(inside.out).toContain(id);
    expect(inside.out).toContain("Ada");
    expect(inside.out).toContain("characters/");

    const outside = makeTempDir();
    const outsideBefore = fs.readdirSync(outside);
    const missing = invoke(outside, ["entity", "show", id, "--format", "json"]);
    const missingEnvelope = assertSingleEnvelope(missing, 2, false);
    expect(missingEnvelope.diagnostics[0].code).toBe("PROJECT_NOT_FOUND");
    expect(fs.existsSync(path.join(outside, "story.md"))).toBe(false);
    expect(fs.readdirSync(outside)).toEqual(outsideBefore);

    const flagged = invoke(outside, ["entity", "show", id, "--project", root]);
    expect(flagged.code).toBe(0);
    expect(flagged.out).toContain(id);
    expect(flagged.out).toContain("Ada");
  });

  test("an explicit project path does not walk up to a parent story", () => {
    const parent = makeTempDir();
    expect(invoke(parent, ["init", "Here", "--toolkit", "--dir", "."]).code).toBe(0);
    expect(fs.existsSync(path.join(parent, "story.md"))).toBe(true);
    fs.mkdirSync(path.join(parent, "nested"));
    const missed = invoke(parent, ["entity", "show", "chr_missing", "--project", "nested", "--format", "json"]);
    const parsed = assertSingleEnvelope(missed, 2, false);
    expect(parsed.diagnostics[0].code).toBe("PROJECT_NOT_FOUND");
    expect(parsed.diagnostics[0].message).toContain(path.join(parent, "nested"));
  });

  test("unimplemented commands fail instead of reporting success", () => {
    const cwd = makeTempDir();
    for (const name of UNIMPLEMENTED) {
      expect(COMMANDS.some((command) => command.path[0] === name)).toBe(false);
      const json = invoke(cwd, [name, "--format", "json"]);
      const parsed = assertSingleEnvelope(json, 2, false);
      expect(parsed.command).toBe(name);
      expect(parsed.diagnostics[0].message).toContain(`Unknown command: ${name}`);
      const text = invoke(cwd, [name]);
      expect(text.code).toBe(2);
      expect(text.err).toContain(`Unknown command: ${name}`);
      expect(text.out).toBe("");
    }
  });

  test("--project and --path conflict, and help stays text", () => {
    const cwd = makeTempDir();
    expect(invoke(cwd, ["init", "Flags", "--toolkit", "--dir", "tale"]).code).toBe(0);
    const root = path.join(cwd, "tale");
    const other = makeTempDir();
    const conflict = invoke(cwd, ["entity", "show", "chr_missing", "--project", root, "--path", other, "--format", "json"]);
    const parsed = assertSingleEnvelope(conflict, 2, false);
    expect(parsed.diagnostics[0].message).toContain("Conflicting project paths");

    const help = invoke(cwd, ["--help", "--format", "json"]);
    expect(help.code).toBe(0);
    expect(help.out.startsWith("Usage: story <command> [options]\n")).toBe(true);
    expect(help.out).toContain("entity add <type> <name>");
    const version = invoke(cwd, ["--version", "--format", "json"]);
    expect(version.code).toBe(0);
    expect(version.out.endsWith("\n")).toBe(true);
    expect(version.out.startsWith("{")).toBe(false);
  });

  test("--format text|json selects the result envelope and build kinds stay build kinds", () => {
    const cwd = makeTempDir();
    expect(invoke(cwd, ["init", "Format Tale"]).code).toBe(0);
    const root = path.join(cwd, "format-tale");
    fs.writeFileSync(path.join(root, "chapters", "chapter-01.md"), "---\ntitle: One\nnumber: 1\nstatus: draft\n---\n\nOne word.\n", "utf8");

    const asJson = invoke(root, ["build", "--format", "json"]);
    const parsed = assertSingleEnvelope(asJson, 0, true);
    expect(parsed.data.stdout).toContain("as markdown");
    expect(parsed.data.stdout).not.toContain("as json");
    expect(fs.existsSync(path.join(root, "dist", "format-tale.md"))).toBe(true);

    const asText = invoke(root, ["build", "--format", "text"]);
    expect(asText.code).toBe(0);
    expect(asText.out.startsWith("{")).toBe(false);
    expect(asText.out).toContain("as markdown");

    const asEpub = invoke(root, ["build", "--format", "epub"]);
    expect(asEpub.code).toBe(0);
    expect(asEpub.out).toContain("as epub");
    expect(asEpub.out.startsWith("{")).toBe(false);
  });

  test("legacy commands envelope captured stdout when --format json is set", () => {
    const cwd = makeTempDir();
    const result = invoke(cwd, ["init", "Legacy Json", "--format", "json"]);
    const parsed = assertSingleEnvelope(result, 0, true);
    expect(parsed.command).toBe("init");
    expect(parsed.data.stdout).toContain("Created story project");
    expect(parsed.data.stderr).toBe("");
    expect(fs.existsSync(path.join(cwd, "legacy-json", "characters", "_index.md"))).toBe(true);
  });

  test("entity commands refuse a schema v2 project without writing", () => {
    const cwd = makeTempDir();
    const { root } = createStoryProject({ cwd, title: "Legacy Book" });
    const before = snapshot(root);
    const result = invoke(root, ["entity", "add", "character", "Ada", "--format", "json"]);
    const parsed = assertSingleEnvelope(result, 2, false);
    expect(parsed.diagnostics.some((item) => item.code === "FORMAT_UPSTREAM_V2")).toBe(true);
    expect(snapshot(root)).toEqual(before);
  });
});
