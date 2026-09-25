import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../storage/document.js";
import { sha256Hex } from "../storage/hash.js";
import { danglingReferenceDiagnostics } from "./references.js";
import { validateRecord } from "./schema.js";

const RECORD_DIRECTORIES = [
  "characters", "worldbuilding", "glossary", "plot", "facts", "decisions",
  "issues", "research", "scenes", "assets/records", "shots", "chapters", "matter"
];

function diagnostic(code, message, action) {
  return {
    code,
    severity: "error",
    message,
    recordIds: [],
    sources: [],
    evidence: "structural",
    action
  };
}

/**
 * Loads a story-toolkit project: parses story.md and every record file in the
 * format's record directories, validates each against the fork's schemas, and
 * indexes records by their explicit id. Diagnostics are collected, not thrown
 * — a project with findings still loads so checks can report them, while
 * invalid records stay out of the validated index. Duplicate
 * ids are reported and the first file wins, so later tasks can rely on one
 * record per id. The result is a snapshot of read files, not authority to
 * overwrite later edits.
 */
export async function loadProject(root) {
  return loadProjectSync(root);
}

export function loadProjectSync(root) {
  const diagnostics = [];
  const records = new Map();
  const unindexed = [];

  function addRecord(relativePath) {
    const entry = loadRecord(root, relativePath, diagnostics);
    if (!entry) return;
    if (!entry.valid) {
      unindexed.push(entry);
      return;
    }
    if (records.has(entry.id)) {
      diagnostics.push(diagnostic(
        "DUPLICATE_RECORD_ID",
        `Record id ${entry.id} is already used by ${records.get(entry.id).path}`,
        "Ids are unique across the project; give one of the records a fresh explicit id."
      ));
      unindexed.push(entry);
      return;
    }
    records.set(entry.id, entry);
  }

  const storyPath = path.join(root, "story.md");
  if (!fs.existsSync(storyPath)) {
    diagnostics.push(diagnostic(
      "PROJECT_ROOT_MISSING",
      `No story.md at ${root}`,
      "Point --project at the directory containing story.md, or run story init."
    ));
  } else {
    addRecord("story.md");
  }
  if (fs.existsSync(path.join(root, "series.md"))) addRecord("series.md");

  function walk(directory, optional = false) {
    const absolute = path.join(root, directory);
    let entries;
    try {
      // Do not follow links into work/, other projects or recursive loops.
      let current = root;
      for (const part of directory.split(path.sep)) {
        current = path.join(current, part);
        if (fs.lstatSync(current).isSymbolicLink()) {
          diagnostics.push(diagnostic("RECORD_UNREADABLE", `${directory}: record directories must not contain symlinks`, "Use a directory inside this project."));
          return;
        }
      }
      entries = fs.readdirSync(absolute, { withFileTypes: true });
    } catch (error) {
      if (optional && error.code === "ENOENT") return;
      diagnostics.push(diagnostic("RECORD_UNREADABLE", `Could not read ${directory}: ${error.message}`, "Check the record directory and its permissions."));
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      const relative = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(relative);
      else if (entry.isFile() && entry.name.endsWith(".md")) addRecord(relative);
      else if (entry.isSymbolicLink()) {
        diagnostics.push(diagnostic("RECORD_UNREADABLE", `${relative}: linked records are not canonical input`, "Use a regular record file inside this project."));
      }
    }
  }
  for (const directory of RECORD_DIRECTORIES) walk(directory, true);

  diagnostics.push(...danglingReferenceDiagnostics({ records, unindexed }));
  return { root, records, unindexed, diagnostics };
}

function loadRecord(root, relativePath, diagnostics) {
  const absPath = path.join(root, relativePath);
  let bytes;
  let markdown;
  try {
    if (!fs.lstatSync(absPath).isFile()) throw new Error("Record must be a regular file, not a symlink");
    bytes = fs.readFileSync(absPath);
    markdown = bytes.toString("utf8");
  } catch (error) {
    diagnostics.push(diagnostic(
      "RECORD_UNREADABLE",
      `Could not read ${relativePath}: ${error.message}`,
      "Check file permissions on the record file."
    ));
    return null;
  }

  let parsed;
  try {
    parsed = parseFrontmatter(markdown, relativePath);
  } catch (error) {
    diagnostics.push(diagnostic(
      "RECORD_UNPARSEABLE",
      `${relativePath}: ${error.message}`,
      "Fix the record's YAML frontmatter."
    ));
    return null;
  }

  const record = parsed.data;
  const findings = validateRecord(record);
  for (const finding of findings) {
    diagnostics.push({ ...finding, message: `${relativePath}: ${finding.message}` });
  }
  if (typeof record.id !== "string") return null;

  return {
    id: record.id,
    type: record.type,
    path: relativePath,
    hash: sha256Hex(bytes),
    record,
    body: parsed.body,
    valid: findings.length === 0
  };
}
