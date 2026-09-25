import { cachedContext } from "../../context/cache.js";
import { validateRequest } from "../../context/build.js";
import { loadErrorResult, openProject } from "../../project/entities.js";
import { envelope, finding, present } from "../result.js";
import { cursorOption } from "./fact.js";

const COMMAND = "context";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function optionList(value) {
  if (value === undefined) return undefined;
  return (Array.isArray(value) ? value : [value]).map(String);
}

function invalid(messages) {
  const diagnostics = messages.map((message) => finding({
    code: "INVALID_INVOCATION",
    message,
    action: "Pass --task, plus --scene [--beat] [--side] for draft, revise, review and image."
  }));
  return { envelope: envelope({ command: COMMAND, ok: false, diagnostics }), exitCode: 2, text: `${messages.join("\n")}\n` };
}

/** The context request named by the command-line options. */
function requestFrom(options) {
  const problems = [];
  const request = { task: optionValue(options.task) };
  const target = cursorOption(options);
  if (target !== undefined) request.target = target;
  else if (options.beat !== undefined || options.side !== undefined) problems.push("--beat and --side need --scene");
  const audience = optionValue(options.audience);
  if (audience !== undefined) request.audience = audience;
  const constraints = optionList(options.constraint);
  if (constraints !== undefined) request.constraints = constraints;
  const include = optionList(options.include);
  if (include !== undefined) request.include = include;
  const maxBytes = optionValue(options["max-bytes"]);
  if (maxBytes !== undefined) {
    if (/^[0-9]+$/.test(String(maxBytes)) && Number(maxBytes) > 0) request.maxBytes = Number(maxBytes);
    else problems.push("--max-bytes must be a positive integer");
  }
  return { request, problems };
}

function sourceText(source) {
  let where = source.path;
  if (source.index !== undefined) where += `#${source.index}`;
  if (source.scene !== undefined) where += `#${source.scene}${source.beat === undefined ? "" : `/${source.beat}`}`;
  if (source.until !== undefined) where += ` until ${source.until.side} ${source.until.beat}`;
  return `${where} [${source.kind}]`;
}

function contentText(content) {
  if (typeof content === "string") return content.endsWith("\n") ? content : `${content}\n`;
  if (Array.isArray(content)) return `${JSON.stringify(content, null, 2)}\n`;
  const { body, ...rest } = content;
  const fields = `${JSON.stringify(rest.record ?? rest, null, 2)}\n`;
  return body === undefined ? fields : `${fields}${body.endsWith("\n") ? body : `${body}\n`}`;
}

function itemText(item) {
  return [
    `## ${item.id} (${item.kind}${item.required ? ", required" : ""})`,
    `Why: ${item.reason}`,
    `Sources: ${item.sources.map(sourceText).join("; ")}`,
    contentText(item.content)
  ].join("\n");
}

function targetText(target) {
  if (target === null) return "";
  if (target.beatId === undefined) return ` at ${target.sceneId} ${target.side}`;
  return ` at ${target.sceneId} ${target.side} ${target.beatId}`;
}

function cacheText(cache) {
  if (cache.warning !== undefined) return `Cache: not stored (${cache.warning})`;
  return `Cache: ${cache.hit ? "hit" : "miss"} (key ${cache.key.slice(0, 12)})`;
}

function packetText(packet, cache) {
  const lines = [
    `Context: ${packet.operation}${targetText(packet.target)} (${packet.audience})`,
    `Budget: ${packet.bytes} of ${packet.maxBytes} bytes`,
    cacheText(cache),
    ""
  ];
  for (const item of packet.items) lines.push(itemText(item));
  if (packet.impact.length > 0) {
    lines.push("Impact (later material; not writer knowledge):", "");
    for (const item of packet.impact) lines.push(itemText(item));
  }
  if (packet.omissions.length > 0) {
    lines.push("Omitted (over the byte budget):");
    for (const item of packet.omissions) lines.push(`- ${item.id} (${item.kind}, ${item.bytes} bytes): retrieve with --include ${item.retrieval}`);
    lines.push("");
  }
  if (packet.required.length > 0) {
    lines.push("Required material that did not fit:");
    for (const item of packet.required) lines.push(`- ${item.id} (${item.kind}, ${item.bytes} bytes): ${item.reason}`);
    lines.push("");
  }
  if (packet.diagnostics.length > 0) {
    lines.push("Diagnostics:");
    for (const item of packet.diagnostics) lines.push(`- ${item.severity} ${item.code}: ${item.message}`);
  }
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

/**
 * `story context`: a context packet for one task through the dependency
 * cache. Invalid requests exit 2; a missing target or required material that
 * cannot fit exits 1 with its findings.
 */
export function contextCommand(ctx) {
  return present(ctx, contextResult(ctx.root(), ctx.parsed.options));
}

function contextResult(root, options) {
  const { request, problems } = requestFrom(options);
  problems.push(...validateRequest(request).problems);
  if (problems.length > 0) return invalid(problems);
  const opened = openProject(root, COMMAND);
  if (opened.error) return opened.error;
  const blocked = loadErrorResult(COMMAND, opened.project);
  if (blocked) return blocked;
  const { packet, cache } = cachedContext(opened.project, request);
  const ok = !packet.diagnostics.some((item) => item.severity === "error");
  return {
    envelope: envelope({ command: COMMAND, ok, data: { packet, cache }, diagnostics: packet.diagnostics }),
    exitCode: ok ? 0 : 1,
    text: packetText(packet, cache)
  };
}
