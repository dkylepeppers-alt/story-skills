import fs from "node:fs";
import path from "node:path";

/**
 * Walks upward from `start` until it finds a directory containing `story.md`.
 * An explicit `--project` or positional path must not call this: discovery is
 * only the default when the caller did not name a project.
 */
export function discoverProject(start) {
  if (typeof start !== "string" || start.trim() === "") return null;
  let current = path.resolve(start);
  const filesystemRoot = path.parse(current).root;
  while (current !== filesystemRoot) {
    if (hasStory(current)) return current;
    current = path.dirname(current);
  }
  return hasStory(current) ? current : null;
}

function hasStory(directory) {
  try {
    return fs.statSync(path.join(directory, "story.md")).isFile();
  } catch {
    // Missing or unreadable. Keep walking; the caller reports a miss.
    return false;
  }
}
