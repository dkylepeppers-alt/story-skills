import fs from "node:fs";
import path from "node:path";
import { resolveBaseline } from "../../changes/baseline.js";
import { compareRevision } from "../../changes/compare.js";
import { openProject } from "../../project/entities.js";
import { envelope, finding, present } from "../result.js";
import { baselineFailure } from "./snapshot.js";

const COMMAND = "changes";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function scopeInvalid(message) {
  const diagnostics = [finding({ code: "SCOPE_INVALID", message, action: "Pass --scope a JSON ScopeSpec file (schemas/scope.schema.json)." })];
  return { envelope: envelope({ command: COMMAND, ok: false, diagnostics }), exitCode: 2, text: `${message}\n` };
}

function readScope(cwd, file) {
  let raw;
  try {
    raw = fs.readFileSync(path.resolve(cwd, String(file)), "utf8");
  } catch (error) {
    return { error: scopeInvalid(`Cannot read --scope ${file}: ${error.message}`) };
  }
  try {
    return { scope: JSON.parse(raw) };
  } catch (error) {
    return { error: scopeInvalid(`--scope ${file} is not JSON: ${error.message}`) };
  }
}

function baselineText(baseline) {
  return baseline.kind === "git"
    ? `git ${baseline.ref} (commit ${baseline.commit.slice(0, 12)})`
    : `snapshot ${baseline.name} (hash ${baseline.hash.slice(0, 12)})`;
}

function refText(ref) {
  if (ref.beat) return `${ref.path}#${ref.scene}/${ref.beat}`;
  if (ref.scene) return `${ref.path}#${ref.scene}`;
  return ref.path;
}

function placeText(place) {
  return place.path === null ? `${place.chapterId ?? "no chapter"} (unplaced)` : `${place.chapterId} #${place.position}`;
}

function section(lines, title, entries) {
  if (entries.length === 0) return;
  lines.push(`${title}:`, ...entries.map((entry) => `  ${entry}`));
}

function reportText(report) {
  const lines = [`Changes since ${baselineText(report.baseline)}`];
  const { files } = report;
  const any = files.added.length + files.removed.length + files.changed.length > 0;
  lines.push(any ? `Files: ${files.added.length} added, ${files.removed.length} removed, ${files.changed.length} changed` : "No changes.");
  section(lines, "Records", [
    ...report.added.map((item) => `added ${item.id} (${item.type}): ${item.path}`),
    ...report.removed.map((item) => `removed ${item.id} (${item.type}): ${item.path}`),
    ...report.moved.map((item) => `moved ${item.id}: ${item.from} -> ${item.to}`),
    ...report.changed.map((item) => `changed ${item.id}: ${[...item.fields, ...(item.body ? ["body"] : [])].join(", ") || "formatting"}`)
  ]);
  section(lines, "Scenes", [
    ...report.scenes.added.map((item) => `added ${item.id} in ${item.chapterId ?? "no chapter"}`),
    ...report.scenes.removed.map((item) => `removed ${item.id} from ${item.chapterId ?? "no chapter"}`),
    ...report.scenes.moved.map((item) => `moved ${item.id}: ${placeText(item.from)} -> ${placeText(item.to)}`),
    ...report.scenes.changed.map((item) => `changed ${item.id}: prose ${item.from.hash.slice(0, 12)} -> ${item.to.hash.slice(0, 12)}`)
  ]);
  section(lines, "Facts", [
    ...report.facts.added.map((id) => `added ${id}`),
    ...report.facts.removed.map((id) => `removed ${id}`),
    ...report.facts.changed.map((item) => `changed ${item.id}: ${item.fields.join(", ")}`)
  ]);
  section(lines, "Sources", report.sources.map((item) => `${item.status} ${item.recordId} ${item.field}: ${refText(item.ref)}`));
  if (report.scope) {
    const violations = report.diagnostics.filter((item) => item.code === "EDIT_OUT_OF_SCOPE").length;
    lines.push(report.scope.ok
      ? "Scope: all changes are inside the declared ranges"
      : `Scope: ${violations} violation${violations === 1 ? "" : "s"}`);
  }
  section(lines, "Diagnostics", report.diagnostics.map((item) => `${item.severity} ${item.code}: ${item.message}`));
  return `${lines.join("\n")}\n`;
}

function exitCodeFor(diagnostics) {
  const codes = new Set(diagnostics.map((item) => item.code));
  if (codes.has("SCOPE_INVALID")) return 2;
  if (codes.has("SCOPE_BASELINE_MISMATCH")) return 3;
  return diagnostics.some((item) => item.severity === "error") ? 1 : 0;
}

/**
 * `story changes --since <git-ref-or-snapshot> [--scope <json-file>]`:
 * compares the working project with a Git commit or an explicit snapshot by
 * stable id, and checks a declared edit scope. Read-only. Exit codes: 1 error
 * findings (out-of-scope edits, removed evidence), 2 invalid input or an
 * unknown or ambiguous baseline, 3 a scope or snapshot that no longer matches
 * its hashes, 4 a Git operational failure.
 */
export function changesCommand(ctx) {
  return present(ctx, changesResult(ctx.root(), ctx.cwd, ctx.parsed.options));
}

function changesResult(root, cwd, options) {
  let scope;
  const scopeFile = optionValue(options.scope);
  if (scopeFile !== undefined) {
    const read = readScope(cwd, scopeFile);
    if (read.error) return read.error;
    scope = read.scope;
  }
  const opened = openProject(root, COMMAND);
  if (opened.error) return opened.error;
  let report;
  try {
    report = compareRevision(opened.project, resolveBaseline(root, String(optionValue(options.since))), { scope });
  } catch (error) {
    return baselineFailure(COMMAND, error);
  }
  const exitCode = exitCodeFor(report.diagnostics);
  return {
    envelope: envelope({ command: COMMAND, ok: exitCode === 0, data: report, diagnostics: report.diagnostics }),
    exitCode,
    text: reportText(report)
  };
}
