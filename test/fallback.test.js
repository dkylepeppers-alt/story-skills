import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "..");
const bundle = path.join(repoRoot, "skills", "story-maintenance", "scripts", "story.js");

// The fallback ships inside the story-maintenance skill and must work once
// the skill is installed on its own, without the repository's schemas/.
describe("bundled fallback CLI", () => {
  test("toolkit commands run from a skill installed outside the repository", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "story-fallback-"));
    try {
      const installed = path.join(home, "skills", "story-maintenance", "scripts", "story.js");
      fs.mkdirSync(path.dirname(installed), { recursive: true });
      fs.copyFileSync(bundle, installed);
      const run = (args) => spawnSync("node", [installed, ...args], { cwd: home, encoding: "utf8" });

      const init = run(["init", "--toolkit", "Fallback Story", "--dir", "book", "--format", "json"]);
      expect(init.stderr).not.toContain("ENOENT");
      expect(init.status).toBe(0);

      const add = run(["entity", "add", "character", "Ada Quill", "--project", "book", "--format", "json"]);
      expect(add.status).toBe(0);
      const id = JSON.parse(add.stdout).data.id;
      expect(id).toMatch(/^chr_/);

      const rename = run(["entity", "rename", id, "Ada Byron", "--project", "book", "--format", "json"]);
      expect(rename.status).toBe(0);
      expect(JSON.parse(rename.stdout).data.path).toBe("characters/ada-byron.md");
      expect(fs.existsSync(path.join(home, "book", "characters", "ada-byron.md"))).toBe(true);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});
