import fs from "node:fs";
import path from "node:path";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
import { parseFrontmatter, stringifyFrontmatter } from "../storage/document.js";
import { validateRecord } from "./schema.js";
import { allocateId, ID_PATTERN, slugify, uniqueFilename } from "./identity.js";
import { envelope, failure, finding, publicWrite } from "../cli/result.js";

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_FILES = 500;
const ROMAN_NUMERAL = "(?!i\\s+\\S)(?=[ivxlc])c{0,3}(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})";
const CHAPTER_HEADING_PATTERN = new RegExp(`^chapter(?![A-Za-z])\\s*(?:(?:\\d+|${ROMAN_NUMERAL})(?=[\\s:.\\-–—]|$))?\\s*[:.\\-–—]*\\s*(.*)$`, "i");
const SCENE_MARKER = /^<!--\s*story-scene:\s*([A-Za-z0-9][A-Za-z0-9_-]*)\s*-->$/;
const FRONT_MATTER_NAMES = /^(?:prologue|preface|foreword|introduction|prelude)\b/i;

function importNameRank(name, nums) {
  if (nums.length > 0) return 1;
  return FRONT_MATTER_NAMES.test(name) ? 0 : 2;
}

// Natural order: prologue-style names, then numbered names by numeric value
// (chapter 2 before chapter 10), then everything else. Within a file, chapter
// headings stay in source order.
export function compareImportNames(left, right) {
  const leftNums = [...left.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rightNums = [...right.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rankDiff = importNameRank(left, leftNums) - importNameRank(right, rightNums);
  if (rankDiff !== 0) return rankDiff;
  const length = Math.max(leftNums.length, rightNums.length);
  for (let index = 0; index < length; index += 1) {
    const leftNum = leftNums[index];
    const rightNum = rightNums[index];
    if (leftNum === undefined) return -1;
    if (rightNum === undefined) return 1;
    if (leftNum !== rightNum) return leftNum - rightNum;
  }
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function isAmbiguousSceneBreak(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  if (SCENE_MARKER.test(trimmed)) return false;
  if (/^(?:---|\*\*\*|___|\* \* \*)$/.test(trimmed)) return true;
  if (/^(?:\*\s*){3,}$/.test(trimmed)) return true;
  if (/^(?:-\s*){3,}$/.test(trimmed)) return true;
  if (/^(?:_\s*){3,}$/.test(trimmed)) return true;
  return false;
}

function readFrontmatter(text) {
  const match = /^(?:\uFEFF)?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n)?/.exec(text);
  if (!match) return { data: null, body: text };
  try {
    return { data: parseFrontmatter(text).data, body: text.slice(match[0].length) };
  } catch {
    return { data: null, body: text.slice(match[0].length) };
  }
}

function sourceProblem(file) {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch {
    return `Import source not found: ${file}`;
  }
  if (stat.isSymbolicLink()) return `Refusing to import symlinked source: ${file}`;
  if (stat.isFile() && stat.size > MAX_IMPORT_FILE_BYTES) {
    return `Refusing to import oversized file ${file}: ${stat.size} bytes exceeds the ${MAX_IMPORT_FILE_BYTES} byte limit`;
  }
  return null;
}

function readDocuments(source) {
  const problem = sourceProblem(source);
  if (problem) return { error: problem };
  if (fs.statSync(source).isFile()) {
    return { documents: [{ name: path.basename(source), text: fs.readFileSync(source, "utf8") }] };
  }
  const names = [];
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const full = path.join(source, entry.name);
    if (fs.lstatSync(full).isSymbolicLink()) {
      if (/\.(md|markdown|txt)$/i.test(entry.name)) return { error: `Refusing to import symlinked source: ${full}` };
      continue;
    }
    if (entry.isFile() && /\.(md|markdown|txt)$/i.test(entry.name)) names.push(entry.name);
  }
  names.sort(compareImportNames);
  if (names.length > MAX_IMPORT_FILES) {
    return { error: `Too many import files in ${source}: ${names.length} exceeds the ${MAX_IMPORT_FILES} file limit` };
  }
  if (names.length === 0) return { error: `No markdown or text files found in ${source}` };
  const documents = [];
  for (const name of names) {
    const full = path.join(source, name);
    const fileProblem = sourceProblem(full);
    if (fileProblem) return { error: fileProblem };
    documents.push({ name, text: fs.readFileSync(full, "utf8") });
  }
  return { documents };
}

function titleFrom(fileName, data) {
  if (typeof data?.title === "string" && data.title.trim() !== "") return data.title.trim();
  const base = path.basename(fileName, path.extname(fileName));
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function splitDocument(document) {
  const { data, body } = readFrontmatter(document.text);
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const findings = [];
  const chapters = [];
  const preamble = [];
  const preambleMarkers = [];
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const marker = SCENE_MARKER.exec(line.trim());
    if (!marker && isAmbiguousSceneBreak(line)) {
      findings.push(finding({
        code: "AMBIGUOUS_SCENE_BREAK",
        severity: "warning",
        message: `${document.name}:${index + 1}: ambiguous scene break; the prose stays in its chapter`,
        evidence: "candidate",
        action: "Mark the scene explicitly with <!-- story-scene: scn_... --> or leave the break as prose."
      }));
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const chapterMatch = heading ? CHAPTER_HEADING_PATTERN.exec(heading[1].trim()) : null;
    if (chapterMatch) {
      if (current) chapters.push(current);
      current = { title: chapterMatch[1].trim() || heading[1].trim(), lines: [], markers: [] };
      continue;
    }
    if (marker) {
      if (current) current.markers.push(marker[1]);
      else preambleMarkers.push(marker[1]);
    }
    if (current) current.lines.push(line);
    else preamble.push(line);
  }
  if (current) chapters.push(current);

  const explicitId = typeof data?.id === "string" ? data.id : undefined;
  if (chapters.length === 0) {
    const prose = lines.join("\n").trim();
    if (prose === "" && preambleMarkers.length === 0) return { chapters: [], findings };
    return {
      chapters: [{
        title: titleFrom(document.name, data),
        prose,
        markers: preambleMarkers,
        explicitId
      }],
      findings
    };
  }

  const opening = preamble.join("\n").replace(/^\s*#\s+[^\n]*\n?/, "").trim();
  if (opening !== "" || preambleMarkers.length > 0) {
    chapters.unshift({ title: "Opening", lines: opening === "" ? [] : opening.split("\n"), markers: preambleMarkers });
  }
  return {
    chapters: chapters.map((chapter) => ({
      title: chapter.title || "Untitled",
      prose: chapter.lines.join("\n").trim(),
      markers: chapter.markers,
      explicitId: chapters.length === 1 ? explicitId : undefined
    })).filter((chapter) => chapter.prose !== "" || chapter.markers.length > 0),
    findings
  };
}

function errorResult(messages) {
  return {
    envelope: envelope({
      command: "import",
      ok: false,
      diagnostics: messages.map((message) => finding({
        code: message.startsWith("Invalid") ? "INVALID_INVOCATION" : "DUPLICATE_RECORD_ID",
        message,
        action: "Make every imported id unique and schema-valid, then import into a new directory."
      }))
    }),
    exitCode: 2,
    text: `${messages.join("\n")}\n`
  };
}

export function importMarkdown(options = {}) {
  const command = "import";
  const cwd = options.cwd ?? process.cwd();
  const rawSource = String(options.source ?? "").trim();
  if (!rawSource) return failure(command, "An import source file or directory is required", "INVALID_INVOCATION", 2);
  const outOption = options.out === undefined ? "" : String(options.out).trim();
  if (!outOption) return failure(command, "Import requires --out <new-directory>", "INVALID_INVOCATION", 2);
  const source = path.resolve(cwd, rawSource);
  if (!fs.existsSync(source)) return failure(command, `Import source not found: ${source}`, "INVALID_INVOCATION", 2);
  const outDir = path.resolve(cwd, outOption);
  if (fs.existsSync(outDir)) {
    return failure(command, `${outDir} already exists. Import only creates a new directory.`, "OUTPUT_EXISTS", 2);
  }

  const loaded = readDocuments(source);
  if (loaded.error) return failure(command, loaded.error, "INVALID_INVOCATION", 2);

  const chapters = [];
  const diagnostics = [];
  for (const document of loaded.documents) {
    const split = splitDocument(document);
    diagnostics.push(...split.findings);
    chapters.push(...split.chapters);
  }
  if (chapters.length === 0) return failure(command, "No chapter content found in import source", "INVALID_INVOCATION", 2);

  const used = new Set();
  const projectId = allocateId("project", used);
  used.add(projectId);
  const errors = [];
  const claim = (id) => {
    if (!ID_PATTERN.test(id)) {
      errors.push(`Invalid imported id: ${id}`);
      return false;
    }
    if (used.has(id)) {
      errors.push(`Imported id ${id} is used more than once`);
      return false;
    }
    used.add(id);
    return true;
  };
  for (const chapter of chapters) {
    if (chapter.explicitId !== undefined) {
      if (claim(chapter.explicitId)) chapter.id = chapter.explicitId;
    } else {
      chapter.id = allocateId("chapter", used);
      used.add(chapter.id);
    }
    for (const marker of chapter.markers) {
      claim(marker);
    }
  }
  if (errors.length > 0) return errorResult(errors);

  const title = String(options.title ?? "").trim()
    || chapters.find((chapter) => chapter.title && chapter.title !== "Opening")?.title
    || "Imported manuscript";
  const projectRecord = { format: FORMAT, "schema-version": SCHEMA_VERSION, id: projectId, type: "project", title };
  const projectErrors = validateRecord(projectRecord);
  if (projectErrors.length > 0) {
    return {
      envelope: envelope({ command, ok: false, diagnostics: projectErrors }),
      exitCode: 2,
      text: `${projectErrors.map((item) => item.message).join("\n")}\n`
    };
  }

  const takenNames = new Set();
  const files = [{ path: "story.md", content: stringifyFrontmatter(projectRecord) }];
  const chapterData = [];
  const schemaMessages = [];
  chapters.forEach((chapter, index) => {
    const number = index + 1;
    const filename = uniqueFilename(slugify(chapter.title) || chapter.id, chapter.id, takenNames);
    takenNames.add(filename);
    const relative = `chapters/${filename}`;
    const record = {
      format: FORMAT,
      "schema-version": SCHEMA_VERSION,
      id: chapter.id,
      type: "chapter",
      name: chapter.title,
      title: chapter.title,
      number
    };
    schemaMessages.push(...validateRecord(record).map((item) => item.message));
    const prose = chapter.prose.endsWith("\n") || chapter.prose === "" ? chapter.prose : `${chapter.prose}\n`;
    files.push({ path: relative, content: `${stringifyFrontmatter(record)}${prose}` });
    chapterData.push({ id: chapter.id, title: chapter.title, number, path: relative });
    for (const marker of chapter.markers) {
      const sceneRecord = {
        format: FORMAT,
        "schema-version": SCHEMA_VERSION,
        id: marker,
        type: "scene",
        "chapter-id": chapter.id,
        title: chapter.title
      };
      schemaMessages.push(...validateRecord(sceneRecord).map((item) => item.message));
      files.push({ path: `scenes/${marker}.md`, content: stringifyFrontmatter(sceneRecord) });
    }
  });
  if (schemaMessages.length > 0) {
    return {
      envelope: envelope({
        command,
        ok: false,
        diagnostics: schemaMessages.map((message) => finding({
          code: "SCHEMA_VIOLATION",
          message,
          action: "Correct the imported record and try again."
        }))
      }),
      exitCode: 2,
      text: `${schemaMessages.join("\n")}\n`
    };
  }

  const writes = files.map((file) => publicWrite({ path: file.path, action: "create", expectedHash: null }));
  const data = { root: outDir, id: projectId, title, chapters: chapterData, dryRun: options.dryRun === true };
  const log = diagnostics.length > 0 ? `${diagnostics.map((item) => item.message).join("\n")}\n` : undefined;
  if (options.dryRun === true) {
    return { envelope: envelope({ command, ok: true, data, diagnostics, writes }), exitCode: 0, text: "", log };
  }

  fs.mkdirSync(outDir, { recursive: true });
  try {
    for (const file of files) {
      const absolute = path.join(outDir, file.path);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      const temporary = `${absolute}.${process.pid}.tmp`;
      fs.writeFileSync(temporary, file.content);
      fs.renameSync(temporary, absolute);
    }
  } catch (error) {
    fs.rmSync(outDir, { recursive: true, force: true });
    return failure(command, error.message, "OPERATION_FAILED", 4);
  }
  return {
    envelope: envelope({ command, ok: true, data, diagnostics, writes }),
    exitCode: 0,
    text: `Imported ${chapterData.length} chapters into ${outDir}\n`,
    log
  };
}
