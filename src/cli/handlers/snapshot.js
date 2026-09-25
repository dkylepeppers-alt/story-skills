import fs from "node:fs";
import path from "node:path";
import { isTruthy } from "../../options.js";
import { createSnapshot } from "../../changes/snapshot.js";
import { envelope, failure, finding, present } from "../result.js";

const COMMAND = "snapshot";

/** A BaselineError or StorageError as a result envelope with its exit code. */
export function baselineFailure(command, error) {
  const diagnostics = [finding({
    code: error.code,
    message: error.message,
    action: ACTIONS[error.code] ?? "Fix the reported problem and run the command again."
  })];
  return {
    envelope: envelope({ command, ok: false, diagnostics }),
    exitCode: error.exitCode ?? 1,
    text: `${error.message}\n`
  };
}

const ACTIONS = {
  SNAPSHOT_EXISTS: "Snapshots are immutable; choose a new name.",
  SNAPSHOT_NAME_INVALID: "Use letters, digits, dot, underscore and hyphen, starting with a letter or digit.",
  SNAPSHOT_CORRUPT: "Restore the snapshot from a backup or take a new snapshot under another name.",
  BASELINE_NOT_FOUND: "Take one with story snapshot <name>, or name an existing Git branch, tag or commit.",
  BASELINE_AMBIGUOUS: "Prefix the name with snapshot: or git:.",
  BASELINE_INVALID: "Pass --since git:<ref> or --since snapshot:<name>.",
  REF_AMBIGUOUS: "Name the ref in full, such as refs/heads/<name> or refs/tags/<name>.",
  NOT_A_GIT_REPOSITORY: "Use a snapshot baseline, or run the command inside a Git working tree.",
  GIT_FAILED: "Check the repository with git fsck, then run the command again."
};

/**
 * `story snapshot <name> [--dry-run]`: an explicit, immutable copy of the
 * project's files under .story/revisions/<name>/ for later `changes --since`
 * or `compare --ref` baselines.
 */
export function snapshotCommand(ctx) {
  return present(ctx, snapshotResult(ctx.root(), ctx.parsed.positionals[1], isTruthy(ctx.parsed.options["dry-run"])));
}

function snapshotResult(root, name, dryRun) {
  if (!fs.existsSync(path.join(root, "story.md"))) {
    return failure(COMMAND, `No story project at ${root}: missing story.md`, "PROJECT_NOT_FOUND", 2);
  }
  let result;
  try {
    result = createSnapshot(root, name, { dryRun });
  } catch (error) {
    return baselineFailure(COMMAND, error);
  }
  const { snapshot } = result;
  const verb = dryRun ? "Would write snapshot" : "Snapshot";
  return {
    envelope: envelope({
      command: COMMAND,
      ok: true,
      data: { snapshot, dryRun: result.dryRun },
      writes: result.writes.map((write) => ({ ...write, expectedHash: null }))
    }),
    exitCode: 0,
    text: `${verb} ${snapshot.name}: ${snapshot.files} files, ${snapshot.bytes} bytes, hash ${snapshot.hash.slice(0, 12)} (${snapshot.path})\n`
  };
}
