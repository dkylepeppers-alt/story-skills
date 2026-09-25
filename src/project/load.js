import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../storage/document.js";
import { sha256Hex } from "../storage/hash.js";
import { validateRecord } from "./schema.js";

const RECORD_DIRECTORIES = [
  "characters", "worldbuilding", "glossary", "plot", "facts", "decisions",
  "issues", "research", "scenes", "assets/records", "shots", "chapters"
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
 * — a project with findings still loads so checks can report them. Duplicate
 * ids are reported and the first file wins, so later tasks can rely on one
 * record per id. The result is a snapshot of read files, not authority to
 * overwrite later edits.
 */
export async function loadProject(root) {
  const diagnostics = [];
  const records = new Map();

  const storyPath = path.join(root, "story.md");
  if (!fs.existsSync(storyPath)) {
    diagnostics.push(diagnostic(
      "PROJECT_ROOT_MISSING",
      `No story.md at ${root}`,
      "Point --project at the directory containing story.md, or run story init."
    ));
  } else {
    const entry = loadRecord(root, "story.md", diagnostics);
    if (entry) {
      records.set(entry.id, entry);
    }
  }

  for (const directory of RECORD_DIRECTORIES) {
    const absDir = path.join(root, directory);
    if (!fs.existsSync(absDir)) {
      continue;
    }
    const files = fs.readdirSync(absDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_"))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const file of files) {
      const entry = loadRecord(root, path.join(directory, file.name), diagnostics);
      if (!entry) {
        continue;
      }
      if (records.has(entry.id)) {
        diagnostics.push(diagnostic(
          "DUPLICATE_RECORD_ID",
          `Record id ${entry.id} is already used by ${records.get(entry.id).path}`,
          "Ids are unique across the project; give one of the records a fresh explicit id."
        ));
        continue;
      }
      records.set(entry.id, entry);
    }
  }

  return { root, records, diagnostics };
}

function loadRecord(root, relativePath, diagnostics) {
  const absPath = path.join(root, relativePath);
  let markdown;
  try {
    markdown = fs.readFileSync(absPath, "utf8");
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
  for (const finding of validateRecord(record)) {
    diagnostics.push({ ...finding, message: `${relativePath}: ${finding.message}` });
  }
  if (typeof record.id !== "string") {
    return null;
  }

  return {
    id: record.id,
    type: record.type,
    path: relativePath,
    hash: sha256Hex(fs.readFileSync(absPath)),
    record
  };
}
