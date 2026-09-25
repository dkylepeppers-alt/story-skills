import fs from "node:fs";
import path from "node:path";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
import { sha256Hex } from "../storage/hash.js";
import { writeTransactionSync } from "../storage/transaction.js";

/**
 * A failure to name, read or write a comparison baseline. `exitCode` follows
 * the CLI contract: 1 refused (the snapshot exists), 2 invalid input or an
 * unknown baseline, 3 a baseline whose stored bytes no longer match their
 * hashes, 4 a Git operational failure.
 */
export class BaselineError extends Error {
  constructor(code, message, exitCode) {
    super(message);
    this.name = "BaselineError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

export const SNAPSHOT_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export const REVISIONS_DIRECTORY = ".story/revisions";

// Top-level directories never captured in a snapshot or compared as working
// files: toolkit state, Git's storage, installed dependencies and disposable
// build output (the same set entity scans skip).
const SKIPPED_DIRECTORIES = new Set([".git", ".story", "node_modules", "dist"]);

export function isSnapshotName(name) {
  return typeof name === "string" && SNAPSHOT_NAME_PATTERN.test(name) && !name.endsWith(".");
}

/** A project-relative POSIX path that stays inside the project and outside .story/. */
export function isComparablePath(file) {
  if (typeof file !== "string" || file === "" || file.startsWith("/") || file.includes("\\") || file.includes("\0")) return false;
  const parts = file.split("/");
  return !parts.some((part) => part === "" || part === "." || part === "..") && !SKIPPED_DIRECTORIES.has(parts[0]);
}

/**
 * The project's working files as a Map of POSIX path to bytes, in path
 * order. Symlinks are not followed or captured, so a snapshot never reads
 * outside the project.
 */
export function projectFiles(root) {
  const files = new Map();
  const walk = (relative) => {
    const entries = fs.readdirSync(path.join(root, relative), { withFileTypes: true })
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const child = relative === "" ? entry.name : `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!(relative === "" && SKIPPED_DIRECTORIES.has(entry.name))) walk(child);
      } else if (entry.isFile()) {
        files.set(child, fs.readFileSync(path.join(root, child)));
      }
    }
  };
  walk("");
  return new Map([...files].sort(([left], [right]) => compareText(left, right)));
}

export function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function manifestFor(name, files) {
  const manifest = {
    format: FORMAT,
    "schema-version": SCHEMA_VERSION,
    type: "revision",
    name,
    files: [...files].map(([file, bytes]) => ({ path: file, hash: sha256Hex(bytes), bytes: bytes.length }))
  };
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
}

function snapshotDirectory(name) {
  return `${REVISIONS_DIRECTORY}/${name}`;
}

export function snapshotExists(root, name) {
  return isSnapshotName(name) && fs.existsSync(path.join(root, snapshotDirectory(name)));
}

/**
 * Captures the current project files as an explicit, immutable revision
 * snapshot under `.story/revisions/<name>/`: a manifest of path, SHA-256 and
 * size for every file, plus a byte-exact copy of each file. Snapshots are
 * created only by this call (the `snapshot` command); comparisons never make
 * one. The manifest carries no timestamp, so its SHA-256 identifies the
 * captured content. An existing name is refused rather than overwritten.
 */
export function createSnapshot(root, name, options = {}) {
  if (!isSnapshotName(name)) {
    throw new BaselineError(
      "SNAPSHOT_NAME_INVALID",
      `Snapshot names use letters, digits, dot, underscore and hyphen, start with a letter or digit and have at most 64 characters: ${JSON.stringify(name)}`,
      2
    );
  }
  const directory = snapshotDirectory(name);
  if (fs.existsSync(path.join(root, directory))) {
    throw new BaselineError("SNAPSHOT_EXISTS", `Snapshot ${name} already exists at ${directory}; snapshots are immutable, so choose a new name`, 1);
  }
  const files = projectFiles(root);
  const manifest = manifestFor(name, files);
  const writes = [
    { path: `${directory}/manifest.json`, action: "create", expectedHash: null, content: manifest },
    ...[...files].map(([file, bytes]) => ({ path: `${directory}/files/${file}`, action: "create", expectedHash: null, content: bytes }))
  ];
  const dryRun = options.dryRun === true;
  if (!dryRun) {
    // Transactions create files, not directories. The snapshot directory is
    // new (checked above), so a failed write removes it again and leaves the
    // name free.
    for (const write of writes) fs.mkdirSync(path.dirname(path.join(root, write.path)), { recursive: true });
    try {
      writeTransactionSync(root, writes);
    } catch (error) {
      fs.rmSync(path.join(root, directory), { recursive: true, force: true });
      throw error;
    }
  }
  return {
    snapshot: {
      name,
      hash: sha256Hex(manifest),
      path: directory,
      files: files.size,
      bytes: [...files.values()].reduce((sum, bytes) => sum + bytes.length, 0)
    },
    writes: writes.map((write) => ({ path: write.path, action: write.action })),
    dryRun
  };
}

function corrupt(name, detail) {
  return new BaselineError("SNAPSHOT_CORRUPT", `Snapshot ${name} is corrupt: ${detail}`, 3);
}

/**
 * Reads a snapshot back and verifies every copied file against its manifest
 * hash and size. Returns the baseline descriptor (the manifest hash names the
 * content) and a Map of path to bytes.
 */
export function readSnapshot(root, name) {
  const directory = path.join(root, snapshotDirectory(name));
  if (!snapshotExists(root, name)) {
    throw new BaselineError("BASELINE_NOT_FOUND", `No snapshot named ${name} in ${REVISIONS_DIRECTORY}/`, 2);
  }
  let raw;
  let manifest;
  try {
    raw = fs.readFileSync(path.join(directory, "manifest.json"));
    manifest = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    throw corrupt(name, `manifest.json cannot be read: ${error.message}`);
  }
  if (manifest === null || typeof manifest !== "object" || manifest.format !== FORMAT || manifest.type !== "revision"
    || manifest.name !== name || !Array.isArray(manifest.files)) {
    throw corrupt(name, "manifest.json is not a story-toolkit revision manifest for this name");
  }
  const files = new Map();
  for (const file of manifest.files) {
    if (file === null || typeof file !== "object" || !isComparablePath(file.path) || typeof file.hash !== "string") {
      throw corrupt(name, `manifest entry ${JSON.stringify(file?.path ?? file)} is not a safe project path with a hash`);
    }
    let bytes;
    try {
      bytes = fs.readFileSync(path.join(directory, "files", file.path));
    } catch {
      throw corrupt(name, `${file.path} is missing from the snapshot copy`);
    }
    if (sha256Hex(bytes) !== file.hash || bytes.length !== file.bytes) {
      throw corrupt(name, `${file.path} no longer matches its manifest hash`);
    }
    files.set(file.path, bytes);
  }
  return { baseline: { kind: "snapshot", name, hash: sha256Hex(raw) }, files };
}
