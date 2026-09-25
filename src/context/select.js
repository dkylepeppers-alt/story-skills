import fs from "node:fs";
import { decisionsFor, summarizeDecisions } from "../memory/decisions.js";
import { refreshIssueEvidence } from "../memory/issues.js";
import { referencesInRecord } from "../project/references.js";
import { factEntries, provenanceProblem, resolveState } from "../state/facts.js";
import { biographyFindings } from "../state/knowledge.js";
import { sha256Hex } from "../storage/hash.js";
import { resolveWithinRoot } from "../storage/paths.js";
import { readSourceSpan } from "../storage/spans.js";

/**
 * Candidate selection for context packets (design §7). Selection only reads
 * the loaded record set and the source files it names; it never summarizes.
 * Every candidate carries a reason, its source references, a priority that
 * follows the design's selection order, and the id to retrieve it by when the
 * budget leaves it out.
 *
 * Priorities: 0 caller constraints and the project contract; 1 requested ids,
 * the target scene and target prose; 2 nearby prose and task primary
 * material; 3 participants and applicable state; 4 directly linked plans,
 * decisions and issues; 5 style and research; 6 optional related material;
 * 8 revision impact material.
 */

const PROJECT_FIELDS = [
  "title", "premise", "counter-premise", "pov", "tense", "genre", "sub-genre",
  "setting-era", "series", "book-number", "instructions", "style-sources"
];
const PLAN_TYPES = new Set(["arc", "question", "promise", "clue"]);
const WORLD_TYPES = new Set(["location", "system", "faction", "object", "term"]);
const ENTITY_TYPES = new Set(["character", ...WORLD_TYPES]);
const STYLE_TASKS = new Set(["draft", "revise", "review", "image"]);
const IMPACT_TASKS = new Set(["revise", "review"]);
const NOT_WRITER_KNOWLEDGE = "for revision impact only; not writer knowledge at the cursor";

const byId = (left, right) => left.id.localeCompare(right.id, "en");
const slash = (value) => value.split("\\").join("/");

function kindFor(type) {
  if (ENTITY_TYPES.has(type)) return "entity";
  if (PLAN_TYPES.has(type)) return "plan";
  return type;
}

function recordSource(entry) {
  return { path: slash(entry.path), hash: entry.hash, kind: "record" };
}

// The record's own SourceRefs (facts' sources, issues' evidence), after the
// record file itself.
function declaredSources(record) {
  const refs = [];
  for (const field of ["sources", "evidence"]) {
    if (!Array.isArray(record[field])) continue;
    for (const source of record[field]) {
      if (!source || typeof source !== "object" || typeof source.path !== "string") continue;
      const ref = { path: source.path };
      if (source.scene !== undefined) ref.scene = source.scene;
      if (source.beat !== undefined) ref.beat = source.beat;
      ref.hash = source.hash;
      ref.kind = source.kind;
      refs.push(ref);
    }
  }
  return refs;
}

function recordContent(entry) {
  const { format: _format, "schema-version": _version, ...record } = entry.record;
  const body = entry.body ?? "";
  return body.trim() === "" ? { record } : { record, body };
}

/** Ids a record names, read through the shared reference index. */
function linkedIds(entry) {
  return new Set(referencesInRecord(entry.record).map((ref) => ref.id));
}

function linksTo(entry, wanted) {
  if (wanted.has(entry.id)) return true;
  for (const id of linkedIds(entry)) if (wanted.has(id)) return true;
  return false;
}

function namesIn(entry, wanted) {
  return [...linkedIds(entry)].filter((id) => wanted.has(id)).sort();
}

function notFound(message, recordIds, action) {
  return { code: "TARGET_NOT_FOUND", severity: "error", message, recordIds, sources: [], evidence: "structural", action };
}

function readingKeyOf(order, sceneId, beatId, side) {
  const scene = order.get(sceneId);
  if (!scene) return null;
  if (beatId === undefined) return [scene.position, side === "before" ? 0 : 2 * scene.beats.length + 1];
  const index = scene.beats.indexOf(beatId);
  if (index < 0) return null;
  return [scene.position, side === "before" ? 2 * index + 1 : 2 * index + 2];
}

function compareKeys(left, right) {
  return left[0] - right[0] || left[1] - right[1];
}

class Selection {
  constructor(project, request, chronology) {
    this.project = project;
    this.request = request;
    this.chronology = chronology;
    this.order = new Map(chronology.readingOrder.map((scene) => [scene.sceneId, scene]));
    this.candidates = [];
    this.seen = new Set();
    this.diagnostics = [];
    this.fatal = false;
  }

  add(item, { priority, required = false, retrieval = item.id, section = "items" }) {
    if (this.seen.has(item.id)) return;
    this.seen.add(item.id);
    this.candidates.push({ item: { ...item, required }, priority, required, retrieval, section });
  }

  addRecord(entry, reason, options, kind = kindFor(entry.type)) {
    this.add({
      id: entry.id,
      kind,
      reason,
      required: false,
      sources: [recordSource(entry), ...declaredSources(entry.record)],
      content: recordContent(entry)
    }, options);
  }

  fail(diagnostic) {
    this.diagnostics.push(diagnostic);
    this.fatal = true;
  }

  entries(predicate) {
    return [...this.project.records.values()].filter(predicate).sort(byId);
  }

  // Prose from a placed scene: the whole scene, one beat span, or the prefix
  // that ends at a cursor. Returns null for an empty prefix.
  prose(sceneId, { beatId, until } = {}) {
    const scene = this.order.get(sceneId);
    const root = this.project.root;
    const whole = readSourceSpan(root, { path: scene.path, sceneId });
    const source = { path: slash(scene.path), scene: sceneId };
    let bytes = whole.bytes;
    if (beatId !== undefined) {
      bytes = readSourceSpan(root, { path: scene.path, sceneId, beatId }).bytes;
      source.beat = beatId;
    } else if (until !== undefined) {
      let cut = until.side === "before" ? whole.start : whole.end;
      if (until.beatId !== undefined) {
        const beat = readSourceSpan(root, { path: scene.path, sceneId, beatId: until.beatId });
        cut = until.side === "before" ? beat.start : beat.end;
      }
      if (cut === whole.start) return null;
      if (cut !== whole.end) {
        bytes = whole.bytes.subarray(0, cut - whole.start);
        source.until = until.beatId === undefined ? { side: until.side } : { beat: until.beatId, side: until.side };
      }
    }
    source.hash = sha256Hex(bytes);
    source.kind = "manuscript";
    return { content: bytes.toString("utf8"), sources: [source] };
  }

  addProse(sceneId, reason, options, spanOptions = {}, id = `prose:${sceneId}`, kind = "prose") {
    const span = this.prose(sceneId, spanOptions);
    if (span === null) return;
    this.add({ id, kind, reason, required: false, sources: span.sources, content: span.content }, { retrieval: sceneId, ...options });
  }

  // --- shared pieces -------------------------------------------------------

  constraints() {
    this.request.constraints.forEach((text, index) => {
      this.add({
        id: `constraint:${index + 1}`,
        kind: "constraint",
        reason: "explicit caller constraint",
        required: false,
        sources: [{ path: "request", index: index + 1, hash: sha256Hex(Buffer.from(text, "utf8")), kind: "request" }],
        content: text
      }, { priority: 0, required: true });
    });
  }

  projectContract() {
    const entry = this.entries((item) => item.type === "project")[0];
    if (!entry) return null;
    const content = {};
    for (const field of PROJECT_FIELDS) if (entry.record[field] !== undefined) content[field] = entry.record[field];
    if ((entry.body ?? "").trim() !== "") content.body = entry.body;
    this.add({
      id: `project:${entry.id}`,
      kind: "project",
      reason: "project contract and applicable project instructions",
      required: false,
      sources: [recordSource(entry)],
      content
    }, { priority: 0, required: true, retrieval: entry.id });
    return entry;
  }

  sceneRecord(sceneId, reason, options) {
    const entry = this.project.records.get(sceneId);
    this.add({
      id: `scene:${sceneId}`,
      kind: "scene",
      reason,
      required: false,
      sources: [recordSource(entry), ...declaredSources(entry.record)],
      content: recordContent(entry)
    }, { retrieval: sceneId, ...options });
  }

  includes() {
    for (const id of this.request.include) {
      const entry = this.project.records.get(id);
      if (!entry) {
        this.fail(notFound(`Included record ${id} does not exist`, [id], "Include ids of records that exist in this project."));
        continue;
      }
      const options = { priority: 1, required: true };
      if (entry.type === "scene") {
        this.sceneRecord(id, "requested by the caller", options);
        if (this.order.has(id)) this.addProse(id, "requested by the caller", options);
      } else {
        this.addRecord(entry, "requested by the caller", options);
      }
    }
  }

  target() {
    const target = this.request.target;
    if (target === null) return null;
    const entry = this.project.records.get(target.sceneId);
    if (!entry || entry.type !== "scene") {
      this.fail(notFound(`Target scene ${target.sceneId} does not exist`, [target.sceneId], "Target a scene id from this project."));
      return null;
    }
    const scene = this.order.get(target.sceneId);
    if (!scene) {
      this.fail(notFound(`Target scene ${target.sceneId} has no span in chapter source, so there is no prose to select`, [target.sceneId],
        `Add <!-- story-scene: ${target.sceneId} --> to its chapter.`));
      return null;
    }
    if (target.beatId !== undefined && !scene.beats.includes(target.beatId)) {
      this.fail(notFound(`Beat ${target.beatId} is not in scene ${target.sceneId}`, [target.beatId, target.sceneId],
        "Target a beat declared inside the scene's span, or omit the beat."));
      return null;
    }
    return entry;
  }

  styles(projectEntry) {
    const paths = projectEntry?.record["style-sources"] ?? [];
    for (const relative of paths) {
      let bytes;
      try {
        bytes = fs.readFileSync(resolveWithinRoot(this.project.root, relative));
      } catch (error) {
        this.diagnostics.push({
          code: "STYLE_SOURCE_UNREADABLE",
          severity: "warning",
          message: `story.md style source ${relative} could not be read: ${error.message}`,
          recordIds: [projectEntry.id],
          sources: [recordSource(projectEntry)],
          evidence: "structural",
          action: "Fix the style-sources path or add the file."
        });
        continue;
      }
      this.add({
        id: `style:${relative}`,
        kind: "style",
        reason: "style source named by the project contract",
        required: false,
        sources: [{ path: relative, hash: sha256Hex(bytes), kind: "style" }],
        content: bytes.toString("utf8")
      }, { priority: 5, retrieval: relative });
    }
  }

  factItem(entry, reason, priority) {
    this.addRecord(entry, reason, { priority }, "fact");
  }

  // Applicable state at a cursor: facts that name the relevant ids first,
  // then other applicable facts, and relevant unresolved facts labelled so
  // they are never read as established.
  state(cursor, relevant, priorities) {
    const state = resolveState(this.project, cursor, { chronology: this.chronology });
    for (const fact of state.facts) {
      const entry = this.project.records.get(fact.id);
      const names = namesIn(entry, relevant);
      if (names.length > 0) this.factItem(entry, `established and applicable at the cursor; names ${names.join(", ")}`, priorities.relevant);
      else if (priorities.other !== undefined) this.factItem(entry, "established and applicable at the cursor", priorities.other);
    }
    for (const item of state.unresolved) {
      const entry = this.project.records.get(item.id);
      if (!linksTo(entry, relevant)) continue;
      this.addRecord(entry, `unresolved at the cursor (${item.reason}: ${item.detail}); not established state`,
        { priority: priorities.unresolved }, "unresolved-fact");
    }
    this.stateDiagnostics = state.diagnostics;
    return state;
  }

  decisions(ids, priorities) {
    const { instructions, proposed } = decisionsFor(this.project, ids);
    for (const item of instructions) {
      this.addRecord(this.project.records.get(item.id), `accepted decision scoped to ${item.scopeIds.join(", ")}; an instruction`, { priority: priorities.accepted });
    }
    for (const item of proposed) {
      this.addRecord(this.project.records.get(item.id), `proposed decision scoped to ${item.scopeIds.join(", ")}; history, not an instruction`, { priority: priorities.proposed });
    }
  }

  allDecisions(priorities) {
    for (const item of summarizeDecisions(this.project)) {
      const entry = this.project.records.get(item.id);
      if (item.status === "accepted" && item.supersededBy.length === 0) {
        this.addRecord(entry, "accepted decision; an instruction", { priority: priorities.accepted });
      } else if (item.status === "proposed") {
        this.addRecord(entry, "proposed decision; history, not an instruction", { priority: priorities.proposed });
      }
    }
  }

  issues(relevant, priority) {
    for (const issue of refreshIssueEvidence(this.project)) {
      if (issue.status !== "open") continue;
      const entry = this.project.records.get(issue.id);
      const names = relevant === null ? [] : namesIn(entry, relevant);
      if (relevant !== null && names.length === 0) continue;
      const reopened = issue.reopened ? "; reopened because its evidence changed" : "";
      const about = names.length > 0 ? ` affecting ${names.join(", ")}` : "";
      this.addRecord(entry, `open issue${about}${reopened}`, { priority });
    }
  }

  plans(relevant, priority) {
    for (const entry of this.entries((item) => PLAN_TYPES.has(item.type))) {
      if (relevant === null) {
        this.addRecord(entry, `${entry.type} in the project plan`, { priority });
        continue;
      }
      const names = namesIn(entry, relevant);
      if (relevant.has(entry.id) || names.length > 0) {
        this.addRecord(entry, `linked ${entry.type}${names.length > 0 ? `; names ${names.join(", ")}` : ""}`, { priority });
      }
    }
  }

  research(relevant, priority) {
    for (const entry of this.entries((item) => item.type === "research")) {
      if (relevant === null) {
        this.addRecord(entry, "research record", { priority });
        continue;
      }
      const names = namesIn(entry, relevant);
      if (names.length > 0) this.addRecord(entry, `research used by ${names.join(", ")}`, { priority });
    }
  }

  outline(priority) {
    const content = this.chronology.readingOrder.map((scene) => {
      const record = this.project.records.get(scene.sceneId).record;
      const line = { sceneId: scene.sceneId, chapterId: scene.chapterId };
      if (record.title !== undefined) line.title = record.title;
      return line;
    });
    const ids = [...new Set(this.chronology.readingOrder.flatMap((scene) => [scene.chapterId, scene.sceneId]))];
    this.add({
      id: "outline",
      kind: "outline",
      reason: "reading-order outline of placed scenes",
      required: false,
      sources: ids.map((id) => recordSource(this.project.records.get(id))),
      content
    }, { priority, retrieval: "outline" });
  }

  profiles(ids, reason, priority) {
    const included = [];
    for (const id of ids) {
      const entry = this.project.records.get(id);
      if (!entry || !ENTITY_TYPES.has(entry.type)) continue;
      this.addRecord(entry, reason, { priority });
      included.push(id);
    }
    return included;
  }

  finish(profileIds = []) {
    const selected = new Set(this.candidates.map((candidate) => candidate.item.id));
    const relevantState = (this.stateDiagnostics ?? []).filter((item) => item.recordIds.some((id) => selected.has(id)));
    const included = [...new Set([...profileIds, ...this.candidates.filter((candidate) => candidate.item.kind === "entity").map((candidate) => candidate.item.id)])];
    return {
      candidates: this.candidates,
      diagnostics: [...this.diagnostics, ...relevantState, ...biographyFindings(this.project, included)],
      fatal: this.fatal
    };
  }
}

// --- writer packets --------------------------------------------------------

function sceneTask(selection, sceneEntry) {
  const { request, order } = selection;
  const target = request.target;
  const scene = order.get(target.sceneId);
  const cast = Array.isArray(sceneEntry.record.cast) ? sceneEntry.record.cast : [];
  const relevant = new Set([target.sceneId, ...cast, ...request.include]);

  selection.sceneRecord(target.sceneId, "the target scene record (scene entry)", { priority: 1, required: true });
  if (request.task === "draft") {
    selection.addProse(target.sceneId, "target scene prose up to the cursor; nothing after it", { priority: 1, required: true },
      { until: { beatId: target.beatId, side: target.side } });
  } else {
    const what = target.beatId === undefined ? "the target scene" : `beat ${target.beatId}`;
    selection.addProse(target.sceneId, `target prose: ${what}`, { priority: 1, required: true }, { beatId: target.beatId });
  }
  const previous = selection.chronology.readingOrder[scene.position - 1];
  if (previous) selection.addProse(previous.sceneId, "the scene before the target in reading order", { priority: 2 });

  selection.profiles(cast, "in the scene cast; stable profile", 3);
  selection.state(target, relevant, { relevant: 3, unresolved: 4, other: 6 });
  selection.decisions([...relevant], { accepted: 4, proposed: 6 });
  selection.plans(relevant, 4);
  selection.issues(relevant, 4);
  selection.research(relevant, 5);

  if (IMPACT_TASKS.has(request.task)) impact(selection, target, scene);
}

// Later passages and later-starting facts, kept apart from the writer's
// in-scene knowledge so a revision can check what it would disturb.
function impact(selection, target, scene) {
  const options = { priority: 8, section: "impact" };
  for (const later of selection.chronology.readingOrder.slice(scene.position + 1)) {
    selection.addProse(later.sceneId, `later passage in reading order, ${NOT_WRITER_KNOWLEDGE}`, options, {},
      `impact:prose:${later.sceneId}`, "impact-prose");
  }
  for (const entry of factEntries(selection.project)) {
    const record = entry.record;
    if (record.status !== "established" || record["valid-from"] === undefined || record["valid-from"] === "baseline") continue;
    const from = { sceneId: record["valid-from"].scene, beatId: record["valid-from"].beat, side: record["valid-from"].side };
    if (from.beatId === undefined) delete from.beatId;
    if (selection.chronology.compare(from, target) !== "after") continue;
    selection.add({
      id: `impact:${entry.id}`,
      kind: "impact-fact",
      reason: `fact that starts after the cursor in story order, ${NOT_WRITER_KNOWLEDGE}`,
      required: false,
      sources: [recordSource(entry), ...declaredSources(record)],
      content: recordContent(entry)
    }, { ...options, retrieval: entry.id });
  }
}

function projectTask(selection, sceneEntry) {
  const { request, project } = selection;
  const target = request.target;
  const relevant = new Set(request.include);
  if (sceneEntry) {
    selection.sceneRecord(target.sceneId, "the target scene record (scene entry)", { priority: 1, required: true });
    relevant.add(target.sceneId);
  }
  switch (request.task) {
    case "plan": {
      selection.outline(2);
      selection.plans(null, 2);
      selection.profiles(selection.entries((entry) => entry.type === "character").map((entry) => entry.id), "character profile", 3);
      selection.allDecisions({ accepted: 3, proposed: 5 });
      selection.issues(null, 3);
      break;
    }
    case "publish": {
      selection.outline(2);
      for (const entry of selection.entries((item) => item.type === "matter")) selection.addRecord(entry, "front or back matter", { priority: 2 });
      selection.decisions([], { accepted: 3, proposed: 5 });
      selection.issues(null, 3);
      break;
    }
    case "world": {
      const world = selection.entries((entry) => WORLD_TYPES.has(entry.type));
      selection.profiles(world.map((entry) => entry.id), "world entity or term; stable profile", 2);
      const ids = new Set(world.map((entry) => entry.id));
      selection.decisions([...ids], { accepted: 4, proposed: 6 });
      selection.issues(ids, 4);
      break;
    }
    case "memory": {
      if (sceneEntry) {
        selection.state(target, relevant, { relevant: 2, unresolved: 3, other: 2 });
      } else {
        for (const entry of factEntries(project)) {
          if (entry.record.status !== "established") continue;
          const problem = provenanceProblem(project.root, entry);
          if (problem) selection.addRecord(entry, `established but unresolved (${problem.reason}: ${problem.detail})`, { priority: 3 }, "unresolved-fact");
          else selection.factItem(entry, "established fact", 2);
        }
      }
      selection.allDecisions({ accepted: 4, proposed: 6 });
      selection.issues(null, 4);
      break;
    }
    case "research": {
      selection.research(null, 2);
      break;
    }
    case "series": {
      for (const entry of selection.entries((item) => item.type === "series")) selection.addRecord(entry, "series record", { priority: 2 });
      break;
    }
  }
}

// --- reader simulation -----------------------------------------------------

// A first reader gets the prose before the reading boundary and the reader
// reveals that prose has already delivered: established reader-reveal facts
// whose reveal point and every source span end at or before the boundary.
// Never the project contract, outline, profiles, plans or later material.
function readerTask(selection) {
  const { request, order, chronology, project } = selection;
  const target = request.target;
  const scene = order.get(target.sceneId);
  const boundary = readingKeyOf(order, target.sceneId, target.beatId, target.side);
  selection.addProse(target.sceneId, "read so far in the boundary scene; the reading boundary", { priority: 1, required: true },
    { until: { beatId: target.beatId, side: target.side } });
  for (const earlier of chronology.readingOrder.slice(0, scene.position).reverse()) {
    selection.addProse(earlier.sceneId, "read before the reading boundary", { priority: 2 });
  }
  const state = resolveState(project, target, { chronology });
  for (const fact of state.facts) {
    const entry = project.records.get(fact.id);
    if (entry.record.kind !== "reader-reveal" || !revealedBy(order, entry.record, boundary)) continue;
    selection.addRecord(entry, "reader reveal already delivered by prose before the reading boundary", { priority: 3 }, "reveal");
  }
}

function revealedBy(order, record, boundary) {
  const from = record["valid-from"];
  if (from !== undefined && from !== "baseline") {
    const key = readingKeyOf(order, from.scene, from.beat, from.side);
    if (key === null || compareKeys(key, boundary) > 0) return false;
  }
  const sources = record.sources ?? [];
  return sources.every((source) => {
    if (typeof source.scene !== "string") return false;
    const key = readingKeyOf(order, source.scene, source.beat, "after");
    return key !== null && compareKeys(key, boundary) <= 0;
  });
}

/**
 * Selects prioritized candidates for a validated request.
 *
 * @returns {{ candidates: object[], diagnostics: object[], fatal: boolean }}
 */
export function selectCandidates(project, request, chronology) {
  const selection = new Selection(project, request, chronology);
  const sceneEntry = selection.target();
  if (selection.fatal) return selection.finish();
  selection.constraints();
  if (request.audience === "reader") {
    readerTask(selection);
    return selection.finish();
  }
  const projectEntry = selection.projectContract();
  selection.includes();
  if (selection.fatal) return selection.finish();
  if (STYLE_TASKS.has(request.task)) sceneTask(selection, sceneEntry);
  else projectTask(selection, sceneEntry);
  if (STYLE_TASKS.has(request.task)) selection.styles(projectEntry);
  return selection.finish();
}
