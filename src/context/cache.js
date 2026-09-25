import fs from "node:fs";
import path from "node:path";
import { SCHEMA_VERSION } from "../contracts.js";
import { sha256Hex } from "../storage/hash.js";
import { assertWritableTarget, resolveWithinRoot } from "../storage/paths.js";
import { buildContext, validateRequest } from "./build.js";

/**
 * Dependency-aware context cache (design §7). The key is a SHA-256 over the
 * cache version, the schema version, the normalized query, and the content
 * hash of every file selection can read: each loaded record (valid or not),
 * each style source named by the project, and each non-record file named by
 * a record's sources or evidence. A record added, removed or edited — selected
 * or not — therefore changes the key, and a changed file can never be answered
 * from an older entry. Entries are derived data in `.story/cache/context/`,
 * written by temp file and rename; a missing, corrupt or foreign entry is a
 * miss, and a cache that cannot be written never fails the request.
 */

export const CACHE_VERSION = 1;
const CACHE_DIRECTORY = path.join(".story", "cache", "context");

const slash = (value) => value.split("\\").join("/");

function fileHash(root, relative) {
  try {
    return sha256Hex(fs.readFileSync(resolveWithinRoot(root, relative)));
  } catch {
    return null;
  }
}

function dependencies(project) {
  const entries = [...project.records.values(), ...(project.unindexed ?? [])];
  const hashes = new Map();
  for (const entry of entries) hashes.set(slash(entry.path), entry.hash);
  const named = new Set();
  for (const entry of project.records.values()) {
    if (entry.type === "project") for (const relative of entry.record["style-sources"] ?? []) named.add(relative);
    for (const field of ["sources", "evidence"]) {
      if (!Array.isArray(entry.record[field])) continue;
      for (const source of entry.record[field]) {
        if (source && typeof source.path === "string") named.add(source.path);
      }
    }
  }
  for (const relative of named) {
    if (!hashes.has(relative)) hashes.set(relative, fileHash(project.root, relative));
  }
  return [...hashes].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
}

function keyFor(project, request, schemaVersion) {
  return sha256Hex(Buffer.from(JSON.stringify({
    cacheVersion: CACHE_VERSION,
    schemaVersion,
    request,
    dependencies: dependencies(project)
  }), "utf8"));
}

/** The cache key for a request, or null when the request is invalid. */
export function cacheKey(project, input, options = {}) {
  const { problems, request } = validateRequest(input);
  if (problems.length > 0) return null;
  return keyFor(project, request, options.schemaVersion ?? SCHEMA_VERSION);
}

function readEntry(file, key, schemaVersion) {
  try {
    const entry = JSON.parse(fs.readFileSync(file, "utf8"));
    if (entry.cacheVersion !== CACHE_VERSION || entry.schemaVersion !== schemaVersion || entry.key !== key) return null;
    if (!entry.packet || typeof entry.packet !== "object") return null;
    return entry.packet;
  } catch {
    return null;
  }
}

// Best-effort cleanup of a partial temp file; when the directory itself could
// not be created there is nothing to remove.
function removeQuietly(file) {
  try { fs.rmSync(file, { force: true }); } catch { /* no temp file to remove */ }
}

function writeEntry(root, file, entry) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    assertWritableTarget(root, file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(temporary, JSON.stringify(entry));
    fs.renameSync(temporary, file);
    return null;
  } catch (error) {
    removeQuietly(temporary);
    return `Context cache not written to ${slash(path.relative(root, file))}: ${error.message}`;
  }
}

/**
 * `buildContext` behind the cache. Returns `{ packet, cache: { hit, key,
 * stored, warning? } }`; the packet is identical to a fresh build.
 */
export function cachedContext(project, input, options = {}) {
  const schemaVersion = options.schemaVersion ?? SCHEMA_VERSION;
  const { problems, request } = validateRequest(input);
  if (problems.length > 0) return { packet: buildContext(project, input), cache: { hit: false, key: null, stored: false } };
  const key = keyFor(project, request, schemaVersion);
  const file = path.join(project.root, CACHE_DIRECTORY, `${key}.json`);
  const cached = readEntry(file, key, schemaVersion);
  if (cached) return { packet: cached, cache: { hit: true, key, stored: true } };
  const packet = buildContext(project, request);
  const warning = writeEntry(project.root, file, { cacheVersion: CACHE_VERSION, schemaVersion, key, packet });
  const cache = { hit: false, key, stored: warning === null };
  if (warning !== null) cache.warning = warning;
  return { packet, cache };
}
