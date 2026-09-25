import fs from "node:fs";
import path from "node:path";
import { envelope, failure } from "../cli/result.js";
import { commit, fromStorageError } from "../project/entities.js";
import { sourceHash } from "../storage/hash.js";

export function invalid(command, message) {
  return failure(command, message, "INVALID_INVOCATION", 2);
}

export function findingsResult(command, diagnostics, exitCode) {
  return {
    envelope: envelope({ command, ok: false, diagnostics }),
    exitCode,
    text: `${diagnostics.map((item) => item.message).join("\n")}\n`
  };
}

/** Reads one JSON object from `--data`; anything else is an invalid invocation. */
export function readData(command, cwd, dataPath) {
  let raw;
  try {
    raw = fs.readFileSync(path.resolve(cwd, String(dataPath)), "utf8");
  } catch (error) {
    return { error: invalid(command, `Cannot read --data ${dataPath}: ${error.message}`) };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return { error: invalid(command, `--data ${dataPath} is not JSON: ${error.message}`) };
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { error: invalid(command, `--data ${dataPath} must hold one JSON object`) };
  }
  return { data };
}

/**
 * SourceRefs in `record[field]` without a hash are recorded against the
 * current bytes the agent just inspected. A supplied hash must still match;
 * otherwise the evidence changed after it was read. With `refresh`, every
 * hash is replaced by the current one.
 */
export function hashRefs(command, root, record, field, refresh = false) {
  if (!Array.isArray(record[field])) return null;
  for (const source of record[field]) {
    if (!source || typeof source !== "object" || typeof source.path !== "string") continue;
    let current;
    try {
      current = sourceHash(root, { path: source.path, sceneId: source.scene, beatId: source.beat });
    } catch (error) {
      return failure(command, `Source ${source.path} cannot be read: ${error.message}`, "SOURCE_UNREADABLE", 1, [record.id]);
    }
    if (source.hash === undefined || refresh) source.hash = current;
    else if (source.hash !== current) {
      return failure(command, `Source ${source.path} no longer matches the supplied hash`, "STALE_SOURCE", 3, [record.id]);
    }
  }
  return null;
}

/** Filenames already present in a project directory. */
export function takenNames(root, directory) {
  const absolute = path.join(root, directory);
  return new Set(fs.existsSync(absolute) ? fs.readdirSync(absolute) : []);
}

/** Commits `writes` and returns the result, or the storage failure. */
export function writeResult(command, root, writes, options, success) {
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({ command, ok: true, data: { ...success.data, dryRun: options.dryRun === true }, diagnostics: success.diagnostics ?? [], writes: recorded }),
      exitCode: 0,
      text: options.dryRun === true ? "" : success.text,
      ...(success.log ? { log: success.log } : {})
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}
