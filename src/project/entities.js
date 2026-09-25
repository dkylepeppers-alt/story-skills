import fs from "node:fs";
import path from "node:path";
import { StorageError } from "../contracts.js";
import { parseFrontmatter, replaceFrontmatter, stringifyFrontmatter } from "../storage/document.js";
import { sha256Hex } from "../storage/hash.js";
import { writeTransactionSync } from "../storage/transaction.js";
import { loadProjectSync } from "./load.js";
import { classifyReferences } from "./references.js";
import { validateRecord } from "./schema.js";
import {
  ENTITY_DIRECTORY,
  ENTITY_TYPES,
  ID_PATTERN,
  allocateId,
  slugify,
  uniqueFilename
} from "./identity.js";
import { envelope, failure, finding, publicWrite } from "../cli/result.js";

function slash(value) {
  return value.split(path.sep).join("/");
}

function openProject(root, command) {
  const story = path.join(root, "story.md");
  if (!fs.existsSync(story) || !fs.statSync(story).isFile()) {
    return { error: failure(command, `No story project at ${root}: missing story.md`, "PROJECT_NOT_FOUND", 2) };
  }
  const project = loadProjectSync(root);
  const record = [...project.records.values()].find((entry) => entry.type === "project");
  if (!record) {
    const diagnostics = project.diagnostics.length > 0 ? project.diagnostics : [finding({
      code: "PROJECT_FORMAT",
      message: `${root} is not a story-toolkit project`,
      action: "Point --project at a format story-toolkit directory."
    })];
    return {
      error: {
        envelope: envelope({ command, ok: false, diagnostics }),
        exitCode: 2,
        text: `${diagnostics.map((item) => item.message).join("\n")}\n`
      }
    };
  }
  return { project };
}

function listMarkdown(root) {
  const files = [];
  const skip = new Set([".story", ".git", "node_modules", "dist"]);
  const walk = (directory) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(slash(path.relative(root, absolute)));
    }
  };
  walk(root);
  return files.sort();
}

function directoryNames(root, directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute);
}

function commit(root, writes, dryRun) {
  if (writes.length === 0) return [];
  if (dryRun) {
    for (const write of writes) {
      const absolute = path.join(root, write.path);
      if (write.action === "create") {
        if (fs.existsSync(absolute)) {
          throw new StorageError("STALE_SOURCE", `Create asserts absence but the file already exists: ${write.path}`);
        }
      } else if (sha256Hex(fs.readFileSync(absolute)) !== write.expectedHash) {
        throw new StorageError("STALE_SOURCE", `Expected hash mismatch for ${write.path}`);
      }
    }
    return writes.map(publicWrite);
  }
  for (const write of writes) {
    if (write.action === "create") fs.mkdirSync(path.dirname(path.join(root, write.path)), { recursive: true });
  }
  writeTransactionSync(root, writes);
  return writes.map(publicWrite);
}

const BLOCKING_LOAD_CODES = new Set([
  "SCHEMA_VIOLATION",
  "RECORD_UNPARSEABLE",
  "RECORD_UNREADABLE",
  "FORMAT_UNSUPPORTED",
  "FORMAT_UPSTREAM_V2",
  "SCHEMA_VERSION_UNSUPPORTED",
  "DUPLICATE_RECORD_ID",
  "UNKNOWN_RECORD_TYPE"
]);

function loadErrorResult(command, project, targetId) {
  const diagnostics = project.diagnostics.filter((item) => BLOCKING_LOAD_CODES.has(item.code));
  if (diagnostics.length === 0) return null;
  if (targetId !== undefined) {
    const classified = classifyReferences(project, targetId);
    diagnostics.push(...dependencyDiagnostics(targetId, classified, "refuse"));
  }
  return {
    envelope: envelope({ command, ok: false, diagnostics }),
    exitCode: 2,
    text: `${diagnostics.map((item) => item.message).join("\n")}\n`
  };
}

function fromStorageError(command, error) {
  const code = error instanceof StorageError ? error.code : "OPERATION_FAILED";
  const exitCode = code === "STALE_SOURCE" || code === "LOCKED" ? 3 : 4;
  return failure(command, error.message, code, exitCode);
}

function buildRecord(type, id, name, options) {
  const base = { format: "story-toolkit", "schema-version": 1, id, type };
  if (type === "scene") return { ...base, "chapter-id": options.chapterId, title: name };
  if (type === "research") return { ...base, title: name, status: "open" };
  if (type === "chapter") return { ...base, name, title: name };
  return { ...base, name };
}

export function addEntity(root, options = {}) {
  const command = "entity add";
  const type = String(options.type ?? "").trim().toLowerCase();
  const name = String(options.name ?? "").trim();
  if (!type || !name) return failure(command, "Usage: story entity add <type> <name>", "INVALID_INVOCATION", 2);
  if (!ENTITY_TYPES.includes(type)) {
    return failure(command, `Unsupported entity type: ${type}`, "UNKNOWN_ENTITY_TYPE", 2);
  }
  if (type === "scene" && !String(options.chapterId ?? "").trim()) {
    return failure(command, "entity add scene requires --chapter <chapter-id>", "INVALID_INVOCATION", 2);
  }
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const blocked = loadErrorResult(command, opened.project);
  if (blocked) return blocked;
  const used = new Set(opened.project.records.keys());
  let id = options.id === undefined ? null : String(options.id).trim();
  if (id !== null) {
    if (!ID_PATTERN.test(id)) return failure(command, `Invalid id: ${id}`, "INVALID_INVOCATION", 2);
    if (used.has(id)) {
      return failure(command, `Record id ${id} is already used`, "DUPLICATE_RECORD_ID", 1, [id]);
    }
  } else {
    id = allocateId(type, used);
  }
  const record = buildRecord(type, id, name, options);
  const diagnostics = validateRecord(record);
  if (diagnostics.length > 0) {
    return {
      envelope: envelope({ command, ok: false, diagnostics }),
      exitCode: 2,
      text: `${diagnostics.map((item) => item.message).join("\n")}\n`
    };
  }
  const directory = ENTITY_DIRECTORY[type];
  const filename = uniqueFilename(slugify(name), id, new Set(directoryNames(root, directory)));
  const relative = `${directory}/${filename}`;
  const writes = [{ path: relative, action: "create", expectedHash: null, content: stringifyFrontmatter(record) }];
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: true,
        data: { id, type, name, path: relative, dryRun: options.dryRun === true },
        writes: recorded
      }),
      exitCode: 0,
      text: options.dryRun === true ? "" : `Created ${type} ${id}: ${relative}\n`
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}

function displayRecord(data, name) {
  const next = { ...data };
  const previous = data.name ?? data.title ?? "";
  if (typeof data.name === "string") next.name = name;
  if (typeof data.title === "string" && (data.type === "chapter" || data.type === "scene" || data.type === "research" || data.title === previous)) {
    next.title = name;
  }
  if (typeof data.name !== "string" && typeof next.title !== "string") next.name = name;
  return next;
}

function resolveLink(fromRel, target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  if (target.startsWith("#") || target === "") return null;
  if (target.startsWith("/")) {
    const resolved = path.posix.normalize(target.slice(1));
    return resolved.startsWith("..") ? null : resolved;
  }
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), target));
  if (resolved.startsWith("..") || resolved === "") return null;
  return resolved;
}

function outsideInlineCode(line) {
  let result = "";
  let index = 0;
  while (index < line.length) {
    const tick = line.indexOf("`", index);
    if (tick === -1) {
      result += line.slice(index);
      break;
    }
    result += line.slice(index, tick);
    let ticks = 0;
    while (line[tick + ticks] === "`") ticks += 1;
    const token = "`".repeat(ticks);
    const closer = line.indexOf(token, tick + ticks);
    if (closer === -1) {
      result += line.slice(tick);
      break;
    }
    index = closer + ticks;
  }
  return result;
}

function proseText(markdown) {
  let fence = null;
  const parts = [];
  for (const line of markdown.split(/(?<=\n)/)) {
    const marker = /^[ \t]{0,3}(`{3,}|~{3,})(.*)$/.exec(line.replace(/\r?\n$/, ""));
    if (marker) {
      const char = marker[1][0];
      const size = marker[1].length;
      if (!fence) fence = { char, size };
      else if (char === fence.char && size >= fence.size && marker[2].trim() === "") fence = null;
      continue;
    }
    if (!fence) parts.push(outsideInlineCode(line));
  }
  return parts.join("");
}

function staleProseLinks(markdown, fromRel, oldRel, newRel) {
  if (oldRel === newRel) return [];
  const found = [];
  for (const match of proseText(markdown).matchAll(/\[[^\]]*\]\(([^)]*)\)/g)) {
    const inside = match[1].trim();
    const destination = /^(\S+)/.exec(inside)?.[1] ?? "";
    const hash = destination.indexOf("#");
    const pathPart = hash === -1 ? destination : destination.slice(0, hash);
    if (resolveLink(fromRel, pathPart) !== oldRel) continue;
    found.push(inside);
  }
  return found;
}

function rewritePathFields(markdown, file, oldRel, newRel) {
  if (oldRel === newRel) return markdown;
  let parsed;
  try {
    parsed = parseFrontmatter(markdown, file);
  } catch {
    return markdown;
  }
  const next = replaceExact(parsed.data, oldRel, newRel);
  if (JSON.stringify(next) === JSON.stringify(parsed.data)) return markdown;
  return replaceFrontmatter(markdown, next);
}

function replaceExact(value, oldRel, newRel) {
  if (typeof value === "string") return value === oldRel ? newRel : value;
  if (Array.isArray(value)) return value.map((item) => replaceExact(item, oldRel, newRel));
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, child] of Object.entries(value)) next[key] = replaceExact(child, oldRel, newRel);
    return next;
  }
  return value;
}

export function renameEntity(root, id, name, options = {}) {
  const command = "entity rename";
  const nextName = String(name ?? "").trim();
  if (!id || !nextName) return failure(command, "Usage: story entity rename <id> <name>", "INVALID_INVOCATION", 2);
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const blocked = loadErrorResult(command, opened.project);
  if (blocked) return blocked;
  const entry = opened.project.records.get(id);
  if (!entry || !ENTITY_DIRECTORY[entry.type]) {
    return failure(command, `No entity with id ${id}`, "ENTITY_NOT_FOUND", 1, [id]);
  }
  const oldRel = slash(entry.path);
  const absolute = path.join(root, entry.path);
  const original = fs.readFileSync(absolute);
  const markdown = original.toString("utf8");
  let parsed;
  try {
    parsed = parseFrontmatter(markdown, entry.path);
  } catch (error) {
    return failure(command, error.message, "INVALID_INVOCATION", 2, [id]);
  }
  const directory = path.posix.dirname(oldRel);
  const taken = new Set(directoryNames(root, directory === "." ? "" : directory).filter((item) => item !== path.posix.basename(oldRel)));
  const filename = uniqueFilename(slugify(nextName), id, taken);
  const newRel = directory === "." ? filename : `${directory}/${filename}`;
  const updatedData = replaceExact(displayRecord(parsed.data, nextName), oldRel, newRel);
  const content = replaceFrontmatter(markdown, updatedData);
  const diagnostics = [];
  const noteStale = (file, text, fromRel) => {
    for (const inside of staleProseLinks(text, fromRel, oldRel, newRel)) {
      diagnostics.push(finding({
        code: "STALE_PROSE_LINK",
        severity: "warning",
        message: `${file}: prose link (${inside}) still points at ${oldRel}`,
        recordIds: [id],
        evidence: "candidate",
        action: "Update the manuscript link by hand if it should follow the renamed file. Rename does not rewrite prose."
      }));
    }
  };
  noteStale(newRel, content, newRel);
  const writes = [];
  const hash = sha256Hex(original);
  if (newRel === oldRel) {
    if (content !== markdown) writes.push({ path: oldRel, action: "replace", expectedHash: hash, content });
  } else {
    writes.push({ path: newRel, action: "create", expectedHash: null, content });
    writes.push({ path: oldRel, action: "remove", expectedHash: hash });
  }
  for (const file of listMarkdown(root)) {
    if (file === oldRel) continue;
    const raw = fs.readFileSync(path.join(root, file));
    const text = raw.toString("utf8");
    const updated = rewritePathFields(text, file, oldRel, newRel);
    if (updated !== text) writes.push({ path: file, action: "replace", expectedHash: sha256Hex(raw), content: updated });
    noteStale(file, text, file);
  }
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: diagnostics.every((item) => item.severity !== "error"),
        data: { id, type: entry.type, name: nextName, path: newRel, dryRun: options.dryRun === true },
        diagnostics,
        writes: recorded
      }),
      exitCode: diagnostics.some((item) => item.severity === "error") ? 1 : 0,
      text: options.dryRun === true ? "" : `Renamed ${id} to ${nextName}: ${newRel}\n`,
      log: diagnostics.length > 0 ? `${diagnostics.map((item) => item.message).join("\n")}\n` : undefined
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}

function referenceFinding(code, message, recordIds, action, severity = "error") {
  return finding({
    code,
    severity,
    message,
    recordIds,
    evidence: code === "REQUIRED_REFERENCE" ? "declared" : "structural",
    action
  });
}

function dependencyDiagnostics(id, classified, policy) {
  if (policy === "detach") {
    return classified.required.map((item) => referenceFinding(
      "REQUIRED_REFERENCE",
      item.kind === "fact"
        ? `Cannot detach ${id}: ${item.entry.id} ${item.fields.join(" and ")} is a required unresolved fact reference`
        : `Cannot detach ${id}: ${item.entry.id} ${item.fields.join(" and ")} is a required reference`,
      [id, item.entry.id],
      item.kind === "fact"
        ? "Resolve the fact with an explicit reconciliation proposal before removing this entity."
        : "Reassign or remove the referencing record before deleting this one. Manuscript prose is not rewritten."
    ));
  }
  return [
    ...classified.required.map((item) => referenceFinding(
      "REFERENCE_PRESENT",
      `Refusing to remove ${id}: ${item.entry.id} ${item.fields.join(" and ")} depends on it`,
      [id, item.entry.id],
      "Use --policy detach for optional structural references, or reconcile required references first."
    )),
    ...classified.optional.map((item) => referenceFinding(
      "REFERENCE_PRESENT",
      `Refusing to remove ${id}: ${item.entry.id} ${item.fields.join(" and ")} depends on it`,
      [id, item.entry.id],
      "Use --policy detach to clear optional cast or chronology.after references."
    ))
  ];
}

function withoutReference(data, id, fields) {
  const next = { ...data };
  if (fields.includes("cast") && Array.isArray(next.cast)) {
    next.cast = next.cast.filter((value) => value !== id);
  }
  if (fields.includes("after") && next.chronology && Array.isArray(next.chronology.after)) {
    next.chronology = {
      ...next.chronology,
      after: next.chronology.after.filter((value) => value !== id)
    };
  }
  return next;
}

export function removeEntity(root, id, options = {}) {
  const command = "entity remove";
  const policy = options.policy;
  if (policy !== "refuse" && policy !== "detach") {
    return failure(command, "entity remove requires --policy refuse|detach", "INVALID_INVOCATION", 2);
  }
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const blocked = loadErrorResult(command, opened.project, id);
  if (blocked) return blocked;
  const entry = opened.project.records.get(id);
  if (!entry || !ENTITY_DIRECTORY[entry.type]) {
    return failure(command, `No entity with id ${id}`, "ENTITY_NOT_FOUND", 1, [id]);
  }
  const classified = classifyReferences(opened.project, id);
  const { required, optional } = classified;
  if (policy === "refuse" && (required.length > 0 || optional.length > 0)) {
    const diagnostics = dependencyDiagnostics(id, classified, "refuse");
    return {
      envelope: envelope({ command, ok: false, data: { id, policy }, diagnostics }),
      exitCode: 1,
      text: `${diagnostics.map((item) => item.message).join("\n")}\n`
    };
  }
  if (policy === "detach" && required.length > 0) {
    const diagnostics = dependencyDiagnostics(id, classified, "detach");
    return {
      envelope: envelope({ command, ok: false, data: { id, policy }, diagnostics }),
      exitCode: 1,
      text: `${diagnostics.map((item) => item.message).join("\n")}\n`
    };
  }

  const writes = [];
  const detached = [];
  for (const item of optional) {
    const absolute = path.join(root, item.entry.path);
    const raw = fs.readFileSync(absolute);
    const markdown = raw.toString("utf8");
    const parsed = parseFrontmatter(markdown, item.entry.path);
    const content = replaceFrontmatter(markdown, withoutReference(parsed.data, id, item.fields));
    writes.push({ path: slash(item.entry.path), action: "replace", expectedHash: sha256Hex(raw), content });
    detached.push({ recordId: item.entry.id, field: item.fields.join(" and ") });
  }
  const entityBytes = fs.readFileSync(path.join(root, entry.path));
  writes.push({ path: slash(entry.path), action: "remove", expectedHash: sha256Hex(entityBytes) });
  const diagnostics = detached.map((item) => referenceFinding(
    "REFERENCE_DETACHED",
    `Detached ${item.field} reference to ${id} from ${item.recordId}`,
    [id, item.recordId],
    "Review the detached record. Prose and facts were not rewritten.",
    "warning"
  ));
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: true,
        data: { id, type: entry.type, path: slash(entry.path), policy, detached, dryRun: options.dryRun === true },
        diagnostics,
        writes: recorded
      }),
      exitCode: 0,
      text: options.dryRun === true ? "" : `Removed ${entry.type} ${id}: ${slash(entry.path)}\n`,
      log: diagnostics.length > 0 ? `${diagnostics.map((item) => item.message).join("\n")}\n` : undefined
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}

export function showEntity(root, id) {
  const command = "entity show";
  if (!id) return failure(command, "Usage: story entity show <id>", "INVALID_INVOCATION", 2);
  const opened = openProject(root, command);
  if (opened.error) return opened.error;
  const entry = opened.project.records.get(id);
  if (!entry || !ENTITY_DIRECTORY[entry.type]) {
    return failure(command, `No entity with id ${id}`, "ENTITY_NOT_FOUND", 1, [id]);
  }
  const name = entry.record.name ?? entry.record.title ?? "";
  return {
    envelope: envelope({
      command,
      ok: true,
      data: { id: entry.id, type: entry.type, name, path: slash(entry.path) }
    }),
    exitCode: 0,
    text: `${entry.type} ${entry.id} ${name} ${slash(entry.path)}\n`
  };
}
