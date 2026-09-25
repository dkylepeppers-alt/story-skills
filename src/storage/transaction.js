import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { StorageError } from "../contracts.js";
import { sha256Hex } from "./hash.js";
import { assertWritableTarget, resolveWithinRoot } from "./paths.js";

const ACTIONS = new Set(["create", "replace", "remove"]);

/**
 * Applies a validated write set to the project atomically enough for
 * multi-file edits: writes are staged on the destination filesystem under
 * `.story/transactions/<id>/` together with a journal and preimage copies of
 * the original files, then moved into place with per-file atomic rename. A
 * successful transaction removes its staged preimages; an interrupted one
 * leaves the journal behind for `story repair` (recovery is completed by the
 * transaction-recovery task).
 *
 * Ordering: the write set is fully validated (paths, hashes, absence) before
 * anything is staged, expected hashes are revalidated under the `.story` lock,
 * and each target's hash is rechecked immediately before its rename. If a
 * revalidation fails mid-set, already-applied files are restored from their
 * staged preimages only if they still match the transaction output. A later
 * external edit is preserved and reported as ROLLBACK_CONFLICT.
 *
 * The lock only excludes other toolkit writers: an advisory lock cannot lock
 * out uncooperative external processes, which is why hashes are revalidated
 * immediately before replacement rather than trusting the lock alone.
 *
 * With `options.dryRun` the transaction validates the full set — including
 * hash freshness — and returns the projected result without staging,
 * journaling, or writing anything.
 */
export async function writeTransaction(root, writes, options = {}) {
  return writeTransactionSync(root, writes, options);
}

export function writeTransactionSync(root, writes, options = {}) {
  if (!Array.isArray(writes) || writes.length === 0) {
    throw new StorageError("INVALID_WRITE", "A transaction needs a non-empty array of writes");
  }

  root = fs.realpathSync(root);
  const plan = writes.map((write) => normalizeWrite(write));
  const seen = new Set();
  for (const write of plan) {
    write.target = resolveWithinRoot(root, write.path);
    write.path = path.relative(root, write.target);
    if (write.path === ".story/lock" || write.path === ".story/transactions" || write.path.startsWith(`.story${path.sep}transactions${path.sep}`)) {
      throw new StorageError("INVALID_WRITE", "Transaction control paths cannot appear in a write set");
    }
    if (seen.has(write.path)) {
      throw new StorageError(
        "INVALID_WRITE",
        `A write set has one write per path; ${write.path} appears more than once`
      );
    }
    seen.add(write.path);
    assertSafeTarget(root, write.target);
  }
  for (const write of plan) {
    validatePrecondition(write, { baseline: true });
  }

  if (options.dryRun === true) {
    return {
      ok: true,
      diagnostics: [],
      writes: plan.map(summarizeWrite),
      dryRun: true
    };
  }

  // Validate internal storage too: otherwise a .story symlink redirects lock
  // creation, preimage staging and recursive cleanup outside this project.
  for (const relative of [".story/lock", ".story/transactions"]) {
    assertSafeTarget(root, resolveWithinRoot(root, relative));
  }
  const lock = acquireLock(root);
  try {
    for (const write of plan) {
      assertSafeTarget(root, write.target);
      validatePrecondition(write, { baseline: true });
    }

    const transactionId = `${Date.now().toString(36)}-${randomUUID()}`;
    const transactionDir = path.join(root, ".story", "transactions", transactionId);
    const journal = stageTransaction(root, transactionDir, transactionId, plan);

    const applied = [];
    try {
      for (const write of plan) {
        assertSafeTarget(root, write.target);
        validatePrecondition(write);
        applyWrite(write);
        applied.push(write);
        journal.writes[applied.length - 1].applied = true;
        fs.writeFileSync(path.join(transactionDir, "journal.json"), JSON.stringify(journal, null, 2));
      }
    } catch (error) {
      const conflicts = rollbackApplied(root, applied);
      let failure = error;
      if (conflicts.length > 0) {
        failure = new StorageError("ROLLBACK_CONFLICT", `Transaction ${transactionId} could not be fully rolled back; external edits were preserved. Inspect its journal before repair.`, {
          transactionId, cause: error.code ?? "OPERATION_FAILED", conflicts
        });
      } else if (!(error instanceof StorageError)) {
        failure = new StorageError("OPERATION_FAILED", `Transaction ${transactionId} failed: ${error.message}`);
      }
      throw failure;
    }

    try {
      fs.rmSync(transactionDir, { recursive: true, force: true });
    } catch (error) {
      // The write set applied; a failed preimage cleanup is recoverable through
      // the journal, so surface it as a diagnostic rather than a raw error.
      throw toStorageIoError(error, transactionDir, "cleaning preimages in");
    }
    return {
      ok: true,
      diagnostics: lock.diagnostics,
      writes: plan.map(summarizeWrite),
      transactionId,
      dryRun: false
    };
  } finally {
    releaseLock(lock);
  }
}

// Filesystem permission and IO failures are converted to StorageError
// diagnostics so callers matching on `code` always see a stable shape. The
// operating system's error code stays visible in the message and in
// `details.fsCode`; EACCES/EPERM get the actionable ACCESS_DENIED code.
function toStorageIoError(error, targetPath, operation) {
  if (error instanceof StorageError) {
    return error;
  }
  const fsCode = typeof error.code === "string" ? error.code : "UNKNOWN";
  const code = fsCode === "EACCES" || fsCode === "EPERM" ? "ACCESS_DENIED" : "OPERATION_FAILED";
  return new StorageError(
    code,
    `${fsCode} while ${operation} ${targetPath}: ${error.message}. Check file and directory permissions.`,
    { fsCode, target: targetPath, operation }
  );
}

function normalizeWrite(write) {
  if (write === null || typeof write !== "object" || Array.isArray(write)) {
    throw new StorageError("INVALID_WRITE", "Each write must be an object with path, action and expectedHash");
  }
  const { path: relativePath, action, expectedHash, content } = write;
  if (typeof relativePath !== "string" || relativePath === "") {
    throw new StorageError("INVALID_WRITE", "Each write needs a project-relative path");
  }
  if (!ACTIONS.has(action)) {
    throw new StorageError("INVALID_WRITE", `Write action must be create, replace or remove, got: ${action}`);
  }
  if (action === "create" && expectedHash !== null) {
    throw new StorageError(
      "INVALID_WRITE",
      "A create asserts absence: expectedHash must be null, never a hash or undefined"
    );
  }
  if ((action === "replace" || action === "remove") && !/^[0-9a-f]{64}$/.test(expectedHash ?? "")) {
    throw new StorageError(
      "INVALID_WRITE",
      `A ${action} validates the current bytes: expectedHash must be a SHA-256 hex digest, not ${JSON.stringify(expectedHash) ?? "undefined"}. expectedHash: null asserts absence and never means skip validation.`
    );
  }
  if (action !== "remove" && content === undefined) {
    throw new StorageError("INVALID_WRITE", `A ${action} needs content to stage`);
  }
  return {
    path: relativePath,
    action,
    expectedHash,
    content: content === undefined || action === "remove" ? null : Buffer.from(content)
  };
}

function validatePrecondition(write, { baseline = false } = {}) {
  if (write.action === "create") {
    if (fs.existsSync(write.target)) {
      throw new StorageError(
        "STALE_SOURCE",
        `Create asserts absence but the file already exists: ${write.path}`
      );
    }
    const parent = path.dirname(write.target);
    let parentStat;
    try {
      parentStat = fs.statSync(parent);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new StorageError(
          "MISSING_PATH",
          `Create target directory is missing: ${path.dirname(write.path)}`,
          { directory: parent }
        );
      }
      throw toStorageIoError(error, write.path, "checking the create target directory");
    }
    if (!parentStat.isDirectory()) {
      throw new StorageError(
        "MISSING_PATH",
        `Create target directory is missing: ${path.dirname(write.path)}`,
        { directory: parent }
      );
    }
    if (baseline) {
      write.validatedHash = null;
    }
    return;
  }

  let stat;
  try {
    stat = fs.statSync(write.target);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new StorageError("MISSING_FILE", `Target file is missing: ${write.path}`);
    }
    throw toStorageIoError(error, write.path, `validating the ${write.action} target`);
  }
  if (!stat.isFile()) {
    throw new StorageError("MISSING_FILE", `Target file is missing: ${write.path}`);
  }
  let current;
  try {
    current = sha256Hex(fs.readFileSync(write.target));
  } catch (error) {
    throw toStorageIoError(error, write.path, `reading the ${write.action} target`);
  }
  if (baseline) {
    if (current !== write.expectedHash) {
      throw new StorageError(
        "STALE_SOURCE",
        `Expected hash mismatch for ${write.path}: the file changed since the write set was planned`,
        { expected: write.expectedHash, actual: current }
      );
    }
    write.validatedHash = current;
    return;
  }
  // Immediately before replacement: the file must be unchanged since the
  // baseline validation. The transaction's own earlier writes have not touched
  // this path (one write per path), so any difference is a concurrent edit.
  if (current !== write.validatedHash) {
    throw new StorageError(
      "STALE_SOURCE",
      `File changed while the transaction ran: ${write.path}`,
      { expected: write.validatedHash, actual: current }
    );
  }
}

function assertSafeTarget(root, target) {
  assertWritableTarget(root, target);
  let current = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new StorageError("SYMLINK_TARGET", `Transaction paths must not contain symlinks: ${path.relative(root, current)}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw toStorageIoError(error, current, "validating path components in");
    }
  }
}

function acquireLock(root) {
  const lockPath = path.join(root, ".story", "lock");
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  let handle;
  try {
    handle = fs.openSync(lockPath, "wx");
  } catch (error) {
    if (error.code === "EEXIST") {
      // Age does not establish abandonment: a slow live writer still owns its
      // lock. Recovery must inspect the owner/journal, never steal by timeout.
      throw new StorageError("LOCKED", "Another writer or interrupted transaction holds .story/lock. Inspect the owner and transaction journals before removing an abandoned lock.");
    }
    throw toStorageIoError(error, lockPath, "acquiring the project lock");
  }
  const token = randomUUID();
  try {
    fs.writeFileSync(handle, JSON.stringify({ token, pid: process.pid, acquiredAt: Date.now() }));
  } finally {
    fs.closeSync(handle);
  }
  return { lockPath, token, diagnostics: [] };
}

function releaseLock(lock) {
  try {
    if (!fs.lstatSync(lock.lockPath).isFile()) return;
    const current = JSON.parse(fs.readFileSync(lock.lockPath, "utf8"));
    if (current.token === lock.token) fs.unlinkSync(lock.lockPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw toStorageIoError(error, lock.lockPath, "releasing the project lock");
  }
}

function stageTransaction(root, transactionDir, transactionId, plan) {
  try {
    fs.mkdirSync(transactionDir, { recursive: true });
    fs.mkdirSync(path.join(transactionDir, "preimages"), { recursive: true });
    fs.mkdirSync(path.join(transactionDir, "contents"), { recursive: true });

    const journal = { id: transactionId, createdAt: new Date().toISOString(), root, writes: [] };
    for (const [index, write] of plan.entries()) {
      const entry = { path: write.path, action: write.action, expectedHash: write.expectedHash, resultHash: write.content === null ? null : sha256Hex(write.content), applied: false };
      if (write.action !== "create" && fs.existsSync(write.target)) {
        write.preimage = path.join(transactionDir, "preimages", String(index));
        entry.preimage = `preimages/${index}`;
        try {
          fs.copyFileSync(write.target, write.preimage);
        } catch (error) {
          throw toStorageIoError(error, write.path, "staging the preimage for");
        }
      }
      if (write.content !== null) {
        write.staged = path.join(transactionDir, "contents", String(index));
        entry.content = `contents/${index}`;
        try {
          fs.writeFileSync(write.staged, write.content);
        } catch (error) {
          throw toStorageIoError(error, write.path, "staging content for");
        }
      }
      journal.writes.push(entry);
    }
    fs.writeFileSync(path.join(transactionDir, "journal.json"), JSON.stringify(journal, null, 2));
    return journal;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw toStorageIoError(error, transactionDir, "staging the transaction in");
  }
}

function applyWrite(write) {
  try {
    if (write.action === "remove") {
      fs.unlinkSync(write.target);
      return;
    }
    fs.renameSync(write.staged, write.target);
  } catch (error) {
    throw toStorageIoError(error, write.path, `applying the ${write.action} to`);
  }
}

function rollbackApplied(root, applied) {
  const conflicts = [];
  for (const write of [...applied].reverse()) {
    try {
      assertSafeTarget(root, write.target);
      if (write.action === "remove") {
        if (fs.existsSync(write.target)) throw new Error("Removed target was recreated externally");
      } else {
        const current = sha256Hex(fs.readFileSync(write.target));
        if (current !== sha256Hex(write.content)) throw new Error("Applied target changed externally");
      }
      if (write.preimage) {
        // Restore with rename, retaining the original preimage for recovery.
        const stagedRestore = `${write.preimage}.restore`;
        fs.copyFileSync(write.preimage, stagedRestore);
        fs.renameSync(stagedRestore, write.target);
      } else if (write.action === "create") {
        fs.unlinkSync(write.target);
      }
    } catch (error) {
      conflicts.push({ path: write.path, message: error.message });
    }
  }
  return conflicts;
}

function summarizeWrite(write) {
  return { path: write.path, action: write.action };
}
