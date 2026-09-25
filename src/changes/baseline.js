import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  BaselineError, compareText, isComparablePath, isSnapshotName, projectFiles, readSnapshot, snapshotExists
} from "./snapshot.js";

export { BaselineError };

// A ref may name a branch, tag or commit with ~ and ^ suffixes, but never
// starts with "-", so it cannot be read as a Git option, and never contains
// "..", so it cannot be read as a range.
export const GIT_REF_PATTERN = /^[A-Za-z0-9._/@{}~^][A-Za-z0-9._/@{}~^-]*$/;

export function isGitRef(ref) {
  return typeof ref === "string" && GIT_REF_PATTERN.test(ref) && !ref.includes("..");
}

// Git runs read-only: no index refresh (GIT_OPTIONAL_LOCKS=0), no prompts, a
// stable locale for message matching, and no inherited repository overrides.
function gitEnv() {
  const env = { ...process.env, LC_ALL: "C", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_NAMESPACE", "GIT_COMMON_DIR"]) delete env[key];
  return env;
}

function run(root, args, input) {
  const result = spawnSync("git", args, {
    cwd: root,
    env: gitEnv(),
    input,
    maxBuffer: 1024 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (result.error) {
    throw new BaselineError("GIT_FAILED", `Could not run git ${args[0]}: ${result.error.message}`, 4);
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr.toString("utf8") };
}

function must(root, args, input) {
  const result = run(root, args, input);
  if (result.status !== 0) {
    throw new BaselineError("GIT_FAILED", `git ${args[0]} failed: ${result.stderr.trim() || `exit ${result.status}`}`, 4);
  }
  return result.stdout;
}

function repositoryPrefix(root) {
  const result = run(root, ["rev-parse", "--show-prefix"]);
  if (result.status !== 0) {
    throw new BaselineError("NOT_A_GIT_REPOSITORY", `${root} is not inside a Git repository, so it has no Git baselines; use a snapshot`, 2);
  }
  return result.stdout.toString("utf8").trim();
}

function exactRefs(root, ref) {
  const candidates = ["refs/heads/", "refs/tags/", "refs/remotes/"].map((space) => `${space}${ref}`);
  const listed = must(root, ["for-each-ref", "--format=%(refname)", ...candidates]).toString("utf8").split("\n");
  return listed.filter((name) => candidates.includes(name)).map((name) => name.slice("refs/".length));
}

/**
 * Resolves a ref to the immutable commit it names now. An ambiguous name (a
 * branch and a tag, or a short hash with several matches) is refused with
 * the full ref names to choose from, never silently resolved by Git's
 * precedence rules.
 */
export function resolveGitCommit(root, ref) {
  repositoryPrefix(root);
  const result = run(root, ["-c", "core.warnAmbiguousRefs=true", "rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]);
  if (/refname '.*' is ambiguous|short object ID .* is ambiguous/.test(result.stderr)) {
    const names = exactRefs(root, ref);
    const choices = names.length > 0 ? `: ${names.join(", ")}. Name one in full, such as refs/${names[0]}` : "; give more of the commit hash";
    throw new BaselineError("REF_AMBIGUOUS", `Git ref ${ref} is ambiguous${choices}`, 2);
  }
  if (result.status !== 0) {
    throw new BaselineError("BASELINE_NOT_FOUND", `No Git commit named ${ref}`, 2);
  }
  return result.stdout.toString("utf8").trim();
}

function withoutPrefix(prefix, file) {
  return file.startsWith(prefix) ? file.slice(prefix.length) : null;
}

/** Reads every regular file of the project directory at `commit` from Git's object store. */
function filesAtCommit(root, prefix, commit) {
  const listing = must(root, ["ls-tree", "-r", "-z", "--full-name", commit, "--", "."]).toString("utf8").split("\0");
  const entries = [];
  for (const line of listing) {
    const match = /^(\d+) blob ([0-9a-f]+)\t(.*)$/s.exec(line);
    if (!match || match[1] === "120000") continue;
    const file = withoutPrefix(prefix, match[3]);
    if (file !== null && isComparablePath(file)) entries.push({ file, oid: match[2] });
  }
  const files = new Map();
  if (entries.length === 0) return files;
  const output = must(root, ["cat-file", "--batch"], `${entries.map((entry) => entry.oid).join("\n")}\n`);
  let offset = 0;
  for (const entry of entries) {
    const headerEnd = output.indexOf(0x0a, offset);
    const header = output.subarray(offset, headerEnd).toString("utf8").split(" ");
    if (header[1] !== "blob") {
      throw new BaselineError("GIT_FAILED", `git cat-file could not read ${entry.file} at ${commit.slice(0, 12)}: ${header.slice(1).join(" ")}`, 4);
    }
    const size = Number(header[2]);
    files.set(entry.file, Buffer.from(output.subarray(headerEnd + 1, headerEnd + 1 + size)));
    offset = headerEnd + 1 + size + 1;
  }
  return new Map([...files].sort(([left], [right]) => compareText(left, right)));
}

/** The working files Git would see: tracked plus untracked, not ignored, still present. */
function workingFiles(root, prefix) {
  const listing = must(root, ["ls-files", "-z", "-c", "-o", "--exclude-standard", "--full-name", "--", "."]).toString("utf8").split("\0");
  const files = new Map();
  for (const name of listing) {
    const file = name === "" ? null : withoutPrefix(prefix, name);
    if (file === null || !isComparablePath(file) || files.has(file)) continue;
    const absolute = path.join(root, file);
    let stat;
    try {
      stat = fs.lstatSync(absolute);
    } catch {
      continue;
    }
    if (stat.isFile()) files.set(file, fs.readFileSync(absolute));
  }
  return new Map([...files].sort(([left], [right]) => compareText(left, right)));
}

function gitBaseline(root, ref, commit = resolveGitCommit(root, ref)) {
  const prefix = repositoryPrefix(root);
  return {
    baseline: { kind: "git", ref, commit },
    files: filesAtCommit(root, prefix, commit),
    current: workingFiles(root, prefix)
  };
}

function snapshotBaseline(root, name) {
  const { baseline, files } = readSnapshot(root, name);
  return { baseline, files, current: projectFiles(root) };
}

function invalid(since) {
  return new BaselineError(
    "BASELINE_INVALID",
    `Unsupported baseline ${JSON.stringify(since)}: name a Git ref (git:<ref>) or an explicit snapshot (snapshot:<name>)`,
    2
  );
}

/**
 * Resolves `--since` to baseline bytes without changing the working tree,
 * the index or any ref. `git:<ref>` and `snapshot:<name>` are explicit; a
 * bare name must match exactly one of a snapshot and a Git commit. Returns
 * the stored resolution (a Git ref with its commit, or a snapshot with its
 * manifest hash), the baseline files and the current files, each a Map of
 * project-relative POSIX path to bytes.
 */
export function resolveBaseline(root, since) {
  if (typeof since !== "string") throw invalid(since);
  if (since.startsWith("snapshot:")) {
    const name = since.slice("snapshot:".length);
    if (!isSnapshotName(name)) throw invalid(since);
    return snapshotBaseline(root, name);
  }
  if (since.startsWith("git:")) {
    const ref = since.slice("git:".length);
    if (!isGitRef(ref)) throw invalid(since);
    return gitBaseline(root, ref);
  }
  const snapshot = snapshotExists(root, since);
  if (!isGitRef(since)) {
    if (snapshot) return snapshotBaseline(root, since);
    throw invalid(since);
  }
  let commit = null;
  try {
    commit = resolveGitCommit(root, since);
  } catch (error) {
    if (error.code !== "BASELINE_NOT_FOUND" && error.code !== "NOT_A_GIT_REPOSITORY") throw error;
  }
  if (snapshot && commit) {
    throw new BaselineError(
      "BASELINE_AMBIGUOUS",
      `${since} names both a snapshot and Git commit ${commit.slice(0, 12)}; use snapshot:${since} or git:${since}`,
      2
    );
  }
  if (snapshot) return snapshotBaseline(root, since);
  if (commit) return gitBaseline(root, since, commit);
  throw new BaselineError("BASELINE_NOT_FOUND", `No snapshot or Git commit named ${since}`, 2);
}
