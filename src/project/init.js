import fs from "node:fs";
import path from "node:path";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
import { stringifyFrontmatter } from "../storage/document.js";
import { validateRecord } from "./schema.js";
import { allocateId, slugify } from "./identity.js";
import { failure, envelope, publicWrite } from "../cli/result.js";

const TENSES = new Set(["past", "present", "future", "mixed"]);

/**
 * Creates a story-toolkit project containing only story.md. An existing
 * story.md or a non-empty directory is left untouched.
 */
export function initProject(options = {}) {
  const title = String(options.title ?? "").trim();
  if (!title) {
    return failure("init", "A story title is required", "INVALID_INVOCATION", 2);
  }
  if (options.tense !== undefined && options.tense !== "" && !TENSES.has(options.tense)) {
    return failure("init", `Unsupported tense "${options.tense}": expected one of ${[...TENSES].join(", ")}`, "INVALID_INVOCATION", 2);
  }
  const cwd = options.cwd ?? process.cwd();
  const folder = options.dir ? String(options.dir).trim() : slugify(title);
  if (!folder) {
    return failure("init", `Cannot derive a directory name from title "${title}": pass --dir`, "INVALID_INVOCATION", 2);
  }
  const root = path.resolve(cwd, folder);
  if (fs.existsSync(root) && !fs.statSync(root).isDirectory()) {
    return failure("init", `${root} exists and is not a directory`, "OUTPUT_EXISTS", 2);
  }
  const storyPath = path.join(root, "story.md");
  if (fs.existsSync(storyPath)) {
    return failure("init", `${root} already contains a project. Refusing to overwrite story.md.`, "PROJECT_EXISTS", 1);
  }
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    return failure("init", `${root} already exists and is not empty. Refusing to overwrite.`, "PROJECT_EXISTS", 1);
  }

  const record = {
    format: FORMAT,
    "schema-version": SCHEMA_VERSION,
    id: allocateId("project", []),
    type: "project",
    title
  };
  if (options.premise || options.synopsis) record.premise = options.premise ?? options.synopsis;
  if (options.pov) record.pov = options.pov;
  if (options.tense) record.tense = options.tense;
  if (options.genre) record.genre = options.genre;
  if (options.subGenre) record["sub-genre"] = options.subGenre;
  if (options.settingEra) record["setting-era"] = options.settingEra;

  const diagnostics = validateRecord(record);
  if (diagnostics.length > 0) {
    return {
      envelope: envelope({ command: "init", ok: false, diagnostics }),
      exitCode: 2,
      text: `${diagnostics.map((item) => item.message).join("\n")}\n`
    };
  }

  const content = stringifyFrontmatter(record);
  const writes = [publicWrite({ path: "story.md", action: "create", expectedHash: null })];
  if (options.dryRun === true) {
    return {
      envelope: envelope({ command: "init", ok: true, data: { root, id: record.id, title, dryRun: true }, writes }),
      exitCode: 0,
      text: ""
    };
  }

  fs.mkdirSync(root, { recursive: true });
  const temporary = path.join(root, `.story.md.${process.pid}.tmp`);
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, storyPath);
  return {
    envelope: envelope({
      command: "init",
      ok: true,
      data: { root, id: record.id, title },
      writes
    }),
    exitCode: 0,
    text: `Created story project: ${root}\n`
  };
}
