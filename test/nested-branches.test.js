import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, spyOn, test } from "bun:test";
import { resolveRoot, runCli } from "../src/cli/dispatch.js";
import { parseArgs } from "../src/options.js";
import { StorageError } from "../src/contracts.js";
import { memoryIo, makeTempDir } from "./helpers.js";
import { makeProject } from "./support/project.js";
import { discoverProject } from "../src/project/discover.js";
import { addEntity, removeEntity, renameEntity, showEntity } from "../src/project/entities.js";
import * as identity from "../src/project/identity.js";
import { importMarkdown } from "../src/project/import.js";
import { initProject } from "../src/project/init.js";
import { loadProjectSync } from "../src/project/load.js";
import * as schema from "../src/project/schema.js";
import { validateDocument } from "../src/project/schema.js";
import { replaceFrontmatter } from "../src/storage/document.js";
import { hashFile, hashUtf8, sha256Hex } from "../src/storage/hash.js";
import { assertWritableTarget, resolveWithinRoot } from "../src/storage/paths.js";
import { readSourceSpan } from "../src/storage/spans.js";
import { writeTransactionSync } from "../src/storage/transaction.js";

function ioError(code, message = code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

describe("invocation branches the result envelope has to classify", () => {
  test("an option-only argv has no command token", () => {
    const io = memoryIo(makeTempDir());
    expect(runCli(["--format=json", "--nope"], io)).toBe(2);
    const body = JSON.parse(io.output());
    expect(body.command).toBe("");
    expect(body.diagnostics[0].code).toBe("INVALID_INVOCATION");
    expect(body.diagnostics[0].message).toContain("Unknown option");
  });

  test("a command group without a subcommand prints usage in text mode", () => {
    const io = memoryIo(makeTempDir());
    expect(runCli(["entity"], io)).toBe(2);
    expect(io.error()).toContain("Usage:");
    expect(io.error()).toContain("story entity add <type> <name>");
    expect(io.output()).toBe("");
  });

  test("strict entity invocations reject blank args, unknown options, and bad enums", () => {
    const blank = memoryIo(makeTempDir());
    expect(runCli(["entity", "add", "character", "   "], blank)).toBe(2);
    expect(blank.error()).toContain("Usage: story entity add <type> <name>");

    const missing = memoryIo(makeTempDir());
    expect(runCli(["entity", "show"], missing)).toBe(2);
    expect(missing.error()).toContain("Usage: story entity show <id>");

    const unknown = memoryIo(makeTempDir());
    expect(runCli(["entity", "show", "chr_ada", "--dry-run"], unknown)).toBe(2);
    expect(unknown.error()).toContain("Option --dry-run is not valid for entity show");

    const bad = memoryIo(makeTempDir());
    expect(runCli(["entity", "remove", "chr_ada", "--policy", "later"], bad)).toBe(2);
    expect(bad.error()).toContain("Option --policy must be one of refuse, detach");
  });

  test("a legacy command that fails with output is wrapped instead of relabeled", () => {
    const io = memoryIo(makeTempDir());
    expect(runCli(["knowledge", "--format", "json"], io)).toBe(1);
    const body = JSON.parse(io.output());
    expect(body.ok).toBe(false);
    expect(body.diagnostics[0].code).toBe("COMMAND_FAILED");
    expect(body.diagnostics[0].message).toContain("Usage: story knowledge");
    expect(io.error()).toContain("Usage: story knowledge");
  });

  test("storage errors thrown into the CLI keep their exit class in text and json", async () => {
    const locked = await makeProject();
    const realStat = fs.statSync;
    const lockSpy = spyOn(fs, "statSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}story.md`)) throw new StorageError("LOCKED", "held");
      return realStat.call(fs, file, ...args);
    });
    try {
      const io = memoryIo(locked.root);
      expect(runCli(["entity", "show", "chr_ada", "--project", locked.root, "--format", "json"], io)).toBe(3);
      expect(JSON.parse(io.output()).diagnostics[0].code).toBe("LOCKED");
    } finally {
      lockSpy.mockRestore();
    }

    const denied = await makeProject();
    const denySpy = spyOn(fs, "statSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}story.md`)) throw new StorageError("ACCESS_DENIED", "denied");
      return realStat.call(fs, file, ...args);
    });
    try {
      const io = memoryIo(denied.root);
      expect(runCli(["entity", "show", "chr_ada", "--project", denied.root], io)).toBe(4);
      expect(io.error()).toContain("denied");
      expect(io.output()).toBe("");
    } finally {
      denySpy.mockRestore();
    }

    const blank = await makeProject();
    const blankSpy = spyOn(fs, "statSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}story.md`)) {
        const error = new StorageError("TEMP", "plain failure");
        error.code = "";
        throw error;
      }
      return realStat.call(fs, file, ...args);
    });
    try {
      const io = memoryIo(blank.root);
      expect(runCli(["entity", "show", "chr_ada", "--project", blank.root, "--format", "json"], io)).toBe(4);
      expect(JSON.parse(io.output()).diagnostics[0].code).toBe("OPERATION_FAILED");
    } finally {
      blankSpy.mockRestore();
    }
  });
});

describe("entity command handlers and removal edges", () => {
  test("entity rename and toolkit import run through their command handlers", async () => {
    const project = await makeProject();
    await project.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const renamed = memoryIo(project.root);
    expect(runCli(["entity", "rename", "chr_ada", "Adaline"], renamed)).toBe(0);
    expect(renamed.output()).toContain("chr_ada");
    expect(renamed.output()).toContain("Adaline");

    const cwd = makeTempDir();
    fs.writeFileSync(path.join(cwd, "book.md"), "# Chapter 1: Door\n\nShe opened it.\n", "utf8");
    const imported = memoryIo(cwd);
    expect(runCli(["import", "book.md", "--toolkit", "--out", "book", "--title", "Door"], imported)).toBe(0);
    expect(imported.output()).toContain("Imported");
    expect(fs.existsSync(path.join(cwd, "book", "story.md"))).toBe(true);
  });

  test("a story.md that is not a project record blocks mutation", async () => {
    const root = makeTempDir();
    fs.writeFileSync(path.join(root, "story.md"), [
      "---",
      "format: story-toolkit",
      "schema-version: 1",
      "id: chr_ada",
      "type: character",
      "name: Ada",
      "---",
      ""
    ].join("\n"), "utf8");
    const shown = showEntity(root, "chr_ada");
    expect(shown.exitCode).toBe(2);
    expect(shown.envelope.diagnostics[0].code).toBe("PROJECT_FORMAT");
  });

  test("add rejects a bad id, a duplicate id, and a record the schema refuses", async () => {
    const project = await makeProject();
    const invalid = addEntity(project.root, { type: "character", name: "Ada", id: "Bad Id" });
    expect(invalid.exitCode).toBe(2);
    expect(invalid.envelope.diagnostics[0].message).toContain("Invalid id");

    await project.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const duplicate = addEntity(project.root, { type: "character", name: "Other", id: "chr_ada" });
    expect(duplicate.exitCode).toBe(1);
    expect(duplicate.envelope.diagnostics[0].code).toBe("DUPLICATE_RECORD_ID");

    const real = schema.validateRecord;
    const spy = spyOn(schema, "validateRecord").mockImplementation((record) => {
      if (record?.name === "Rejected") {
        return [{
          code: "SCHEMA_VIOLATION",
          severity: "error",
          message: "rejected name",
          recordIds: [],
          sources: [],
          evidence: "structural",
          action: "Fix the record."
        }];
      }
      return real(record);
    });
    try {
      const refused = addEntity(project.root, { type: "character", name: "Rejected", id: "chr_rejected" });
      expect(refused.exitCode).toBe(2);
      expect(refused.envelope.diagnostics[0].message).toBe("rejected name");
      expect(fs.existsSync(path.join(project.root, "characters", "rejected.md"))).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  test("dry-run add and rename report a stale tree and write nothing", async () => {
    const project = await makeProject();
    const realExists = fs.existsSync;
    const existsSpy = spyOn(fs, "existsSync").mockImplementation((file) => {
      if (String(file).endsWith(`${path.sep}characters${path.sep}ada.md`)) return true;
      return realExists.call(fs, file);
    });
    try {
      const collided = addEntity(project.root, { type: "character", name: "Ada", id: "chr_ada", dryRun: true });
      expect(collided.exitCode).toBe(3);
      expect(collided.envelope.diagnostics[0].code).toBe("STALE_SOURCE");
      expect(realExists.call(fs, path.join(project.root, "characters", "ada.md"))).toBe(false);
    } finally {
      existsSpy.mockRestore();
    }

    await project.addEntity({ id: "chr_bee", type: "character", name: "Bee" });
    const beePath = path.join(project.root, "characters", "chr_bee.md");
    const realRead = fs.readFileSync;
    let reads = 0;
    const hashSpy = spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      const bytes = realRead.call(fs, file, ...args);
      if (String(file) === beePath) {
        reads += 1;
        if (reads >= 3) return Buffer.from("tampered\n");
      }
      return bytes;
    });
    try {
      const stale = renameEntity(project.root, "chr_bee", "Beatrice", { dryRun: true });
      expect(stale.exitCode).toBe(3);
      expect(stale.envelope.diagnostics[0].code).toBe("STALE_SOURCE");
      expect(realRead.call(fs, beePath, "utf8")).toContain("name: Bee");
    } finally {
      hashSpy.mockRestore();
    }
  });

  test("rename updates a chapter title, reports an unclosed code span, and skips unreadable or frontmatter-less files", async () => {
    const project = await makeProject();
    const renamed = renameEntity(project.root, "chp_one", "Opening Night");
    expect(renamed.exitCode).toBe(0);
    expect(renamed.envelope.data.path).toBe("chapters/opening-night.md");
    expect(project.read("chapters/opening-night.md")).toContain("title: Opening Night");
    expect(fs.existsSync(path.join(project.root, "chapters", "one.md"))).toBe(false);

    await project.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const chapter = project.read("chapters/opening-night.md");
    fs.writeFileSync(path.join(project.root, "chapters", "opening-night.md"), `${chapter}See \`the note [Ada](../characters/chr_ada.md)\n`);
    fs.mkdirSync(path.join(project.root, "notes"));
    const loose = "Just prose, no frontmatter.\n";
    fs.writeFileSync(path.join(project.root, "notes", "loose.md"), loose);
    const sealed = path.join(project.root, "sealed");
    fs.mkdirSync(sealed);
    fs.chmodSync(sealed, 0);
    try {
      const moved = renameEntity(project.root, "chr_ada", "Adaline");
      expect(moved.exitCode).toBe(0);
      expect(moved.envelope.diagnostics.some((item) => item.code === "STALE_PROSE_LINK")).toBe(true);
      expect(project.read("chapters/opening-night.md")).toContain("See `the note [Ada](../characters/chr_ada.md)");
      expect(project.read("notes/loose.md")).toBe(loose);
    } finally {
      fs.chmodSync(sealed, 0o755);
    }
  });

  test("rename reports a record whose frontmatter breaks after it was loaded", async () => {
    const project = await makeProject();
    await project.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const adaPath = path.join(project.root, "characters", "chr_ada.md");
    const realRead = fs.readFileSync;
    let reads = 0;
    const spy = spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      const bytes = realRead.call(fs, file, ...args);
      if (String(file) === adaPath) {
        reads += 1;
        if (reads === 2) return Buffer.from("not frontmatter\n");
      }
      return bytes;
    });
    try {
      const broken = renameEntity(project.root, "chr_ada", "Adaline");
      expect(broken.exitCode).toBe(2);
      expect(broken.envelope.diagnostics[0].message).toContain("frontmatter");
      expect(fs.existsSync(adaPath)).toBe(true);
      expect(realRead.call(fs, adaPath, "utf8")).toContain("name: Ada");
    } finally {
      spy.mockRestore();
    }
  });

  test("remove and show name the entity they cannot find, and remove requires a policy", async () => {
    const project = await makeProject();
    const policy = removeEntity(project.root, "chr_missing", {});
    expect(policy.exitCode).toBe(2);
    expect(policy.envelope.diagnostics[0].message).toContain("--policy refuse|detach");

    const removed = removeEntity(project.root, "chr_missing", { policy: "refuse" });
    expect(removed.exitCode).toBe(1);
    expect(removed.envelope.diagnostics[0].code).toBe("ENTITY_NOT_FOUND");

    const renamed = renameEntity(project.root, "chr_missing", "Nobody");
    expect(renamed.exitCode).toBe(1);
    expect(renamed.envelope.diagnostics[0].code).toBe("ENTITY_NOT_FOUND");

    const shown = showEntity(project.root, "chr_missing");
    expect(shown.exitCode).toBe(1);
    expect(shown.envelope.diagnostics[0].code).toBe("ENTITY_NOT_FOUND");
  });
});

describe("project discovery, identity, and schema edges", () => {
  test("resolveRoot uses the command name when the positionals are not a command", () => {
    const cwd = makeTempDir();
    expect(resolveRoot(cwd, parseArgs(["ignored", "book"]), "validate")).toBe(path.join(cwd, "book"));
    expect(resolveRoot(cwd, parseArgs([]), "entity")).toBe(path.resolve(cwd));
  });

  test("discovery walks to the filesystem root and still finds a nested project", async () => {
    expect(discoverProject("")).toBe(null);
    expect(discoverProject(fs.mkdtempSync(path.join(os.tmpdir(), "story-miss-")))).toBe(null);
    const project = await makeProject();
    expect(discoverProject(path.join(project.root, "chapters"))).toBe(project.root);
  });

  test("filenames gain a numeric suffix and duplicate ids are reported once", () => {
    const taken = new Set(["ada.md", "ada-chr_ada.md", "ada-chr_ada-2.md"]);
    expect(identity.uniqueFilename("ada", "chr_ada", taken)).toBe("ada-chr_ada-3.md");
    expect(identity.duplicateIds(["a", "b", "a", "a", "b"])).toEqual(["a", "b"]);
  });

  test("an unknown schema name is its own finding", () => {
    const findings = validateDocument({ id: "x" }, "nope");
    expect(findings.map((item) => item.code)).toEqual(["SCHEMA_VIOLATION"]);
    expect(findings[0].message).toContain("Unknown schema: nope");
  });

  test("init rejects an empty title, a bad tense, a file path, and an id the schema refuses", () => {
    const cwd = makeTempDir();
    expect(initProject({ title: "   ", cwd, dir: "empty" }).exitCode).toBe(2);
    expect(initProject({ title: "Tense", cwd, dir: "tense", tense: "pluperfect" }).envelope.diagnostics[0].message).toContain("Unsupported tense");
    fs.writeFileSync(path.join(cwd, "blocked"), "not a directory\n");
    const blocked = initProject({ title: "Blocked", cwd, dir: "blocked" });
    expect(blocked.exitCode).toBe(2);
    expect(blocked.envelope.diagnostics[0].code).toBe("OUTPUT_EXISTS");

    const spy = spyOn(identity, "allocateId").mockReturnValue("NOT VALID");
    try {
      const refused = initProject({ title: "Schema", cwd, dir: "schema" });
      expect(refused.exitCode).toBe(2);
      expect(refused.envelope.diagnostics[0].code).toBe("SCHEMA_VIOLATION");
      expect(fs.existsSync(path.join(cwd, "schema"))).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("loader diagnostics for files the walk cannot trust", () => {
  test("a directory with no story.md is not a project root", () => {
    const root = makeTempDir();
    const loaded = loadProjectSync(root);
    expect(loaded.diagnostics.map((item) => item.code)).toContain("PROJECT_ROOT_MISSING");
    expect(loaded.records.size).toBe(0);
  });

  test("symlinked record directories and files are not canonical input", async () => {
    const project = await makeProject();
    const outside = makeTempDir();
    fs.symlinkSync(outside, path.join(project.root, "research"));
    const linkedDir = loadProjectSync(project.root);
    expect(linkedDir.diagnostics.some((item) => item.message.includes("must not contain symlinks"))).toBe(true);
    fs.unlinkSync(path.join(project.root, "research"));

    fs.mkdirSync(path.join(project.root, "research"));
    fs.writeFileSync(path.join(project.root, "research", "real.md"), "real\n");
    fs.symlinkSync("real.md", path.join(project.root, "research", "link.md"));
    const linkedFile = loadProjectSync(project.root);
    expect(linkedFile.diagnostics.some((item) => item.message.includes("linked records"))).toBe(true);
  });

  test("an unreadable record file is reported and the rest of the project still loads", async () => {
    const project = await makeProject();
    const secret = path.join(project.root, "research");
    fs.mkdirSync(secret);
    const file = path.join(secret, "secret.md");
    fs.writeFileSync(file, "---\nformat: story-toolkit\n---\n");
    fs.chmodSync(file, 0);
    try {
      const loaded = loadProjectSync(project.root);
      expect(loaded.diagnostics.some((item) => item.code === "RECORD_UNREADABLE" && item.message.includes("secret.md"))).toBe(true);
      expect(loaded.records.has("prj_00000001")).toBe(true);
    } finally {
      fs.chmodSync(file, 0o644);
    }
  });
});

describe("import paths that refuse or preview", () => {
  test("a single file, a preamble, and broken frontmatter still import", () => {
    const cwd = makeTempDir();
    fs.writeFileSync(path.join(cwd, "solo.md"), "# Chapter 1: Solo\n\nOne file.\n", "utf8");
    const single = importMarkdown({ source: "solo.md", cwd, out: "solo", title: "Solo" });
    expect(single.exitCode).toBe(0);
    expect(single.envelope.data.chapters.map((chapter) => chapter.title)).toEqual(["Solo"]);

    const derived = importMarkdown({ source: "solo.md", cwd, out: "derived" });
    expect(derived.exitCode).toBe(0);
    expect(derived.envelope.data.title).toBe("Solo");

    const mixed = path.join(cwd, "mixed");
    fs.mkdirSync(mixed);
    fs.writeFileSync(path.join(mixed, "a-pre.md"), "A note before.\n\n# Chapter 1: Afterward\n\nThe body.\n", "utf8");
    fs.writeFileSync(path.join(mixed, "b-broken.md"), "---\n[broken\n---\n# Chapter 2: Kept\n\nStill prose.\n", "utf8");
    const imported = importMarkdown({ source: "mixed", cwd, out: "mixed-out", title: "Mixed" });
    expect(imported.exitCode).toBe(0);
    expect(imported.envelope.data.chapters.map((chapter) => chapter.title)).toEqual(["Opening", "Afterward", "Kept"]);
  });

  test("directory imports skip non-markdown links and refuse markdown links", () => {
    const cwd = makeTempDir();
    const ok = path.join(cwd, "ok");
    fs.mkdirSync(ok);
    fs.writeFileSync(path.join(ok, "chapter.txt"), "# Chapter 1: Text\n\nFrom text.\n", "utf8");
    fs.symlinkSync(path.join(ok, "chapter.txt"), path.join(ok, "skip.dat"));
    const imported = importMarkdown({ source: "ok", cwd, out: "ok-out", title: "Text" });
    expect(imported.exitCode).toBe(0);

    const bad = path.join(cwd, "bad");
    fs.mkdirSync(bad);
    const real = path.join(bad, "real.md");
    fs.writeFileSync(real, "# Chapter 1: Real\n\nProse.\n", "utf8");
    fs.symlinkSync(real, path.join(bad, "link.md"));
    const refused = importMarkdown({ source: "bad", cwd, out: "bad-out" });
    expect(refused.exitCode).toBe(2);
    expect(refused.envelope.diagnostics[0].message).toContain("symlinked");
    expect(fs.existsSync(path.join(cwd, "bad-out"))).toBe(false);
  });

  test("a source that disappears between the existence check and the read is not imported", () => {
    const cwd = makeTempDir();
    const source = path.join(cwd, "gone.md");
    fs.writeFileSync(source, "# Chapter 1: Gone\n\nProse.\n", "utf8");
    const real = fs.lstatSync;
    const spy = spyOn(fs, "lstatSync").mockImplementation((file, ...args) => {
      if (String(file) === source) throw ioError("ENOENT", "gone");
      return real.call(fs, file, ...args);
    });
    try {
      const missing = importMarkdown({ source: "gone.md", cwd, out: "gone-out" });
      expect(missing.exitCode).toBe(2);
      expect(missing.envelope.diagnostics[0].message).toContain("Import source not found");
      expect(fs.existsSync(path.join(cwd, "gone-out"))).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  test("more than 500 files, an invalid id, a dry run, and a failed write stop the import", () => {
    const cwd = makeTempDir();
    const many = path.join(cwd, "many");
    fs.mkdirSync(many);
    for (let index = 0; index < 501; index += 1) {
      fs.writeFileSync(path.join(many, `f${index}.md`), "x\n");
    }
    const tooMany = importMarkdown({ source: "many", cwd, out: "many-out" });
    expect(tooMany.exitCode).toBe(2);
    expect(tooMany.envelope.diagnostics[0].message).toContain("Too many import files");

    fs.writeFileSync(path.join(cwd, "bad-id.md"), "---\nid: Bad Id\n---\n# Chapter 1: Bad\n\nProse.\n", "utf8");
    const badId = importMarkdown({ source: "bad-id.md", cwd, out: "bad-id-out" });
    expect(badId.exitCode).toBe(2);
    expect(badId.envelope.diagnostics[0].message).toContain("Invalid imported id: Bad Id");

    fs.writeFileSync(path.join(cwd, "preview.md"), "# Chapter 1: Preview\n\nProse.\n", "utf8");
    const preview = importMarkdown({ source: "preview.md", cwd, out: "preview-out", title: "Preview", dryRun: true });
    expect(preview.exitCode).toBe(0);
    expect(preview.envelope.data.dryRun).toBe(true);
    expect(fs.existsSync(path.join(cwd, "preview-out"))).toBe(false);
  });

  test("schema failures and a write error leave no output directory", () => {
    const cwd = makeTempDir();
    fs.writeFileSync(path.join(cwd, "book.md"), "# Chapter 1: Door\n\nShe opened it.\n", "utf8");
    const real = schema.validateRecord;
    const projectSpy = spyOn(schema, "validateRecord").mockImplementation((record) => {
      if (record?.type === "project" && record.title === "Reject Me") {
        return [{
          code: "SCHEMA_VIOLATION",
          severity: "error",
          message: "project rejected",
          recordIds: [],
          sources: [],
          evidence: "structural",
          action: "Fix the project record."
        }];
      }
      return real(record);
    });
    try {
      const refused = importMarkdown({ source: "book.md", cwd, out: "rejected", title: "Reject Me" });
      expect(refused.exitCode).toBe(2);
      expect(refused.envelope.diagnostics[0].message).toBe("project rejected");
      expect(fs.existsSync(path.join(cwd, "rejected"))).toBe(false);
    } finally {
      projectSpy.mockRestore();
    }

    const chapterSpy = spyOn(schema, "validateRecord").mockImplementation((record) => {
      if (record?.type === "chapter" || record?.type === "scene") {
        return [{
          code: "SCHEMA_VIOLATION",
          severity: "error",
          message: `${record.type} rejected`,
          recordIds: [],
          sources: [],
          evidence: "structural",
          action: "Fix the record."
        }];
      }
      return real(record);
    });
    try {
      const refused = importMarkdown({ source: "book.md", cwd, out: "chapter-rejected", title: "Door" });
      expect(refused.exitCode).toBe(2);
      expect(refused.envelope.diagnostics.map((item) => item.message)).toContain("chapter rejected");
      expect(fs.existsSync(path.join(cwd, "chapter-rejected"))).toBe(false);

      fs.writeFileSync(path.join(cwd, "scene.md"), "# Chapter 1: Marked\n\n<!-- story-scene: scn_door -->\n\nProse.\n", "utf8");
      const sceneRefused = importMarkdown({ source: "scene.md", cwd, out: "scene-rejected", title: "Marked" });
      expect(sceneRefused.exitCode).toBe(2);
      expect(sceneRefused.envelope.diagnostics.map((item) => item.message)).toContain("scene rejected");
      expect(fs.existsSync(path.join(cwd, "scene-rejected"))).toBe(false);
    } finally {
      chapterSpy.mockRestore();
    }

    const realWrite = fs.writeFileSync;
    const writeSpy = spyOn(fs, "writeFileSync").mockImplementation((file, data, ...args) => {
      if (String(file).startsWith(path.join(cwd, "write-fail"))) throw new Error("disk full");
      return realWrite.call(fs, file, data, ...args);
    });
    try {
      const failed = importMarkdown({ source: "book.md", cwd, out: "write-fail", title: "Door" });
      expect(failed.exitCode).toBe(4);
      expect(failed.envelope.diagnostics[0].code).toBe("OPERATION_FAILED");
      expect(failed.envelope.diagnostics[0].message).toContain("disk full");
      expect(fs.existsSync(path.join(cwd, "write-fail"))).toBe(false);
    } finally {
      writeSpy.mockRestore();
    }
  });
});

describe("storage helpers and transaction failure paths", () => {
  test("hash helpers and source spans cover the whole file and missing markers", async () => {
    const project = await makeProject();
    const file = path.join(project.root, "chapters", "one.md");
    expect(hashUtf8("abc")).toBe(sha256Hex(Buffer.from("abc", "utf8")));
    expect(hashFile(file)).toBe(sha256Hex(fs.readFileSync(file)));
    const whole = readSourceSpan(project.root, { path: "chapters/one.md" });
    expect(whole.start).toBe(0);
    expect(whole.bytes.equals(fs.readFileSync(file))).toBe(true);
    expect(() => readSourceSpan(project.root, { path: "chapters/one.md", sceneId: "scn_missing" })).toThrow(StorageError);
    fs.writeFileSync(file, `${project.read("chapters/one.md")}<!-- story-scene: scn_one -->\nBeat.\n`);
    expect(() => readSourceSpan(project.root, { path: "chapters/one.md", sceneId: "scn_one", beatId: "beat_missing" })).toThrow(/No beat marker/);
  });

  test("path checks reject empty paths, unresolvable targets, and unreadable listings", async () => {
    const project = await makeProject();
    expect(() => resolveWithinRoot(project.root, "  ")).toThrow(/non-empty project-relative path/);

    const real = fs.realpathSync;
    const spy = spyOn(fs, "realpathSync").mockImplementation((file) => {
      if (String(file).endsWith(`${path.sep}locked`)) throw ioError("EACCES", "denied");
      return real.call(fs, file);
    });
    fs.mkdirSync(path.join(project.root, "locked"));
    try {
      expect(() => assertWritableTarget(project.root, path.join(project.root, "locked", "file.md"))).toThrow(StorageError);
    } finally {
      spy.mockRestore();
    }

    const realRead = fs.readdirSync;
    const readSpy = spyOn(fs, "readdirSync").mockImplementation((dir, ...args) => {
      if (String(dir) === project.root) throw ioError("EACCES", "denied");
      return realRead.call(fs, dir, ...args);
    });
    try {
      writeTransactionSync(project.root, [{
        path: "chapters/brand-new.md",
        action: "create",
        expectedHash: null,
        content: "new\n"
      }]);
      expect(project.read("chapters/brand-new.md")).toBe("new\n");
    } finally {
      readSpy.mockRestore();
    }
  });

  test("frontmatter edits keep blank lines inside blocks and refuse a loose list", () => {
    const markdown = [
      "---",
      "title: Old",
      "note: |",
      "  alpha",
      "",
      "  beta",
      "---",
      "Body"
    ].join("\n");
    const next = replaceFrontmatter(markdown, { title: "New", note: "alpha\n\nbeta\n", extra: undefined });
    expect(next).toContain("title: New");
    expect(next).toContain("  alpha\n\n  beta");
    expect(next).not.toContain("extra");

    expect(() => replaceFrontmatter("---\ntitle: Old\n\"odd key\": 1\n---\n", { title: "New" })).toThrow(/unsupported line layout/);
  });

  test("a transaction rejects an empty or malformed write set", async () => {
    const project = await makeProject();
    expect(() => writeTransactionSync(project.root, [])).toThrow(/non-empty array of writes/);
    expect(() => writeTransactionSync(project.root, [null])).toThrow(/Each write must be an object/);
    expect(() => writeTransactionSync(project.root, [{ path: "", action: "create", expectedHash: null, content: "x" }])).toThrow(/project-relative path/);
    expect(() => writeTransactionSync(project.root, [{ path: "chapters/two.md", action: "edit", expectedHash: null, content: "x" }])).toThrow(/Write action must be/);
    expect(() => writeTransactionSync(project.root, [{ path: "chapters/two.md", action: "create", expectedHash: null }])).toThrow(/needs content/);
  });

  test("create and replace targets must be real files in real directories", async () => {
    const project = await makeProject();
    expect(() => writeTransactionSync(project.root, [{
      path: "chapters/one.md/child.md",
      action: "create",
      expectedHash: null,
      content: "x\n"
    }])).toThrow(/ENOTDIR while validating path components/);

    const realLstat = fs.lstatSync;
    const lstatSpy = spyOn(fs, "lstatSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}nested.md`)) throw ioError("ENOENT", "missing");
      return realLstat.call(fs, file, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/one.md/nested.md",
        action: "create",
        expectedHash: null,
        content: "x\n"
      }])).toThrow(/Create target directory is missing/);
    } finally {
      lstatSpy.mockRestore();
    }

    expect(() => writeTransactionSync(project.root, [{
      path: "chapters",
      action: "replace",
      expectedHash: project.hash("story.md"),
      content: "x\n"
    }])).toThrow(/Target file is missing: chapters/);

    fs.mkdirSync(path.join(project.root, "extra"));
    const realStat = fs.statSync;
    const statSpy = spyOn(fs, "statSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}extra`)) throw ioError("EACCES", "denied");
      return realStat.call(fs, file, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "extra/new.md",
        action: "create",
        expectedHash: null,
        content: "x\n"
      }])).toThrow(/EACCES while checking the create target directory/);
    } finally {
      statSpy.mockRestore();
    }

    const replaceSpy = spyOn(fs, "statSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}chapters${path.sep}one.md`)) throw ioError("EACCES", "denied");
      return realStat.call(fs, file, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/one.md",
        action: "replace",
        expectedHash: project.hash("chapters/one.md"),
        content: "x\n"
      }])).toThrow(/EACCES while validating the replace target/);
    } finally {
      replaceSpy.mockRestore();
    }
  });

  test("an in-project symlink is not a transaction target", async () => {
    const project = await makeProject();
    fs.symlinkSync(path.join(project.root, "chapters", "one.md"), path.join(project.root, "chapters", "alias.md"));
    expect(() => writeTransactionSync(project.root, [{
      path: "chapters/alias.md",
      action: "replace",
      expectedHash: project.hash("chapters/one.md"),
      content: "x\n"
    }])).toThrow(/must not contain symlinks/);
    expect(project.read("chapters/one.md")).toBe(project.initial("chapters/one.md"));
  });

  test("lock, staging, and cleanup failures stay coded storage errors", async () => {
    const project = await makeProject();
    const realOpen = fs.openSync;
    const openSpy = spyOn(fs, "openSync").mockImplementation((file, flags, ...args) => {
      if (String(file).endsWith(`${path.sep}.story${path.sep}lock`)) throw ioError("EACCES", "denied");
      return realOpen.call(fs, file, flags, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/two.md",
        action: "create",
        expectedHash: null,
        content: "two\n"
      }])).toThrow(/EACCES while acquiring the project lock/);
    } finally {
      openSpy.mockRestore();
    }
    expect(fs.existsSync(path.join(project.root, "chapters", "two.md"))).toBe(false);

    const realCopy = fs.copyFileSync;
    const copySpy = spyOn(fs, "copyFileSync").mockImplementation(() => {
      throw ioError("EACCES", "denied");
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/one.md",
        action: "replace",
        expectedHash: project.hash("chapters/one.md"),
        content: "changed\n"
      }])).toThrow(/EACCES while staging the preimage/);
    } finally {
      copySpy.mockRestore();
    }
    expect(project.read("chapters/one.md")).toBe(project.initial("chapters/one.md"));

    const realWrite = fs.writeFileSync;
    const writeSpy = spyOn(fs, "writeFileSync").mockImplementation((file, data, ...args) => {
      if (String(file).includes(`${path.sep}contents${path.sep}`)) throw ioError("EACCES", "denied");
      return realWrite.call(fs, file, data, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/three.md",
        action: "create",
        expectedHash: null,
        content: "three\n"
      }])).toThrow(/EACCES while staging content/);
    } finally {
      writeSpy.mockRestore();
    }

    const realMkdir = fs.mkdirSync;
    const mkdirSpy = spyOn(fs, "mkdirSync").mockImplementation((dir, ...args) => {
      if (String(dir).includes(`${path.sep}transactions${path.sep}`)) throw ioError("EACCES", "denied");
      return realMkdir.call(fs, dir, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/four.md",
        action: "create",
        expectedHash: null,
        content: "four\n"
      }])).toThrow(/EACCES while staging the transaction/);
    } finally {
      mkdirSpy.mockRestore();
    }

    const realRm = fs.rmSync;
    const rmSpy = spyOn(fs, "rmSync").mockImplementation((dir, ...args) => {
      if (String(dir).includes(`${path.sep}.story${path.sep}transactions${path.sep}`)) throw ioError("EBUSY", "busy");
      return realRm.call(fs, dir, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/five.md",
        action: "create",
        expectedHash: null,
        content: "five\n"
      }])).toThrow(/EBUSY while cleaning preimages/);
    } finally {
      rmSpy.mockRestore();
    }
    expect(project.read("chapters/five.md")).toBe("five\n");

    const realRead = fs.readFileSync;
    const readSpy = spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      if (String(file).endsWith(`${path.sep}.story${path.sep}lock`)) throw ioError("EACCES", "denied");
      return realRead.call(fs, file, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/six.md",
        action: "create",
        expectedHash: null,
        content: "six\n"
      }])).toThrow(/EACCES while releasing the project lock/);
    } finally {
      readSpy.mockRestore();
    }
    expect(project.read("chapters/six.md")).toBe("six\n");
  });

  test("a raw error after a file is applied is rolled back as an operation failure", async () => {
    const project = await makeProject();
    const realWrite = fs.writeFileSync;
    let journals = 0;
    const spy = spyOn(fs, "writeFileSync").mockImplementation((file, data, ...args) => {
      if (String(file).endsWith(`${path.sep}journal.json`)) {
        journals += 1;
        if (journals >= 2) throw new Error("journal failed");
      }
      return realWrite.call(fs, file, data, ...args);
    });
    try {
      expect(() => writeTransactionSync(project.root, [{
        path: "chapters/journal.md",
        action: "create",
        expectedHash: null,
        content: "x\n"
      }])).toThrow(/Transaction .* failed: journal failed/);
    } finally {
      spy.mockRestore();
    }
    expect(fs.existsSync(path.join(project.root, "chapters", "journal.md"))).toBe(false);
  });

  test("a failure mid-set rolls back applied files or reports a rollback conflict", async () => {
    const project = await makeProject();
    const originalStory = project.read("story.md");
    let applied = false;
    const realRead = fs.readFileSync;
    const realRename = fs.renameSync;
    const readSpy = spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      const bytes = realRead.call(fs, file, ...args);
      if (applied && String(file).endsWith(`${path.sep}chapters${path.sep}one.md`)) return Buffer.from("external\n");
      return bytes;
    });
    const renameSpy = spyOn(fs, "renameSync").mockImplementation((from, to) => {
      const result = realRename.call(fs, from, to);
      if (String(to).endsWith(`${path.sep}story.md`)) applied = true;
      return result;
    });
    try {
      expect(() => writeTransactionSync(project.root, [
        { path: "story.md", action: "replace", expectedHash: project.hash("story.md"), content: `${originalStory}<!-- touched -->\n` },
        { path: "chapters/one.md", action: "replace", expectedHash: project.hash("chapters/one.md"), content: "next\n" }
      ])).toThrow(/File changed while the transaction ran/);
    } finally {
      readSpy.mockRestore();
      renameSpy.mockRestore();
    }
    expect(project.read("story.md")).toBe(originalStory);
    expect(project.read("chapters/one.md")).toBe(project.initial("chapters/one.md"));

    const created = await makeProject();
    let createdApplied = false;
    const realRead2 = fs.readFileSync;
    const realRename2 = fs.renameSync;
    const readSpy2 = spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      const bytes = realRead2.call(fs, file, ...args);
      if (createdApplied && String(file).endsWith(`${path.sep}chapters${path.sep}one.md`)) return Buffer.from("external\n");
      return bytes;
    });
    const renameSpy2 = spyOn(fs, "renameSync").mockImplementation((from, to) => {
      const result = realRename2.call(fs, from, to);
      if (String(to).endsWith(`${path.sep}chapters${path.sep}two.md`)) createdApplied = true;
      return result;
    });
    try {
      expect(() => writeTransactionSync(created.root, [
        { path: "chapters/two.md", action: "create", expectedHash: null, content: "two\n" },
        { path: "chapters/one.md", action: "replace", expectedHash: created.hash("chapters/one.md"), content: "next\n" }
      ])).toThrow(/File changed while the transaction ran/);
    } finally {
      readSpy2.mockRestore();
      renameSpy2.mockRestore();
    }
    expect(fs.existsSync(path.join(created.root, "chapters", "two.md"))).toBe(false);

    const removed = await makeProject();
    removed.write("facts/gone.md", "gone\n");
    let removedApplied = false;
    const realRead3 = fs.readFileSync;
    const realUnlink = fs.unlinkSync;
    const realWrite = fs.writeFileSync;
    const readSpy3 = spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      const bytes = realRead3.call(fs, file, ...args);
      if (removedApplied && String(file).endsWith(`${path.sep}chapters${path.sep}one.md`)) return Buffer.from("external\n");
      return bytes;
    });
    const unlinkSpy = spyOn(fs, "unlinkSync").mockImplementation((file) => {
      const result = realUnlink.call(fs, file);
      if (String(file).endsWith(`${path.sep}facts${path.sep}gone.md`)) {
        realWrite.call(fs, file, "recreated\n");
        removedApplied = true;
      }
      return result;
    });
    try {
      let caught = null;
      try {
        writeTransactionSync(removed.root, [
          { path: "facts/gone.md", action: "remove", expectedHash: removed.hash("facts/gone.md") },
          { path: "chapters/one.md", action: "replace", expectedHash: removed.hash("chapters/one.md"), content: "next\n" }
        ]);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(StorageError);
      expect(caught.code).toBe("ROLLBACK_CONFLICT");
      expect(caught.details.conflicts[0].message).toContain("recreated externally");
    } finally {
      readSpy3.mockRestore();
      unlinkSpy.mockRestore();
    }
  });
});
