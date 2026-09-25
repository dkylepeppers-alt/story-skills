import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { compareChapters, formatComparison, proseParagraphs } from "../src/compare.js";
import { compareProject, createStoryProject } from "../src/story.js";
import { makeTempDir, memoryIo, writeMarkdown } from "./helpers.js";

function git(cwd, ...args) {
  return execFileSync("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", "-c", "init.defaultBranch=main", ...args], { cwd, encoding: "utf8" });
}

function writeChapter(root, number, body, title = `Chapter ${number}`) {
  writeMarkdown(path.join(root, "chapters", `chapter-0${number}.md`), `title: ${title}\nnumber: ${number}\nstatus: draft`, `## Chapter Text\n\n${body}\n`);
}

function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

// A repository holding the project in book/, with draft-1 tagged before the
// revision below.
function gitProject({ subdir = "book" } = {}) {
  const repo = makeTempDir();
  const root = subdir ? path.join(repo, subdir) : repo;
  createStoryProject({ cwd: repo, title: "Compare Story", dir: root, force: Boolean(!subdir) });
  writeChapter(root, 1, "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.");
  writeChapter(root, 2, "Cut me.");
  fs.writeFileSync(path.join(root, "chapters", "chapter-03.md"), "Old prose with no frontmatter.\n", "utf8");
  git(repo, "init", "-q");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "draft one");
  git(repo, "tag", "draft-1");

  writeChapter(root, 1, "First paragraph.\n\nSecond paragraph, revised and longer.\n\nThird paragraph.", "Chapter One");
  fs.rmSync(path.join(root, "chapters", "chapter-02.md"));
  writeChapter(root, 3, "Old prose with no frontmatter.");
  writeChapter(root, 4, "A new ending.");
  return { repo, root };
}

describe("story compare", () => {
  test("compares with a git ref when the project is in a subdirectory", () => {
    const { root, repo } = gitProject();
    const commit = git(repo, "rev-parse", "draft-1^{commit}").trim();
    const result = compareProject(root, { ref: "draft-1" });

    expect(result.label).toBe(`git ref draft-1 (commit ${commit.slice(0, 12)})`);
    expect(result.baseline).toEqual({ kind: "git", ref: "draft-1", commit });
    expect(result.beforeChapters).toBe(3);
    expect(result.afterChapters).toBe(3);
    expect(result.chapters.map((chapter) => [chapter.id, chapter.status])).toEqual([
      ["chapter-01", "changed"],
      ["chapter-02", "removed"],
      ["chapter-03", "unchanged"],
      ["chapter-04", "added"]
    ]);
    expect(result.chapters[0]).toMatchObject({ title: "Chapter One", before: 6, after: 9 });
    expect(result.chapters[0].unchanged).toBeCloseTo(2 / 3);
    expect(result.chapters[2].title).toBe("Chapter 3");
  });

  test("compares with a git ref when the project is the repository root", () => {
    const { root } = gitProject({ subdir: "" });
    expect(compareProject(root, { ref: "HEAD" }).chapters.find((chapter) => chapter.id === "chapter-04").status).toBe("added");
  });

  test("compares with an explicit snapshot, with or without Git", () => {
    const parent = makeTempDir();
    const root = path.join(parent, "book");
    createStoryProject({ cwd: parent, title: "Snapshot Story", dir: root, force: false });
    writeChapter(root, 1, "First paragraph.\n\nSecond paragraph.");
    writeChapter(root, 4, "A new ending.");
    expect(invoke(root, ["snapshot", "draft-1"]).code).toBe(0);
    writeChapter(root, 4, "A different ending entirely.");

    const result = invoke(parent, ["compare", "--path", root, "--ref", "snapshot:draft-1"]);
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/^Compared with snapshot draft-1 \(hash [0-9a-f]{12}\)\n/);
    expect(result.out).toContain("- chapter-04 Chapter 4: 3 -> 4 words (+1), 0% of paragraphs unchanged");
    expect(result.out).toContain("- chapter-01 Chapter 1: unchanged (4 words)");
    expect(compareProject(root, { ref: "draft-1" }).baseline.kind).toBe("snapshot");
  });

  test("--against is no longer an option: folder copies are not immutable baselines", () => {
    const { root } = gitProject();
    const result = invoke(root, ["compare", "--against", "copy"]);
    expect(result.code).toBe(2);
    expect(result.err).toContain("Unknown option --against");
  });

  test("the CLI prints the git comparison", () => {
    const { root, repo } = gitProject();
    const result = invoke(repo, ["compare", root, "--ref", "draft-1"]);

    expect(result.code).toBe(0);
    expect(result.out).toContain("Chapters: 3 then, 3 now (1 added, 1 removed)");
    expect(result.out).toContain("- chapter-01 Chapter One: 6 -> 9 words (+3), 67% of paragraphs unchanged");
    expect(result.out).toContain("- chapter-02 Chapter 2: removed (was 2 words)");
    expect(result.out).toContain("- chapter-04 Chapter 4: added (3 words)");
    expect(result.err).toContain("Comparison complete: 0 errors");
  });

  test("rejects a missing ref, bad refs, ambiguous refs, non-repositories and corrupt snapshots", () => {
    const { root, repo } = gitProject();
    expect(() => compareProject(root, {})).toThrow("compare needs --ref <git-ref-or-snapshot>");
    expect(() => compareProject(root, { ref: "--output=x" })).toThrow("Unsupported baseline \"--output=x\"");
    expect(() => compareProject(root, { ref: "no-such-tag" })).toThrow("No snapshot or Git commit named no-such-tag");
    expect(invoke(root, ["compare", "--ref", "no-such-tag"]).code).toBe(2);

    git(repo, "branch", "draft-1");
    const ambiguous = invoke(root, ["compare", "--ref", "draft-1", "--format", "json"]);
    expect(ambiguous.code).toBe(2);
    expect(JSON.parse(ambiguous.out).diagnostics[0].code).toBe("REF_AMBIGUOUS");
    expect(invoke(root, ["compare", "--ref", "refs/tags/draft-1"]).code).toBe(0);

    const plain = makeTempDir();
    createStoryProject({ cwd: plain, title: "Plain", force: false });
    expect(() => compareProject(path.join(plain, "plain"), { ref: "HEAD" })).toThrow("is not inside a Git repository");

    expect(invoke(root, ["snapshot", "kept"]).code).toBe(0);
    fs.writeFileSync(path.join(root, ".story/revisions/kept/files/story.md"), "tampered\n");
    const corrupt = invoke(root, ["compare", "--ref", "snapshot:kept"]);
    expect(corrupt.code).toBe(3);
    expect(corrupt.err).toContain("Snapshot kept is corrupt");
  });
});

describe("compareChapters", () => {
  const chapter = (id, prose, title = id) => ({ id, title, words: prose.split(/\s+/).filter(Boolean).length, paragraphs: proseParagraphs(prose) });

  test("counts repeated paragraphs once each and treats empty chapters as unchanged", () => {
    const result = compareChapters(
      [chapter("chapter-01", "Same.\n\nSame."), chapter("chapter-02", "")],
      [chapter("chapter-01", "Same.\n\nSame.\n\nSame."), chapter("chapter-02", "")]
    );
    expect(result.chapters[0]).toMatchObject({ status: "changed" });
    expect(result.chapters[0].unchanged).toBeCloseTo(2 / 3);
    expect(result.chapters[1]).toMatchObject({ status: "unchanged", unchanged: 1 });
  });

  test("an emptied chapter is fully changed and paragraphs dropped from the end still count as a change", () => {
    const emptied = compareChapters([chapter("chapter-01", "Gone.")], [chapter("chapter-01", "")]);
    expect(emptied.chapters[0]).toMatchObject({ status: "changed", unchanged: 0 });

    const trimmed = compareChapters([chapter("chapter-01", "Keep.\n\nDrop.")], [chapter("chapter-01", "Keep.")]);
    expect(trimmed.chapters[0]).toMatchObject({ status: "changed", unchanged: 1 });
  });

  test("orders chapter ids numerically and formats an empty comparison", () => {
    const result = compareChapters([chapter("chapter-10", "a")], [chapter("chapter-9", "b")]);
    expect(result.chapters.map((entry) => entry.id)).toEqual(["chapter-9", "chapter-10"]);
    expect(formatComparison(compareChapters([], []), "nothing")).toBe("Compared with nothing\nChapters: 0 then, 0 now (0 added, 0 removed)\nWords: 0 then, 0 now (±0)\n\n- No chapters in either version\n");
  });
});
