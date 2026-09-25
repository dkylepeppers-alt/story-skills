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
  while (true) {
    const candidate = path.join(current, "story.md");
    try {
      if (fs.statSync(candidate).isFile()) return current;
    } catch {
      // Missing or unreadable. Keep walking; the caller reports a miss.
    }
    if (current === filesystemRoot) return null;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
