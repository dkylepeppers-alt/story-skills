import { isIdReference } from "../project/references.js";
import { resolveState } from "./facts.js";

const PROFILE_TYPES = new Set(["character", "location", "system", "faction", "object"]);
const EPISTEMIC_KINDS = new Set(["knowledge", "belief"]);
const CURSOR_CODES = new Set(["INVALID_CURSOR", "MISSING_SCENE", "MISSING_BEAT"]);

// Candidate signs of temporal history inside a stable profile: a history-style
// heading, a dated or numbered timeline entry, or a phrase that narrates what
// happens later. These are candidates for the agent to inspect, not proof.
const HISTORY_HEADING = /^#{1,6}\s+(?:history|backstory|biography|timeline|later life|fate|future)\b/i;
const DATED_ENTRY = /^\s*(?:[-*+]\s+)?(?:\d{1,4}|year\s+\d+|age\s+\d+|chapter\s+\d+|book\s+\d+)\s*(?:[:\u2013\u2014]|-\s)/i;
const LATER_PHRASE = /\b(?:years later|later in life|eventually|by the end of the (?:story|book|series)|will (?:die|become|betray|learn|lose|marry|kill|leave|discover))\b/i;

function temporalLine(body) {
  const lines = body.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (HISTORY_HEADING.test(line) || DATED_ENTRY.test(line) || LATER_PHRASE.test(line)) {
      return { number: index + 1, text: line.trim() };
    }
  }
  return null;
}

/**
 * Stable profiles should not carry unmarked history (design §6). A profile
 * body that looks like an unsplit biography is flagged so the agent inspects
 * it before using it as spoiler-safe context. `ids` limits the scan.
 */
export function biographyFindings(project, ids) {
  const wanted = ids === undefined ? null : new Set(ids);
  const findings = [];
  const entries = [...project.records.values()]
    .filter((entry) => PROFILE_TYPES.has(entry.type) && (wanted === null || wanted.has(entry.id)))
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  for (const entry of entries) {
    const line = temporalLine(entry.body ?? "");
    if (!line) continue;
    findings.push({
      code: "UNSPLIT_BIOGRAPHY",
      severity: "warning",
      message: `${entry.path}: profile body line ${line.number} looks like temporal history that is not split into facts: "${line.text}"`,
      recordIds: [entry.id],
      sources: [],
      evidence: "candidate",
      action: "Move dated or later events into facts with valid-from cursors, keeping the profile to stable traits."
    });
  }
  return findings;
}

function statementFor(project, value) {
  if (!isIdReference(value)) return null;
  const target = project.records.get(value);
  if (!target || target.type !== "fact") return null;
  const fact = target.record;
  return { id: target.id, status: fact.status, kind: fact.kind, subject: fact.subject, predicate: fact.predicate, value: fact.value };
}

/**
 * What one character knows and believes at a cursor. Knowledge names the
 * statement that is known; knowing it never makes that statement an
 * established world fact. Assertions chronology cannot place are returned in
 * `unresolved`, never guessed.
 */
export function knowledgeAt(project, characterId, cursor, options = {}) {
  const entry = project.records.get(characterId);
  if (!entry || entry.type !== "character") {
    return {
      character: null,
      knows: [],
      believes: [],
      unresolved: [],
      diagnostics: [{
        code: "CHARACTER_NOT_FOUND",
        severity: "error",
        message: `No character with id ${characterId}`,
        recordIds: [characterId],
        sources: [],
        evidence: "structural",
        action: "Check the id with story entity show, or add the character first."
      }]
    };
  }
  const state = resolveState(project, cursor, options);
  const mine = (item) => item.subject === characterId && EPISTEMIC_KINDS.has(item.kind);
  const withStatement = (item) => ({ ...item, statement: statementFor(project, item.value) });
  const facts = state.facts.filter(mine).map(withStatement);
  const unresolved = state.unresolved.filter(mine);
  const relevant = new Set([...facts, ...unresolved].map((item) => item.id));
  const diagnostics = state.diagnostics.filter((item) => CURSOR_CODES.has(item.code)
    || item.recordIds.some((id) => relevant.has(id)));
  diagnostics.push(...biographyFindings(project, [characterId]));
  return {
    character: { id: entry.id, name: entry.record.name ?? entry.record.title ?? "" },
    knows: facts.filter((item) => item.kind === "knowledge"),
    believes: facts.filter((item) => item.kind === "belief"),
    unresolved,
    diagnostics
  };
}
