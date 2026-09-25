import fs from "node:fs";
import path from "node:path";
import { FORMAT } from "../../contracts.js";
import { formatTimeline } from "../../timeline.js";
import { storyTimeline } from "../../story.js";
import { parseFrontmatter } from "../../storage/document.js";
import { loadProjectSync } from "../../project/load.js";
import { buildChronology } from "../../state/chronology.js";
import { envelope, finding, present } from "../result.js";

export function timelineCommand(ctx) {
  if (isStoryToolkitProject(ctx.root())) return toolkitTimeline(ctx);
  return legacyTimeline(ctx);
}

function isStoryToolkitProject(root) {
  try {
    const raw = fs.readFileSync(path.join(root, "story.md"), "utf8");
    return parseFrontmatter(raw, "story.md").data?.format === FORMAT;
  } catch {
    return false;
  }
}

function toolkitTimeline(ctx) {
  const project = loadProjectSync(ctx.root());
  const chronology = buildChronology(project);
  const diagnostics = [...project.diagnostics, ...chronology.diagnostics];
  const ok = !diagnostics.some((item) => item.severity === "error");
  const data = {
    format: FORMAT,
    readingOrder: chronology.readingOrder,
    storyOrder: chronology.storyOrder
  };
  return present(ctx, {
    envelope: envelope({ command: "timeline", ok, data, diagnostics, writes: [] }),
    exitCode: ok ? 0 : 1,
    text: formatPartialTimeline(data, diagnostics)
  });
}

function formatPartialTimeline(data, diagnostics) {
  const lines = ["Timeline"];
  lines.push("", "Reading order:");
  if (data.readingOrder.length === 0) lines.push("- None");
  for (const entry of data.readingOrder) {
    const beats = entry.beats.length === 0 ? "" : ` [${entry.beats.join(", ")}]`;
    lines.push(`- ${entry.position + 1}. ${entry.sceneId} (${entry.chapterId})${beats}`);
  }
  lines.push("", "Story order (partial; constraints are not a linear sequence):");
  if (data.storyOrder.constraints.length === 0) lines.push("- No ordering constraints");
  for (const edge of data.storyOrder.constraints) {
    lines.push(`- ${edge.earlier} before ${edge.later} (${edge.reason})`);
  }
  if (data.storyOrder.cyclic.length > 0) {
    lines.push("", "Cycles (not a sequence):");
    for (const group of data.storyOrder.cyclic) lines.push(`- ${group.join(", ")}`);
  }
  if (data.storyOrder.unplaced.length > 0) {
    lines.push("", "Not placed in story order:");
    for (const id of data.storyOrder.unplaced) lines.push(`- ${id}`);
  }
  if (diagnostics.length > 0) {
    lines.push("", "Diagnostics:");
    for (const item of diagnostics) lines.push(`- ${item.severity} ${item.code}: ${item.message}`);
  }
  return `${lines.join("\n")}\n`;
}

function legacyTimeline(ctx) {
  const timeline = storyTimeline(ctx.root());
  const text = formatTimeline(timeline, timeline.totalChapters);
  if (ctx.json) {
    const diagnostics = timeline.errors.map((message) => finding({
      code: "COMMAND_FAILED",
      message,
      action: "Fix the reported error and run the command again."
    }));
    return present(ctx, {
      envelope: envelope({
        command: "timeline",
        ok: timeline.ok,
        data: {
          format: "schema-v2",
          chronology: timeline.chronology,
          undated: timeline.undated,
          pov: timeline.pov,
          presence: timeline.presence
        },
        diagnostics,
        writes: []
      }),
      exitCode: timeline.ok ? 0 : 1,
      text
    });
  }
  ctx.io.stdout.write(text);
  return reportLegacy(ctx.io, timeline);
}

function reportLegacy(io, result) {
  const dismissed = result.dismissed ?? [];
  const successMessage = "Timeline built";
  const failureMessage = "Timeline failed";
  io.stderr.write(`${result.ok ? successMessage : failureMessage}: ${result.errors.length} errors, ${result.warnings.length} warnings, ${dismissed.length} dismissed\n`);
  for (const error of result.errors) io.stderr.write(`error: ${error}\n`);
  for (const warning of result.warnings) io.stderr.write(`warning: ${warning}\n`);
  for (const entry of dismissed) io.stderr.write(`dismissed: ${entry.finding} (exemption: ${entry.reason})\n`);
  return result.ok ? 0 : 1;
}
