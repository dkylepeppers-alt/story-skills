import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, test } from "bun:test";
import { BaselineError, resolveBaseline } from "../src/changes/baseline.js";
import { compareRevision } from "../src/changes/compare.js";
import { createSnapshot, readSnapshot } from "../src/changes/snapshot.js";
import { sha256Hex } from "../src/storage/hash.js";
import { makeKnowledgeFixture, makeProject } from "./support/project.js";

function git(cwd, ...args) {
  return execFileSync("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", "-c", "init.defaultBranch=main", ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

// A repository whose working tree holds the project in book/, so baselines
// are read relative to the project, not the repository root.
async function gitFixture() {
  const p = await makeKnowledgeFixture();
  const repo = p.root;
  const book = path.join(repo, "book");
  fs.mkdirSync(book);
  for (const name of fs.readdirSync(repo)) {
    if (name !== "book") fs.renameSync(path.join(repo, name), path.join(book, name));
  }
  git(repo, "init", "-q");
  fs.writeFileSync(path.join(repo, ".gitignore"), "*.log\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "draft one");
  git(repo, "tag", "v1");
  return { p, repo, book, rel: (file) => path.join(book, file) };
}

function tree(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(`${path.relative(root, abs)} ${sha256Hex(fs.readFileSync(abs))}`);
    }
  };
  walk(root);
  return out;
}

function compare(root, since, options) {
  const baseline = resolveBaseline(root, since);
  return compareRevision(root, baseline, options);
}

const ids = (list) => list.map((item) => item.id);

describe("explicit snapshots", () => {
  test("a snapshot is created only on request, hashed and immutable", async () => {
    const p = await makeKnowledgeFixture();
    p.write("notes.txt", "Loose notes.\n");
    p.write(".story/cache/context/stale.json", "{}\n");
    p.write("dist/book.md", "Built output.\n");
    p.write("node_modules/pkg/index.js", "\n");
    expect(fs.existsSync(path.join(p.root, ".story/revisions"))).toBe(false);

    const dry = createSnapshot(p.root, "draft-1", { dryRun: true });
    expect(dry.dryRun).toBe(true);
    expect(fs.existsSync(path.join(p.root, ".story/revisions"))).toBe(false);

    const result = createSnapshot(p.root, "draft-1");
    expect(result.snapshot).toMatchObject({ name: "draft-1", path: ".story/revisions/draft-1" });
    expect(result.snapshot.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.snapshot.hash).toBe(dry.snapshot.hash);
    const manifest = JSON.parse(p.read(".story/revisions/draft-1/manifest.json"));
    expect(manifest).toMatchObject({ format: "story-toolkit", "schema-version": 1, type: "revision", name: "draft-1" });
    const paths = manifest.files.map((file) => file.path);
    expect(paths).toContain("chapters/one.md");
    expect(paths).toContain("notes.txt");
    expect(paths.some((file) => /^(\.story|dist|node_modules)\//.test(file))).toBe(false);
    const chapter = manifest.files.find((file) => file.path === "chapters/one.md");
    expect(chapter).toEqual({ path: "chapters/one.md", hash: p.hash("chapters/one.md"), bytes: fs.statSync(path.join(p.root, "chapters/one.md")).size });
    expect(p.read(".story/revisions/draft-1/files/chapters/one.md")).toBe(p.read("chapters/one.md"));
    expect(sha256Hex(fs.readFileSync(path.join(p.root, ".story/revisions/draft-1/manifest.json")))).toBe(result.snapshot.hash);

    expect(() => createSnapshot(p.root, "draft-1")).toThrow(expect.objectContaining({ code: "SNAPSHOT_EXISTS", exitCode: 1 }));
    for (const name of ["../escape", "", ".hidden", "a/b", "x".repeat(65)]) {
      expect(() => createSnapshot(p.root, name)).toThrow(expect.objectContaining({ code: "SNAPSHOT_NAME_INVALID", exitCode: 2 }));
    }

    const read = readSnapshot(p.root, "draft-1");
    expect(read.baseline).toEqual({ kind: "snapshot", name: "draft-1", hash: result.snapshot.hash });
    expect(read.files.get("notes.txt").toString()).toBe("Loose notes.\n");
  });

  test("a snapshot that cannot be written leaves its name free", async () => {
    const p = await makeProject();
    p.write(".story/lock", "{}");
    expect(() => createSnapshot(p.root, "draft")).toThrow(expect.objectContaining({ code: "LOCKED" }));
    expect(fs.existsSync(path.join(p.root, ".story/revisions/draft"))).toBe(false);
    fs.rmSync(path.join(p.root, ".story/lock"));
    expect(createSnapshot(p.root, "draft").snapshot.files).toBe(2);
  });

  test("a tampered or missing snapshot copy is reported as corrupt", async () => {
    const p = await makeProject();
    createSnapshot(p.root, "base");
    p.write(".story/revisions/base/files/story.md", "edited\n");
    expect(() => readSnapshot(p.root, "base")).toThrow(expect.objectContaining({ code: "SNAPSHOT_CORRUPT", exitCode: 3 }));
    fs.rmSync(path.join(p.root, ".story/revisions/base/files/story.md"));
    expect(() => readSnapshot(p.root, "base")).toThrow(expect.objectContaining({ code: "SNAPSHOT_CORRUPT" }));
    p.write(".story/revisions/base/manifest.json", "not json");
    expect(() => readSnapshot(p.root, "base")).toThrow(expect.objectContaining({ code: "SNAPSHOT_CORRUPT" }));
    p.write(".story/revisions/named/manifest.json", JSON.stringify({ format: "story-toolkit", "schema-version": 1, type: "revision", name: "other", files: [] }));
    expect(() => readSnapshot(p.root, "named")).toThrow(expect.objectContaining({ code: "SNAPSHOT_CORRUPT" }));
    p.write(".story/revisions/odd/manifest.json", JSON.stringify({ format: "story-toolkit", "schema-version": 1, type: "revision", name: "odd", files: [{ path: "../x", hash: "0".repeat(64), bytes: 0 }] }));
    expect(() => readSnapshot(p.root, "odd")).toThrow(expect.objectContaining({ code: "SNAPSHOT_CORRUPT" }));
    expect(() => readSnapshot(p.root, "absent")).toThrow(expect.objectContaining({ code: "BASELINE_NOT_FOUND", exitCode: 2 }));
  });
});

describe("stable-ID comparison", () => {
  test("an unchanged project reports nothing", async () => {
    const p = await makeKnowledgeFixture();
    createSnapshot(p.root, "same");
    const report = compare(p.root, "same");
    expect(report.baseline).toMatchObject({ kind: "snapshot", name: "same" });
    expect(report.files).toEqual({ added: [], removed: [], changed: [] });
    expect([report.added, report.removed, report.changed, report.moved]).toEqual([[], [], [], []]);
    expect(report.scenes).toEqual({ added: [], removed: [], changed: [], moved: [] });
    expect(report.facts).toEqual({ added: [], removed: [], changed: [] });
    expect(report.sources).toEqual([]);
    expect(report.diagnostics).toEqual([]);
  });

  test("records match by id across renames; add, remove, change and move are independent", async () => {
    const p = await makeKnowledgeFixture();
    await p.addEntity({ id: "chr_bram", type: "character", name: "Bram" });
    createSnapshot(p.root, "before");

    fs.renameSync(path.join(p.root, "characters/chr_ada.md"), path.join(p.root, "characters/ada-quill.md"));
    fs.renameSync(path.join(p.root, "characters/chr_zoe.md"), path.join(p.root, "characters/zoe.md"));
    p.write("characters/zoe.md", p.read("characters/zoe.md").replace("name: Zoë Voss", "name: Zoë Vance"));
    fs.rmSync(path.join(p.root, "characters/chr_bram.md"));
    await p.addEntity({ id: "chr_cato", type: "character", name: "Cato" });

    const report = compare(p.root, "before");
    expect(report.added).toEqual([{ id: "chr_cato", type: "character", path: "characters/chr_cato.md" }]);
    expect(report.removed).toEqual([{ id: "chr_bram", type: "character", path: "characters/chr_bram.md" }]);
    expect(report.moved).toEqual([
      { id: "chr_ada", type: "character", from: "characters/chr_ada.md", to: "characters/ada-quill.md" },
      { id: "chr_zoe", type: "character", from: "characters/chr_zoe.md", to: "characters/zoe.md" }
    ]);
    expect(report.changed).toEqual([{ id: "chr_zoe", type: "character", path: "characters/zoe.md", fields: ["name"], body: false }]);
    expect(report.files.added).toEqual(["characters/ada-quill.md", "characters/chr_cato.md", "characters/zoe.md"]);
    expect(report.files.removed).toEqual(["characters/chr_ada.md", "characters/chr_bram.md", "characters/chr_zoe.md"]);
  });

  test("a scene moved to another chapter with identical bytes is a move, not a rewrite", async () => {
    const p = await makeKnowledgeFixture();
    p.write("chapters/two.md", "---\nformat: story-toolkit\nschema-version: 1\nid: chp_two\ntype: chapter\nname: Two\ntitle: Two\nnumber: 2\n---\n");
    createSnapshot(p.root, "before");

    const chapter = p.read("chapters/one.md");
    const opening = chapter.slice(chapter.indexOf("<!-- story-scene: scn_opening"), chapter.indexOf("<!-- story-scene: scn_cellar"));
    p.write("chapters/one.md", chapter.replace(opening, ""));
    p.write("chapters/two.md", `${p.read("chapters/two.md")}${opening}`);
    p.write("scenes/scn_opening.md", p.read("scenes/scn_opening.md").replace("chapter-id: chp_one", "chapter-id: chp_two"));

    const report = compare(p.root, "before");
    expect(report.scenes.moved).toEqual([{
      id: "scn_opening",
      from: { chapterId: "chp_one", path: "chapters/one.md", position: 0 },
      to: { chapterId: "chp_two", path: "chapters/two.md", position: 1 }
    }]);
    expect(report.scenes.changed).toEqual([]);
    expect(ids(report.changed)).toEqual(["chp_one", "chp_two", "scn_opening"]);
    expect(report.changed.find((item) => item.id === "scn_opening").fields).toEqual(["chapter-id"]);
    // Sources over scn_cellar are unaffected: its bytes did not change.
    expect(report.sources).toEqual([]);
  });

  test("a scene whose marker is removed moves out of the reading order", async () => {
    const p = await makeKnowledgeFixture();
    createSnapshot(p.root, "before");
    const chapter = p.read("chapters/one.md");
    p.write("chapters/one.md", chapter.slice(0, chapter.indexOf("<!-- story-scene: scn_opening")) + chapter.slice(chapter.indexOf("<!-- story-scene: scn_cellar")));
    const report = compare(p.root, "before");
    expect(report.scenes.moved).toEqual([{
      id: "scn_opening",
      from: { chapterId: "chp_one", path: "chapters/one.md", position: 0 },
      to: { chapterId: "chp_one", path: null, position: null }
    }]);
    expect(report.scenes.changed).toEqual([]);
  });

  test("reordering scenes inside a chapter moves only the displaced scene", async () => {
    const p = await makeProject();
    for (const id of ["scn_a", "scn_b", "scn_c"]) await p.addScene({ id, title: id });
    p.write("chapters/one.md", p.read("chapters/one.md")
      .replace("<!-- story-scene: scn_a -->\n", "<!-- story-scene: scn_a -->\nAlpha.\n")
      .replace("<!-- story-scene: scn_b -->\n", "<!-- story-scene: scn_b -->\nBravo.\n")
      .replace("<!-- story-scene: scn_c -->\n", "<!-- story-scene: scn_c -->\nCharlie.\n"));
    createSnapshot(p.root, "before");
    const text = p.read("chapters/one.md");
    const c = "<!-- story-scene: scn_c -->\nCharlie.\n";
    p.write("chapters/one.md", text.replace(c, "").replace("<!-- story-scene: scn_a -->", `${c}<!-- story-scene: scn_a -->`));
    const report = compare(p.root, "before");
    expect(ids(report.scenes.moved)).toEqual(["scn_c"]);
    expect(report.scenes.moved[0]).toMatchObject({ from: { position: 2 }, to: { position: 0 } });
    expect(report.scenes.changed).toEqual([]);
  });

  test("changed prose, added scenes and removed scenes are reported with their source references", async () => {
    const p = await makeKnowledgeFixture();
    createSnapshot(p.root, "before");
    const chapter = p.read("chapters/one.md");
    // Rewrite the arrival beat, delete the opening scene, add a new scene.
    const opening = chapter.slice(chapter.indexOf("<!-- story-scene: scn_opening"), chapter.indexOf("<!-- story-scene: scn_cellar"));
    p.write("chapters/one.md", chapter
      .replace(opening, "")
      .replace("decides the key is lost", "decides the key was stolen"));
    fs.rmSync(path.join(p.root, "scenes/scn_opening.md"));
    p.write("scenes/scn_cellar.md", p.read("scenes/scn_cellar.md").replace(/chronology:\n {2}after:\n {4}- scn_opening\n/, ""));
    await p.addScene({ id: "scn_dawn", title: "Dawn" });
    await p.addFact({ id: "fact_opening_lamp", subject: "chr_ada", predicate: "location", value: "the inn", sources: [{ path: "chapters/one.md", scene: "scn_opening", hash: "0".repeat(64), kind: "manuscript" }] });
    await p.addFact({ id: "fact_beat_gone", subject: "chr_ada", predicate: "mood", value: "calm", sources: [{ path: "chapters/one.md", scene: "scn_cellar", beat: "beat_gone", hash: "0".repeat(64), kind: "manuscript" }] });
    await p.addFact({ id: "fact_folder", subject: "chr_ada", predicate: "age", value: "30", sources: [{ path: "chapters", hash: "0".repeat(64), kind: "manuscript" }] });
    await p.addFact({ id: "fact_lost_file", subject: "chr_ada", predicate: "eyes", value: "grey", sources: [{ path: "notes/gone.md", hash: "0".repeat(64), kind: "research" }] });
    p.write("facts/fact_false_belief.md", p.read("facts/fact_false_belief.md").replace("value: The brass key is lost", "value: The brass key was stolen"));

    const report = compare(p.root, "before");
    expect(report.scenes.removed).toEqual([{ id: "scn_opening", chapterId: "chp_one", path: "chapters/one.md" }]);
    expect(report.scenes.added).toEqual([{ id: "scn_dawn", chapterId: "chp_one", path: "chapters/one.md" }]);
    expect(ids(report.scenes.changed)).toEqual(["scn_cellar"]);
    const cellar = report.scenes.changed[0];
    expect(cellar.from.hash).not.toBe(cellar.to.hash);
    expect(ids(report.removed)).toEqual(["scn_opening"]);

    expect(report.facts.added).toEqual(["fact_beat_gone", "fact_folder", "fact_lost_file", "fact_opening_lamp"]);
    expect(report.facts.changed).toEqual([{ id: "fact_false_belief", fields: ["value"], from: { value: "The brass key is lost" }, to: { value: "The brass key was stolen" } }]);

    const byRecord = Object.fromEntries(report.sources.map((item) => [item.recordId, item]));
    expect(byRecord.fact_false_belief).toMatchObject({ status: "changed", ref: { path: "chapters/one.md", scene: "scn_cellar", beat: "beat_arrival" } });
    expect(byRecord.fact_false_belief.baseline).toBe(byRecord.fact_false_belief.recorded);
    expect(byRecord.fact_false_belief.current).not.toBe(byRecord.fact_false_belief.recorded);
    expect(byRecord.fact_opening_lamp).toMatchObject({ status: "removed", current: null });
    expect(byRecord.fact_key_handoff).toBeUndefined();

    const diagnostics = report.diagnostics.map((item) => `${item.code}:${item.severity}:${item.recordIds.join(",")}`);
    expect(diagnostics).toContain("SOURCE_REMOVED:error:fact_opening_lamp,scn_opening");
    expect(diagnostics).toContain("STALE_EVIDENCE:warning:fact_false_belief");
    const removed = (id) => report.diagnostics.find((item) => item.code === "SOURCE_REMOVED" && item.recordIds[0] === id).message;
    expect(removed("fact_opening_lamp")).toContain("scene scn_opening was removed");
    expect(removed("fact_beat_gone")).toContain("beat beat_gone was removed from scene scn_cellar");
    expect(removed("fact_folder")).toContain("it cannot be read");
    expect(removed("fact_lost_file")).toContain("file notes/gone.md was deleted");
  });

  test("references left dangling by a removal are surfaced", async () => {
    const p = await makeKnowledgeFixture();
    createSnapshot(p.root, "before");
    fs.rmSync(path.join(p.root, "characters/chr_zoe.md"));
    const report = compare(p.root, "before");
    expect(ids(report.removed)).toEqual(["chr_zoe"]);
    const dangling = report.diagnostics.filter((item) => item.code === "DANGLING_REFERENCE");
    expect(dangling.length).toBeGreaterThan(0);
    expect(dangling.every((item) => item.message.includes("chr_zoe"))).toBe(true);
  });

  test("a scope is checked against the baseline and violations carry evidence", async () => {
    const p = await makeKnowledgeFixture();
    createSnapshot(p.root, "before");
    const before = fs.readFileSync(path.join(p.root, "chapters/one.md"));
    const line = Buffer.from("“I took it,” Zoë says.");
    const start = before.indexOf(Buffer.from("I took it"));
    const scope = { format: "story-toolkit", "schema-version": 1, type: "scope", files: [{ path: "chapters/one.md", "baseline-hash": sha256Hex(before), ranges: [{ start, end: start + Buffer.byteLength("I took it") }] }] };
    expect(before.includes(line)).toBe(true);

    p.write("chapters/one.md", before.toString().replace("I took it", "I have it"));
    expect(compare(p.root, "before", { scope }).scope).toMatchObject({ ok: true });

    p.write("chapters/one.md", before.toString().replace("I took it,” Zoë says", "I took it,” Zoë whispers"));
    p.write("notes.md", "An unlisted new file.\n");
    const report = compare(p.root, "before", { scope });
    expect(report.scope.ok).toBe(false);
    const violations = report.diagnostics.filter((item) => item.code === "EDIT_OUT_OF_SCOPE");
    expect(violations.map((item) => item.severity)).toEqual(["error", "error"]);
    expect(violations.map((item) => item.message).join("\n")).toContain("notes.md was added but is not in the scope");
    const evidence = report.scope.files[0].violations[0];
    expect(evidence.before.text).toContain("says");
    expect(evidence.after.text).toContain("whispers");
    // No rewrite is attempted.
    expect(p.read("chapters/one.md")).toContain("whispers");
  });

  test("a deleted file is out of scope unless the scope lets it change freely", async () => {
    const p = await makeProject();
    p.write("notes/aside.md", "Aside.\n");
    createSnapshot(p.root, "before");
    const hash = p.hash("notes/aside.md");
    fs.rmSync(path.join(p.root, "notes/aside.md"));
    const base = { format: "story-toolkit", "schema-version": 1, type: "scope" };
    const locked = compare(p.root, "before", { scope: { ...base, files: [{ path: "notes/aside.md", "baseline-hash": hash, ranges: [{ start: 0, end: 2 }] }] } });
    expect(locked.files.removed).toEqual(["notes/aside.md"]);
    expect(locked.scope.ok).toBe(false);
    expect(locked.diagnostics.map((item) => item.code)).toContain("EDIT_OUT_OF_SCOPE");
    const free = compare(p.root, "before", { scope: { ...base, files: [{ path: "notes/aside.md", "baseline-hash": hash }] } });
    expect(free.scope.ok).toBe(true);
    const stale = compare(p.root, "before", { scope: { ...base, files: [{ path: "notes/aside.md", "baseline-hash": "0".repeat(64) }] } });
    expect(stale.diagnostics.map((item) => item.code)).toContain("SCOPE_BASELINE_MISMATCH");
  });
});

describe("Git baselines", () => {
  test("a Git ref resolves to an immutable commit without touching the working tree or index", async () => {
    const { repo, book, rel } = await gitFixture();
    const commit = git(repo, "rev-parse", "v1^{commit}");
    fs.appendFileSync(rel("chapters/one.md"), "A new closing line.\n");
    fs.rmSync(rel("characters/chr_ada.md"));
    fs.writeFileSync(rel("debug.log"), "ignored\n");
    fs.writeFileSync(rel("draft.md"), "untracked\n");
    const before = tree(repo);

    const baseline = resolveBaseline(book, "v1");
    expect(baseline.baseline).toEqual({ kind: "git", ref: "v1", commit });
    expect(resolveBaseline(book, "git:v1").baseline).toEqual({ kind: "git", ref: "v1", commit });
    expect(resolveBaseline(book, commit.slice(0, 12)).baseline.commit).toBe(commit);
    expect(baseline.files.has("story.md")).toBe(true);
    expect([...baseline.files.keys()].some((file) => file.startsWith("book/"))).toBe(false);

    const report = compareRevision(book, baseline);
    expect(report.baseline.commit).toBe(commit);
    expect(report.files.removed).toEqual(["characters/chr_ada.md"]);
    expect(report.files.added).toEqual(["draft.md"]);
    expect(report.files.changed.map((item) => item.path)).toEqual(["chapters/one.md"]);
    expect(ids(report.removed)).toEqual(["chr_ada"]);
    expect(tree(repo)).toEqual(before);
    expect(fs.existsSync(path.join(book, ".story/revisions"))).toBe(false);

    // The resolution is stored, so moving the tag does not change it.
    git(repo, "commit", "-q", "--allow-empty", "-m", "later");
    git(repo, "tag", "-f", "v1");
    expect(report.baseline.commit).toBe(commit);
  });

  test("ambiguous, unknown and malformed refs are refused", async () => {
    const { repo, book } = await gitFixture();
    git(repo, "branch", "draft");
    git(repo, "tag", "draft");
    expect(() => resolveBaseline(book, "draft")).toThrow(expect.objectContaining({ code: "REF_AMBIGUOUS", exitCode: 2 }));
    expect(() => resolveBaseline(book, "heads/draft")).not.toThrow();
    expect(() => resolveBaseline(book, "nope")).toThrow(expect.objectContaining({ code: "BASELINE_NOT_FOUND", exitCode: 2 }));
    expect(() => resolveBaseline(book, "git:nope")).toThrow(expect.objectContaining({ code: "BASELINE_NOT_FOUND" }));
    for (const bad of ["--output=x", "", "a..b", "snapshot:../x"]) {
      expect(() => resolveBaseline(book, bad)).toThrow(expect.objectContaining({ code: "BASELINE_INVALID", exitCode: 2 }));
    }
    const error = (() => { try { resolveBaseline(book, "draft"); } catch (caught) { return caught; } })();
    expect(error).toBeInstanceOf(BaselineError);
    expect(error.message).toContain("heads/draft");
  });

  test("a name used by both a snapshot and a ref needs a prefix", async () => {
    const { repo, book } = await gitFixture();
    createSnapshot(book, "v1");
    fs.appendFileSync(path.join(book, "chapters/one.md"), "Later.\n");
    expect(() => resolveBaseline(book, "v1")).toThrow(expect.objectContaining({ code: "BASELINE_AMBIGUOUS", exitCode: 2 }));
    expect(resolveBaseline(book, "snapshot:v1").baseline.kind).toBe("snapshot");
    expect(resolveBaseline(book, "git:v1").baseline.commit).toBe(git(repo, "rev-parse", "v1^{commit}"));
    // A snapshot-only name resolves without Git.
    createSnapshot(book, "only-here");
    expect(resolveBaseline(book, "only-here").baseline.kind).toBe("snapshot");
  });

  test("Git that cannot run is an operational failure", async () => {
    const { book } = await gitFixture();
    const saved = process.env.PATH;
    process.env.PATH = path.join(book, "no-such-bin");
    try {
      expect(() => resolveBaseline(book, "git:v1")).toThrow(expect.objectContaining({ code: "GIT_FAILED", exitCode: 4 }));
    } finally {
      process.env.PATH = saved;
    }
  });

  test("a damaged object store is an operational failure", async () => {
    const { repo, book } = await gitFixture();
    const drop = (spec) => {
      const oid = git(repo, "rev-parse", spec);
      fs.rmSync(path.join(repo, ".git/objects", oid.slice(0, 2), oid.slice(2)));
    };
    drop("v1:book/story.md");
    expect(() => resolveBaseline(book, "v1")).toThrow(expect.objectContaining({ code: "GIT_FAILED", exitCode: 4, message: expect.stringContaining("story.md") }));
    drop("v1:book/chapters");
    expect(() => resolveBaseline(book, "v1")).toThrow(expect.objectContaining({ code: "GIT_FAILED", exitCode: 4, message: expect.stringContaining("ls-tree") }));
  });

  test("a project outside Git can only use snapshots", async () => {
    const p = await makeProject();
    expect(() => resolveBaseline(p.root, "main")).toThrow(expect.objectContaining({ code: "BASELINE_NOT_FOUND" }));
    expect(() => resolveBaseline(p.root, "git:main")).toThrow(expect.objectContaining({ code: "NOT_A_GIT_REPOSITORY", exitCode: 2 }));
  });
});
