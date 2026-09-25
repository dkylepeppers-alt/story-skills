import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { StorageError } from "../contracts.js";
import { sha256Hex } from "./hash.js";
import { assertWritableTarget, resolveWithinRoot } from "./paths.js";

const DEFAULT_LOCK_STALE_MS = 60_000;
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
 * staged preimages and the transaction rejects with STALE_SOURCE.
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
  if (!Array.isArray(writes) || writes.length === 0) {
    throw new StorageError("INVALID_WRITE", "A transaction needs a non-empty array of writes");
  }

  const plan = writes.map((write) => normalizeWrite(write));
  const seen = new Set();
  for (const write of plan) {
    if (seen.has(write.path)) {
      throw new StorageError(
        "INVALID_WRITE",
        `A write set has one write per path; ${write.path} appears more than once`
      );
    }
    seen.add(write.path);
    write.target = resolveWithinRoot(root, write.path);
    assertWritableTarget(root, write.target);
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

  const lock = acquireLock(root, options);
  try {
    for (const write of plan) {
      validatePrecondition(write, { baseline: true });
    }

    const transactionId = `${Date.now().toString(36)}-${randomUUID()}`;
    const transactionDir = path.join(root, ".story", "transactions", transactionId);
    stageTransaction(root, transactionDir, transactionId, plan);

    const applied = [];
    try {
      for (const write of plan) {
        validatePrecondition(write);
        applyWrite(write);
        applied.push(write);
      }
    } catch (error) {
      rollbackApplied(applied);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError("OPERATION_FAILED", `Transaction ${transactionId} failed: ${error.message}`);
    }

    fs.rmSync(transactionDir, { recursive: true, force: true });
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
    if (!fs.existsSync(parent)) {
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

  if (!fs.existsSync(write.target) || !fs.statSync(write.target).isFile()) {
    throw new StorageError("MISSING_FILE", `Target file is missing: ${write.path}`);
  }
  const current = sha256Hex(fs.readFileSync(write.target));
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

function acquireLock(root, options) {
  const lockPath = path.join(root, ".story", "lock");
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const staleMs = typeof options.lockStaleMs === "number" ? options.lockStaleMs : DEFAULT_LOCK_STALE_MS;
  const diagnostics = [];

  for (let attempt = 0;; attempt += 1) {
    try {
      const handle = fs.openSync(lockPath, "wx");
      fs.writeFileSync(handle, JSON.stringify({ pid: process.pid, acquiredAt: Date.now() }));
      fs.closeSync(handle);
      return { lockPath, diagnostics };
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw new StorageError("LOCK_FAILED", `Could not create the .story lock: ${error.message}`);
      }
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > staleMs && attempt < 2) {
        diagnostics.push({
          code: "LOCK_STALE_BROKEN",
          severity: "warning",
          message: `Broke a stale .story lock left ${Math.round((Date.now() - stat.mtimeMs) / 1000)}s ago by another writer.`,
          recordIds: [],
          sources: [],
          evidence: "structural",
          action: "If writes keep failing, inspect .story/transactions and run story repair."
        });
        fs.rmSync(lockPath, { force: true });
        continue;
      }
      throw new StorageError(
        "LOCKED",
        "Another toolkit writer holds the .story lock; the project is locked while a transaction runs"
      );
    }
  }
}

function releaseLock(lock) {
  fs.rmSync(lock.lockPath, { force: true });
}

function stageTransaction(root, transactionDir, transactionId, plan) {
  fs.mkdirSync(transactionDir, { recursive: true });
  fs.mkdirSync(path.join(transactionDir, "preimages"), { recursive: true });
  fs.mkdirSync(path.join(transactionDir, "contents"), { recursive: true });

  const journal = { id: transactionId, createdAt: new Date().toISOString(), root, writes: [] };
  for (const [index, write] of plan.entries()) {
    const entry = { path: write.path, action: write.action, expectedHash: write.expectedHash };
    if (write.action !== "create" && fs.existsSync(write.target)) {
      write.preimage = path.join(transactionDir, "preimages", String(index));
      entry.preimage = `preimages/${index}`;
      fs.copyFileSync(write.target, write.preimage);
    }
    if (write.content !== null) {
      write.staged = path.join(transactionDir, "contents", String(index));
      entry.content = `contents/${index}`;
      fs.writeFileSync(write.staged, write.content);
    }
    journal.writes.push(entry);
  }
  fs.writeFileSync(path.join(transactionDir, "journal.json"), JSON.stringify(journal, null, 2));
}

function applyWrite(write) {
  if (write.action === "remove") {
    fs.unlinkSync(write.target);
    return;
  }
  fs.renameSync(write.staged, write.target);
}

function rollbackApplied(applied) {
  for (const write of applied.reverse()) {
    try {
      if (write.preimage) {
        fs.copyFileSync(write.preimage, write.target);
      } else if (write.action === "create") {
        fs.rmSync(write.target, { force: true });
      }
    } catch {
      // Best effort: rollback surfaces its own failure through the thrown
      // StorageError below; a broken rollback leaves the journal for repair.
    }
  }
}

function summarizeWrite(write) {
  return { path: write.path, action: write.action };
}
