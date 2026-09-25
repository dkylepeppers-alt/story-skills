import { knowledgeAtChapter } from "../../story.js";
import { loadErrorResult, openProject } from "../../project/entities.js";
import { knowledgeAt } from "../../state/knowledge.js";
import { envelope, failure, present } from "../result.js";
import { cursorOption } from "./fact.js";
import { isStoryToolkitProject } from "./timeline.js";

const COMMAND = "knowledge";
const TOOLKIT_USAGE = "Usage: story knowledge <character-id> --scene <id> [--beat <id>] [--side before|after] [--project <path>]";
const LEGACY_USAGE = "Usage: story knowledge <character-id> --at <chapter-id> [--path <project>]";

export function knowledgeCommand(ctx) {
  const root = ctx.root();
  if (isStoryToolkitProject(root)) return present(ctx, toolkitKnowledge(ctx, root));
  return present(ctx, legacyKnowledge(ctx, root));
}

function invalid(message) {
  return failure(COMMAND, message, "INVALID_INVOCATION", 2);
}

function toolkitKnowledge(ctx, root) {
  const options = ctx.parsed.options;
  if (options.at !== undefined) {
    return invalid(`--at is for schema v2 projects; use --scene on a story-toolkit project.\n${TOOLKIT_USAGE}`);
  }
  const cursor = cursorOption(options);
  if (cursor === undefined) return invalid(TOOLKIT_USAGE);
  const opened = openProject(root, COMMAND);
  if (opened.error) return opened.error;
  const blocked = loadErrorResult(COMMAND, opened.project);
  if (blocked) return blocked;
  const characterId = String(ctx.parsed.positionals[1]);
  const result = knowledgeAt(opened.project, characterId, cursor);
  const ok = !result.diagnostics.some((item) => item.severity === "error");
  const data = {
    cursor,
    character: result.character,
    knows: result.knows,
    believes: result.believes,
    unresolved: result.unresolved
  };
  return {
    envelope: envelope({ command: COMMAND, ok, data, diagnostics: result.diagnostics, writes: [] }),
    exitCode: ok ? 0 : 1,
    text: formatKnowledge(characterId, data, result.diagnostics)
  };
}

function cursorLabel(cursor) {
  const beat = cursor.beatId === undefined ? "" : ` ${cursor.beatId}`;
  return `${cursor.sceneId}${beat} (${cursor.side})`;
}

function describe(item) {
  if (item.statement) {
    const { id, subject, predicate, value } = item.statement;
    return `${id} (${subject} ${predicate} ${value})`;
  }
  return String(item.value);
}

function section(lines, title, items, render) {
  lines.push(`${title}:`);
  if (items.length === 0) lines.push("- None");
  for (const item of items) lines.push(render(item));
}

function formatKnowledge(characterId, data, diagnostics) {
  const name = data.character ? ` (${data.character.name})` : "";
  const lines = [`Knowledge of ${characterId}${name} at ${cursorLabel(data.cursor)}:`];
  section(lines, "Knows", data.knows, (item) => `- ${item.id}: ${describe(item)}`);
  section(lines, "Believes", data.believes, (item) => `- ${item.id}: ${describe(item)}`);
  if (data.unresolved.length > 0) {
    section(lines, "Unresolved", data.unresolved, (item) => `- ${item.id}: ${String(item.value)} (${item.reason})`);
  }
  if (diagnostics.length > 0) {
    section(lines, "Diagnostics", diagnostics, (item) => `- ${item.severity} ${item.code}: ${item.message}`);
  }
  return `${lines.join("\n")}\n`;
}

// Schema v2 keeps chapter-granular knowledge from continuity/state.md.
function legacyKnowledge(ctx, root) {
  const options = ctx.parsed.options;
  if (options.scene !== undefined || options.beat !== undefined || options.side !== undefined) {
    return invalid(`--scene is for story-toolkit projects; schema v2 knowledge uses --at.\n${LEGACY_USAGE}`);
  }
  const characterId = String(ctx.parsed.positionals[1]);
  const atChapterId = Array.isArray(options.at) ? options.at.at(-1) : options.at;
  if (typeof atChapterId !== "string") return invalid(LEGACY_USAGE);
  let entries;
  try {
    entries = knowledgeAtChapter(root, characterId, atChapterId);
  } catch (error) {
    return legacyFailure(error);
  }
  const text = entries.length === 0
    ? `No recorded knowledge for ${characterId} at ${atChapterId}\n`
    : entries.map((entry) => {
      const source = entry.learnedIn === "" ? "pre-existing knowledge" : `learned in ${entry.learnedIn}`;
      return `- ${entry.knows} (${source})\n`;
    }).join("");
  return {
    envelope: envelope({
      command: COMMAND,
      ok: true,
      data: { format: "schema-v2", character: characterId, at: atChapterId, entries },
      writes: []
    }),
    exitCode: 0,
    text
  };
}

// A missing project is an invalid invocation. An unknown character or chapter
// and an unreadable continuity/state.md are error findings. Filesystem
// permission failures are operational.
function legacyFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("is not a story project: missing story.md")) {
    return failure(COMMAND, message, "PROJECT_NOT_FOUND", 2);
  }
  if (error && (error.code === "EACCES" || error.code === "EPERM")) {
    return failure(COMMAND, message, "OPERATION_FAILED", 4);
  }
  return failure(COMMAND, message, "COMMAND_FAILED", 1);
}
