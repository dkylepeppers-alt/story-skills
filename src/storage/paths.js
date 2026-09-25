import fs from "node:fs";
import path from "node:path";
import { StorageError } from "../contracts.js";

/**
 * Resolves a project-relative path to an absolute path inside the project
 * root. Absolute paths, empty paths, and traversal (`..`) are rejected with
 * PATH_ESCAPE.
 */
export function resolveWithinRoot(root, relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new StorageError("INVALID_PATH", "A non-empty project-relative path is required");
  }
  if (path.isAbsolute(relativePath)) {
    throw new StorageError("PATH_ESCAPE", `Absolute paths are not project-relative: ${relativePath}`);
  }
  const resolved = path.resolve(root, relativePath);
  const rel = path.relative(root, resolved);
  if (rel === "" || rel.split(path.sep).includes("..")) {
    throw new StorageError("PATH_ESCAPE", `Path escapes the project root: ${relativePath}`);
  }
  return resolved;
}

/**
 * Validates a write target. Symlinks inside the project must not point
 * outside it (SYMLINK_ESCAPE), and a target whose name differs only by case
 * from an existing sibling is reported as CASE_COLLISION rather than silently
 * creating an ambiguous file.
 */
export function assertWritableTarget(root, absPath) {
  const rootReal = fs.realpathSync(root);
  let probe = absPath;
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe);
    if (parent === probe) {
      break;
    }
    probe = parent;
  }
  const real = fs.realpathSync(probe);
  if (real !== rootReal && !real.startsWith(rootReal + path.sep)) {
    throw new StorageError(
      "SYMLINK_ESCAPE",
      `Write target resolves outside the project root through a symlink: ${path.relative(root, absPath)}`
    );
  }

  const collision = findCaseCollision(rootReal, absPath);
  if (collision) {
    throw new StorageError(
      "CASE_COLLISION",
      `Path collides with an existing entry that differs only by case: ${path.relative(root, collision)}`,
      { collision: path.relative(root, collision) }
    );
  }
}

// Walks the target's components and reports an existing sibling whose name
// matches case-insensitively but not exactly, at any level of the path.
function findCaseCollision(rootReal, absPath) {
  const parts = path.relative(rootReal, absPath).split(path.sep);
  let current = rootReal;
  for (const [index, part] of parts.entries()) {
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch {
      return null;
    }
    const wanted = part.toLowerCase();
    const collision = entries.find((entry) => entry.toLowerCase() === wanted && entry !== part);
    if (collision) {
      return path.join(current, collision);
    }
    current = path.join(current, part);
    if (index < parts.length - 1 && !fs.existsSync(current)) {
      return null;
    }
  }
  return null;
}
