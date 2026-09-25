import { ID_PATTERN } from "../project/identity.js";
import { buildChronology } from "../state/chronology.js";
import { fitBudget, packetBytes } from "./budget.js";
import { selectCandidates } from "./select.js";

/**
 * Operation-specific context packets (design §7). A packet is selected
 * source material with a reason and source references on every item — never
 * a prose summary written by the CLI. `impact` holds later material for
 * revision checks and is never part of the writer's in-scene knowledge.
 */

export const TASKS = Object.freeze(["plan", "draft", "revise", "review", "world", "memory", "research", "series", "image", "publish"]);
export const SCENE_TASKS = Object.freeze(["draft", "revise", "review", "image"]);
export const AUDIENCES = Object.freeze(["writer", "reader"]);
export const DEFAULT_MAX_BYTES = 48000;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeTarget(value, problems) {
  if (value === undefined || value === null) return null;
  if (!isObject(value) || typeof value.sceneId !== "string" || value.sceneId === ""
    || (value.side !== "before" && value.side !== "after")) {
    problems.push("target needs sceneId and side before or after");
    return null;
  }
  const target = { sceneId: value.sceneId };
  if (value.beatId !== undefined && value.beatId !== null) {
    if (typeof value.beatId !== "string" || !ID_PATTERN.test(value.beatId)) {
      problems.push("target beatId must be a beat id");
      return null;
    }
    target.beatId = value.beatId;
  }
  target.side = value.side;
  return target;
}

/**
 * Validates and normalizes a context request.
 *
 * @returns {{ problems: string[], request: { task: string|null, target: object|null, audience: string, constraints: string[], include: string[], maxBytes: number } }}
 */
export function validateRequest(input) {
  const raw = isObject(input) ? input : {};
  const problems = [];
  const task = TASKS.includes(raw.task) ? raw.task : null;
  if (task === null) problems.push(`task must be one of ${TASKS.join(", ")}`);

  const hadTarget = raw.target !== undefined && raw.target !== null;
  const target = normalizeTarget(raw.target, problems);
  if (task !== null && SCENE_TASKS.includes(task) && !hadTarget) problems.push(`Task ${task} needs a target scene cursor`);

  const audience = raw.audience ?? "writer";
  if (!AUDIENCES.includes(audience)) problems.push("audience must be writer or reader");
  if (audience === "reader" && task !== null && task !== "review") problems.push("audience reader is a reader simulation; use task review");

  let maxBytes = DEFAULT_MAX_BYTES;
  if (raw.maxBytes !== undefined) {
    if (Number.isInteger(raw.maxBytes) && raw.maxBytes > 0) maxBytes = raw.maxBytes;
    else problems.push("maxBytes must be a positive integer");
  }

  let constraints = [];
  if (raw.constraints !== undefined) {
    if (Array.isArray(raw.constraints) && raw.constraints.every((item) => typeof item === "string" && item.trim() !== "")) constraints = [...raw.constraints];
    else problems.push("constraints must be non-empty strings");
  }

  let include = [];
  if (raw.include !== undefined) {
    if (Array.isArray(raw.include) && raw.include.every((item) => typeof item === "string" && ID_PATTERN.test(item))) include = [...new Set(raw.include)];
    else problems.push("include must list record ids");
  }
  if (audience === "reader" && include.length > 0) problems.push("a reader simulation cannot include records outside its reading boundary");

  return {
    problems,
    request: { task, target, audience: AUDIENCES.includes(audience) ? audience : "writer", constraints, include, maxBytes }
  };
}

function header(request) {
  return { operation: request.task, audience: request.audience, target: request.target, maxBytes: request.maxBytes };
}

function settled(packet) {
  let bytes = packetBytes(packet);
  while (packet.bytes !== bytes) {
    packet.bytes = bytes;
    bytes = packetBytes(packet);
  }
  return packet;
}

function emptyPacket(request, diagnostics) {
  return settled({ ...header(request), bytes: 0, items: [], impact: [], omissions: [], required: [], diagnostics });
}

/**
 * Builds a context packet for `request` from a loaded project.
 *
 * Packet: `{ operation, audience, target, maxBytes, bytes, items, impact,
 * omissions, required, diagnostics }`. `bytes` is the UTF-8 size of the whole
 * serialized packet and never exceeds `maxBytes` unless required material
 * cannot fit, in which case items are empty, `required` lists the required
 * material with its sources, and `CONTEXT_BUDGET_EXCEEDED` is reported.
 */
export function buildContext(project, input) {
  const { problems, request } = validateRequest(input);
  if (problems.length > 0) {
    return emptyPacket(request, problems.map((message) => ({
      code: "REQUEST_INVALID",
      severity: "error",
      message,
      recordIds: [],
      sources: [],
      evidence: "structural",
      action: "Fix the context request and try again."
    })));
  }
  const chronology = buildChronology(project);
  const selection = selectCandidates(project, request, chronology);
  if (selection.fatal) return emptyPacket(request, selection.diagnostics);
  return fitBudget(header(request), selection.candidates, request.maxBytes, selection.diagnostics);
}
