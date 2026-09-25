import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadProject } from "../src/project/load.js";
import { resolveState } from "../src/state/facts.js";
import { biographyFindings, knowledgeAt } from "../src/state/knowledge.js";
import { PREDICATES, predicateFor, validateFact } from "../src/state/predicates.js";
import { makeKnowledgeFixture, makeProject, setRecordField } from "./support/project.js";

function codes(list) {
  return list.map((item) => item.code);
}

async function factProject() {
  const p = await makeProject();
  await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
  await p.addEntity({ id: "chr_zoe", type: "character", name: "Zoë" });
  await p.addEntity({ id: "obj_brass_key", type: "object", name: "Brass Key" });
  await p.addEntity({ id: "loc_cellar", type: "location", name: "Cellar" });
  await p.addEntity({ id: "fac_watch", type: "faction", name: "Watch" });
  await p.addEntity({ id: "fac_guild", type: "faction", name: "Guild" });
  return p;
}

async function validate(p, fact) {
  await p.addFact({ id: "fact_probe", ...fact });
  const project = await p.load();
  return validateFact(project, project.records.get("fact_probe"));
}

describe("predicate catalog", () => {
  test("defines cardinality and temporal behavior for each consequential predicate", () => {
    const exclusive = ["location", "holder", "availability", "status"];
    const additive = ["injury", "affiliation", "relationship", "knows", "believes"];
    for (const name of exclusive) {
      expect(PREDICATES[name].cardinality).toBe("exclusive");
      expect(PREDICATES[name].ends).toBe("replacement-or-valid-until");
    }
    for (const name of additive) {
      expect(PREDICATES[name].cardinality).toBe("additive");
      expect(PREDICATES[name].ends).toBe("valid-until");
    }
    expect(PREDICATES.knows.kinds).toEqual(["knowledge"]);
    expect(PREDICATES.believes.kinds).toEqual(["belief"]);
    expect(predicateFor("a secret the author noted")).toEqual({
      name: "a secret the author noted",
      catalog: false,
      cardinality: "additive",
      ends: "valid-until"
    });
  });
});

describe("fact validation", () => {
  test("a catalog fact with the right subject, value and kind is valid", async () => {
    const p = await factProject();
    expect(await validate(p, { subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" })).toEqual([]);
  });

  test("the fixture's world, knowledge and belief facts are valid", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    for (const id of ["fact_key_handoff", "fact_ada_learns", "fact_false_belief"]) {
      expect(validateFact(project, project.records.get(id))).toEqual([]);
    }
  });

  test("knowledge and belief use their own predicates and never world predicates", async () => {
    expect(codes(await validate(await factProject(), { kind: "world", subject: "chr_ada", predicate: "knows", value: "the code" })))
      .toEqual(["FACT_KIND_PREDICATE"]);
    expect(codes(await validate(await factProject(), { kind: "knowledge", subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" })))
      .toEqual(["FACT_KIND_PREDICATE"]);
    expect(codes(await validate(await factProject(), { kind: "belief", subject: "chr_ada", predicate: "knows", value: "the code" })))
      .toEqual(["FACT_KIND_PREDICATE"]);
    expect(codes(await validate(await factProject(), { kind: "knowledge", subject: "chr_ada", predicate: "a free claim", value: "x" })))
      .toEqual(["FACT_KIND_PREDICATE"]);
  });

  test("subjects must be records of the predicate's subject types", async () => {
    expect(codes(await validate(await factProject(), { subject: "chr_ada", predicate: "holder", value: "chr_zoe" })))
      .toEqual(["FACT_SUBJECT_INVALID"]);
    expect(codes(await validate(await factProject(), { subject: "the key", predicate: "holder", value: "chr_zoe" })))
      .toEqual(["FACT_SUBJECT_INVALID"]);
    const missing = await validate(await factProject(), { subject: "obj_ghost", predicate: "holder", value: "chr_zoe" });
    expect(codes(missing)).toEqual(["FACT_SUBJECT_INVALID"]);
    expect(missing[0].recordIds).toEqual(["fact_probe", "obj_ghost"]);
  });

  test("values must match the predicate's value type", async () => {
    expect(codes(await validate(await factProject(), { subject: "obj_brass_key", predicate: "holder", value: "Zoë" })))
      .toEqual(["FACT_VALUE_INVALID"]);
    expect(codes(await validate(await factProject(), { subject: "obj_brass_key", predicate: "holder", value: "loc_cellar" })))
      .toEqual(["FACT_VALUE_INVALID"]);
    expect(codes(await validate(await factProject(), { subject: "obj_brass_key", predicate: "availability", value: "misplaced" })))
      .toEqual(["FACT_VALUE_INVALID"]);
    expect(await validate(await factProject(), { subject: "obj_brass_key", predicate: "availability", value: "hidden" })).toEqual([]);
    expect(await validate(await factProject(), { subject: "chr_ada", predicate: "location", value: "loc_cellar" })).toEqual([]);
    expect(await validate(await factProject(), { subject: "chr_ada", predicate: "location", value: "the old mill" })).toEqual([]);
    expect(codes(await validate(await factProject(), { subject: "chr_ada", predicate: "location", value: "chr_zoe" })))
      .toEqual(["FACT_VALUE_INVALID"]);
    expect(codes(await validate(await factProject(), { subject: "chr_ada", predicate: "status", value: "   " })))
      .toEqual(["FACT_VALUE_INVALID"]);
    expect(await validate(await factProject(), { subject: "chr_ada", predicate: "affiliation", value: "fac_watch" })).toEqual([]);
    expect(await validate(await factProject(), { kind: "belief", subject: "chr_ada", predicate: "believes", value: "Zoë is loyal" })).toEqual([]);
  });

  test("a free-text claim is retrievable but is not an executable rule", async () => {
    expect(await validate(await factProject(), { subject: "chr_ada", predicate: "fears", value: "deep water" })).toEqual([]);
    expect(codes(await validate(await factProject(), { subject: " ", predicate: "fears", value: "deep water" })))
      .toEqual(["FACT_SUBJECT_INVALID"]);
    expect(codes(await validate(await factProject(), { subject: "chr_ada", predicate: "fears", value: "" })))
      .toEqual(["FACT_VALUE_INVALID"]);
  });

  test("a reader reveal may state any world predicate but not knowledge or belief", async () => {
    expect(await validate(await factProject(), { kind: "reader-reveal", subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" })).toEqual([]);
    expect(codes(await validate(await factProject(), { kind: "reader-reveal", subject: "chr_ada", predicate: "believes", value: "x" })))
      .toEqual(["FACT_KIND_PREDICATE"]);
  });
});

// Three scenes: scn_one before scn_two before scn_three through after edges,
// and scn_side unordered with all of them. Each has one beat.
async function stateProject() {
  const p = await factProject();
  await p.addScene({ id: "scn_one", title: "One" });
  await p.addScene({ id: "scn_two", title: "Two", chronology: { after: ["scn_one"] } });
  await p.addScene({ id: "scn_three", title: "Three", chronology: { after: ["scn_two"] } });
  await p.addScene({ id: "scn_side", title: "Side" });
  let chapter = p.read("chapters/one.md");
  for (const id of ["scn_one", "scn_two", "scn_three", "scn_side"]) {
    const marker = `<!-- story-scene: ${id} -->\n`;
    chapter = chapter.replace(marker, `${marker}<!-- story-beat: beat_${id.slice(4)} -->\nSomething happens in ${id}.\n`);
  }
  p.write("chapters/one.md", chapter);
  return p;
}

function sourced(p, sceneId, fact) {
  return { ...fact, sources: [p.source(sceneId)] };
}

function ids(list) {
  return list.map((item) => item.id);
}

describe("resolveState", () => {
  test("learning inside a scene respects its beat boundary", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    const before = resolveState(project, p.cursor("scn_cellar", "beat_confession", "before"));
    const after = resolveState(project, p.cursor("scn_cellar", "beat_confession", "after"));
    expect(before.facts.map((f) => f.id)).not.toContain("fact_ada_learns");
    expect(after.facts.map((f) => f.id)).toContain("fact_ada_learns");
    expect(after.facts.find((f) => f.id === "fact_false_belief").kind).toBe("belief");
    expect(before.facts.map((f) => f.id)).toEqual(["fact_false_belief", "fact_key_handoff"]);
    expect(resolveState(project, p.entry("scn_cellar")).facts).toEqual([]);
  });

  test("baseline facts apply everywhere and valid-until is exclusive", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_home", subject: "chr_ada", predicate: "status", value: "alive", "valid-from": "baseline" }));
    await p.addFact(sourced(p, "scn_one", {
      id: "fact_hurt",
      subject: "chr_ada",
      predicate: "injury",
      value: "a cut hand",
      "valid-from": { scene: "scn_one", side: "after" },
      "valid-until": { scene: "scn_three", side: "before" }
    }));
    const project = await p.load();
    expect(ids(resolveState(project, p.entry("scn_one")).facts)).toEqual(["fact_home"]);
    expect(ids(resolveState(project, p.exit("scn_two")).facts)).toEqual(["fact_home", "fact_hurt"]);
    expect(ids(resolveState(project, p.entry("scn_three")).facts)).toEqual(["fact_home"]);
    const baseline = resolveState(project, p.entry("scn_side"));
    expect(ids(baseline.facts)).toEqual(["fact_home"]);
    expect(baseline.unresolved.map((item) => [item.id, item.reason])).toEqual([["fact_hurt", "UNORDERED"]]);
  });

  test("proposals, retracted and superseded facts and work/ are not established state", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_proposed", status: "proposed", subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_retracted", status: "retracted", subject: "obj_brass_key", predicate: "holder", value: "chr_ada" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_superseded", status: "superseded", subject: "chr_ada", predicate: "location", value: "loc_cellar" }));
    await p.addFact(sourced(p, "scn_one", {
      id: "fact_knows_proposal",
      kind: "knowledge",
      subject: "chr_ada",
      predicate: "knows",
      value: "fact_proposed"
    }));
    p.write("work/facts/fact_exploration.md", p.read("facts/fact_proposed.md")
      .replace("id: fact_proposed", "id: fact_exploration")
      .replace("status: proposed", "status: established"));
    const state = resolveState(await p.load(), p.exit("scn_three"));
    expect(ids(state.facts)).toEqual(["fact_knows_proposal"]);
    expect(state.unresolved).toEqual([]);
    expect(state.conflicts).toEqual([]);
  });

  test("a fact without provenance, with a stale hash, or with an unreadable source is unresolved", async () => {
    const p = await stateProject();
    await p.addFact({ id: "fact_unsourced", subject: "chr_ada", predicate: "status", value: "alive" });
    await p.addFact({ id: "fact_empty_sources", subject: "chr_zoe", predicate: "status", value: "alive", sources: [] });
    await p.addFact(sourced(p, "scn_two", { id: "fact_stale", subject: "chr_ada", predicate: "injury", value: "a burn" }));
    await p.addFact({
      id: "fact_gone",
      subject: "chr_ada",
      predicate: "injury",
      value: "a bruise",
      sources: [{ path: "chapters/missing.md", hash: "a".repeat(64), kind: "manuscript" }]
    });
    await p.addFact({
      id: "fact_decided",
      subject: "chr_zoe",
      predicate: "injury",
      value: "a limp",
      sources: [{ path: "story.md", hash: p.hash("story.md"), kind: "author-decision" }]
    });
    p.write("chapters/one.md", p.read("chapters/one.md").replace("Something happens in scn_two.", "Something else happens in scn_two."));
    const state = resolveState(await p.load(), p.exit("scn_three"));
    expect(ids(state.facts)).toEqual(["fact_decided"]);
    expect(state.unresolved.map((item) => [item.id, item.reason])).toEqual([
      ["fact_empty_sources", "MISSING_PROVENANCE"],
      ["fact_gone", "SOURCE_UNREADABLE"],
      ["fact_stale", "SOURCE_STALE"],
      ["fact_unsourced", "MISSING_PROVENANCE"]
    ]);
    const stale = state.diagnostics.find((item) => item.code === "SOURCE_STALE");
    expect(stale.severity).toBe("warning");
    expect(stale.recordIds).toEqual(["fact_stale"]);
    expect(stale.sources[0].path).toBe("chapters/one.md");
  });

  test("two simultaneous holders are a visible conflict", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_ada_holds", subject: "obj_brass_key", predicate: "holder", value: "chr_ada" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_zoe_holds", subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_zoe_again", subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" }));
    const state = resolveState(await p.load(), p.exit("scn_one"));
    expect(ids(state.facts)).toEqual(["fact_ada_holds", "fact_zoe_again", "fact_zoe_holds"]);
    expect(state.conflicts).toEqual([{
      code: "STATE_CONFLICT",
      subject: "obj_brass_key",
      predicate: "holder",
      factIds: ["fact_ada_holds", "fact_zoe_again", "fact_zoe_holds"],
      values: ["chr_ada", "chr_zoe"]
    }]);
    const diagnostic = state.diagnostics.find((item) => item.code === "STATE_CONFLICT");
    expect(diagnostic.severity).toBe("error");
    expect(diagnostic.recordIds).toEqual(["obj_brass_key", "fact_ada_holds", "fact_zoe_again", "fact_zoe_holds"]);
  });

  test("conflicts are ordered by subject, then predicate", async () => {
    const p = await stateProject();
    const pairs = [
      ["obj_brass_key", "holder", "chr_ada", "chr_zoe"],
      ["chr_ada", "status", "alive", "missing"],
      ["chr_ada", "location", "loc_cellar", "the pier"]
    ];
    for (const [subject, predicate, first, second] of pairs) {
      await p.addFact(sourced(p, "scn_one", { id: `fact_${subject}_${predicate}_1`, subject, predicate, value: first }));
      await p.addFact(sourced(p, "scn_one", { id: `fact_${subject}_${predicate}_2`, subject, predicate, value: second }));
    }
    const state = resolveState(await p.load(), p.exit("scn_one"));
    expect(state.conflicts.map((item) => `${item.subject} ${item.predicate}`)).toEqual([
      "chr_ada location",
      "chr_ada status",
      "obj_brass_key holder"
    ]);
  });

  test("a later exclusive assertion replaces an earlier one only when chronology orders them", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_ada_holds", subject: "obj_brass_key", predicate: "holder", value: "chr_ada", "valid-from": "baseline" }));
    await p.addFact(sourced(p, "scn_two", {
      id: "fact_zoe_holds",
      subject: "obj_brass_key",
      predicate: "holder",
      value: "chr_zoe",
      "valid-from": { scene: "scn_two", beat: "beat_two", side: "after" },
      "valid-until": { scene: "scn_three", side: "before" }
    }));
    const project = await p.load();
    expect(ids(resolveState(project, p.exit("scn_one")).facts)).toEqual(["fact_ada_holds"]);
    const during = resolveState(project, p.exit("scn_two"));
    expect(ids(during.facts)).toEqual(["fact_zoe_holds"]);
    expect(during.conflicts).toEqual([]);
    // Zoë's hold ended; Ada's earlier hold is not silently revived.
    const later = resolveState(project, p.exit("scn_three"));
    expect(later.facts).toEqual([]);
    expect(later.unresolved).toEqual([]);
    // Chronology cannot place scn_side against Zoë's hold.
    const side = resolveState(project, p.exit("scn_side"));
    expect(side.facts).toEqual([]);
    expect(side.unresolved.map((item) => [item.id, item.reason])).toEqual([
      ["fact_ada_holds", "MAY_BE_REPLACED"],
      ["fact_zoe_holds", "UNORDERED"]
    ]);
    expect(side.unresolved[0].detail).toContain("fact_zoe_holds");
  });

  test("exclusive assertions with unordered starts cannot replace each other", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_one", subject: "chr_ada", predicate: "location", value: "loc_cellar", "valid-from": { scene: "scn_one", side: "after" } }));
    await p.addFact(sourced(p, "scn_side", {
      id: "fact_side",
      subject: "chr_ada",
      predicate: "location",
      value: "the pier",
      "valid-from": { scene: "scn_side", side: "before" },
      "valid-until": { scene: "scn_side", side: "after" }
    }));
    await p.addScene({ id: "scn_join", title: "Join", chronology: { after: ["scn_three", "scn_side"] } });
    const project = await p.load();
    const joined = resolveState(project, p.exit("scn_join"));
    expect(joined.facts).toEqual([]);
    expect(joined.unresolved.map((item) => [item.id, item.reason])).toEqual([["fact_one", "MAY_BE_REPLACED"]]);
    // Inside scn_side, Ada's cellar location may have started after the pier
    // one, so neither is certain.
    const inside = resolveState(project, p.cursor("scn_side", "beat_side", "after"));
    expect(inside.facts).toEqual([]);
    expect(inside.unresolved.map((item) => [item.id, item.reason])).toEqual([
      ["fact_one", "UNORDERED"],
      ["fact_side", "MAY_BE_REPLACED"]
    ]);
  });

  test("additive assertions coexist", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_watch", subject: "chr_ada", predicate: "affiliation", value: "fac_watch" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_guild", subject: "chr_ada", predicate: "affiliation", value: "fac_guild" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_claim", subject: "chr_ada", predicate: "fears", value: "deep water" }));
    const state = resolveState(await p.load(), p.exit("scn_one"));
    expect(ids(state.facts)).toEqual(["fact_claim", "fact_guild", "fact_watch"]);
    expect(state.facts.find((f) => f.id === "fact_claim").catalog).toBe(false);
    expect(state.facts.find((f) => f.id === "fact_watch").catalog).toBe(true);
    expect(state.conflicts).toEqual([]);
  });

  test("beliefs, knowledge and reader reveals never conflict with world facts", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_world", subject: "obj_brass_key", predicate: "holder", value: "chr_zoe" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_reveal", kind: "reader-reveal", subject: "obj_brass_key", predicate: "holder", value: "chr_ada" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_belief", kind: "belief", subject: "chr_ada", predicate: "believes", value: "Ada holds the key" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_doubt", kind: "belief", subject: "chr_ada", predicate: "believes", value: "Nobody holds the key" }));
    const state = resolveState(await p.load(), p.exit("scn_one"));
    expect(state.facts.map((f) => [f.id, f.kind])).toEqual([
      ["fact_belief", "belief"],
      ["fact_doubt", "belief"],
      ["fact_reveal", "reader-reveal"],
      ["fact_world", "world"]
    ]);
    expect(state.conflicts).toEqual([]);
  });

  test("an invalid fact is reported and kept out of state", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_bad", subject: "chr_ada", predicate: "holder", value: "chr_zoe" }));
    const state = resolveState(await p.load(), p.exit("scn_one"));
    expect(state.facts).toEqual([]);
    expect(state.unresolved.map((item) => [item.id, item.reason])).toEqual([["fact_bad", "FACT_INVALID"]]);
    expect(codes(state.diagnostics)).toEqual(["FACT_SUBJECT_INVALID"]);
  });

  test("a cursor chronology cannot read leaves every placed fact unresolved", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_home", subject: "chr_ada", predicate: "status", value: "alive" }));
    await p.addFact(sourced(p, "scn_one", { id: "fact_later", subject: "chr_zoe", predicate: "status", value: "alive", "valid-from": { scene: "scn_one", side: "after" } }));
    const project = await p.load();
    const missing = resolveState(project, p.exit("scn_ghost"));
    expect(ids(missing.facts)).toEqual(["fact_home"]);
    expect(missing.unresolved.map((item) => item.id)).toEqual(["fact_later"]);
    expect(codes(missing.diagnostics)).toContain("MISSING_SCENE");
    const invalid = resolveState(project, { sceneId: "scn_one", side: "beside" });
    expect(invalid.facts).toEqual([]);
    expect(codes(invalid.diagnostics)).toEqual(["INVALID_CURSOR"]);
    expect(invalid.unresolved.map((item) => item.reason)).toEqual(["UNORDERED", "UNORDERED"]);
  });

  test("a historical revision resolves its own record set", async () => {
    const p = await makeKnowledgeFixture();
    const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), "story-revision-"));
    fs.cpSync(p.root, snapshot, { recursive: true });
    await setRecordField(p.root, "fact_key_handoff", "status", "retracted");
    const at = p.exit("scn_cellar");
    expect(ids(resolveState(await p.load(), at).facts)).toEqual(["fact_ada_learns", "fact_false_belief"]);
    expect(ids(resolveState(await loadProject(snapshot), at).facts))
      .toEqual(["fact_ada_learns", "fact_false_belief", "fact_key_handoff"]);
    fs.rmSync(snapshot, { recursive: true, force: true });
  });
});

describe("character knowledge", () => {
  test("knowledge and belief follow the beat boundary and name the known statement", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    const before = knowledgeAt(project, "chr_ada", p.cursor("scn_cellar", "beat_confession", "before"));
    expect(before.knows).toEqual([]);
    expect(before.believes.map((item) => [item.id, item.value])).toEqual([["fact_false_belief", "The brass key is lost"]]);
    const after = knowledgeAt(project, "chr_ada", p.cursor("scn_cellar", "beat_confession", "after"));
    expect(after.character).toEqual({ id: "chr_ada", name: "Ada Quill" });
    expect(after.knows.map((item) => item.id)).toEqual(["fact_ada_learns"]);
    expect(after.knows[0].statement).toEqual({
      id: "fact_key_handoff",
      status: "established",
      kind: "world",
      subject: "obj_brass_key",
      predicate: "holder",
      value: "chr_zoe"
    });
    expect(after.believes.map((item) => item.id)).toEqual(["fact_false_belief"]);
    expect(after.unresolved).toEqual([]);
    expect(after.diagnostics).toEqual([]);
    expect(knowledgeAt(project, "chr_zoe", p.exit("scn_cellar")).knows).toEqual([]);
  });

  test("knowing a statement does not establish it as world truth", async () => {
    const p = await makeKnowledgeFixture();
    await setRecordField(p.root, "fact_key_handoff", "status", "retracted");
    const project = await p.load();
    const known = knowledgeAt(project, "chr_ada", p.exit("scn_cellar"));
    expect(known.knows[0].statement.status).toBe("retracted");
    expect(resolveState(project, p.exit("scn_cellar")).facts.map((f) => f.id)).not.toContain("fact_key_handoff");
  });

  test("text knowledge has no statement record and unordered knowledge is unresolved", async () => {
    const p = await stateProject();
    await p.addFact(sourced(p, "scn_one", { id: "fact_code", kind: "knowledge", subject: "chr_ada", predicate: "knows", value: "the vault code" }));
    await p.addFact(sourced(p, "scn_side", {
      id: "fact_side_secret",
      kind: "knowledge",
      subject: "chr_ada",
      predicate: "knows",
      value: "the tide schedule",
      "valid-from": { scene: "scn_side", side: "after" }
    }));
    const known = knowledgeAt(await p.load(), "chr_ada", p.exit("scn_two"));
    expect(known.knows.map((item) => [item.id, item.statement])).toEqual([["fact_code", null]]);
    expect(known.unresolved.map((item) => [item.id, item.reason])).toEqual([["fact_side_secret", "UNORDERED"]]);
  });

  test("stale knowledge evidence and an unreadable cursor are reported with the knowledge", async () => {
    const p = await makeKnowledgeFixture();
    p.write("chapters/one.md", p.read("chapters/one.md").replace("“I took it,” Zoë says.", "“I took it,” Zoë whispers."));
    const project = await p.load();
    const stale = knowledgeAt(project, "chr_ada", p.exit("scn_cellar"));
    expect(stale.knows).toEqual([]);
    expect(stale.unresolved.map((item) => [item.id, item.reason])).toEqual([["fact_ada_learns", "SOURCE_STALE"]]);
    expect(codes(stale.diagnostics)).toEqual(["SOURCE_STALE"]);
    const lost = knowledgeAt(project, "chr_ada", p.exit("scn_nowhere"));
    expect(codes(lost.diagnostics)).toEqual(["SOURCE_STALE", "MISSING_SCENE"]);
  });

  test("an unknown character or a non-character id is an error finding", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    for (const id of ["chr_nobody", "obj_brass_key"]) {
      const result = knowledgeAt(project, id, p.exit("scn_cellar"));
      expect(result.character).toBeNull();
      expect(result.knows).toEqual([]);
      expect(codes(result.diagnostics)).toEqual(["CHARACTER_NOT_FOUND"]);
    }
  });
});

describe("unsplit biographies", () => {
  test("a profile with unclassified temporal history is flagged for inspection", async () => {
    const p = await makeKnowledgeFixture();
    p.write("characters/chr_ada.md", `${p.read("characters/chr_ada.md")}Ada is tall and careful.\n\n## History\n\n- 1840: born in the harbor town\n`);
    p.write("characters/chr_zoe.md", `${p.read("characters/chr_zoe.md")}Zoë keeps secrets.\nYears later she will betray the guild.\n`);
    await p.addEntity({ id: "loc_mill", type: "location", name: "Mill" });
    p.write("worldbuilding/loc_mill.md", `${p.read("worldbuilding/loc_mill.md")}- Year 3: the mill burns down\n`);
    await p.addEntity({ id: "chr_plain", type: "character", name: "Plain" });
    p.write("characters/chr_plain.md", `${p.read("characters/chr_plain.md")}Plain has grey eyes and a quiet laugh.\n`);
    const project = await p.load();
    const findings = biographyFindings(project);
    expect(findings.map((item) => item.recordIds[0])).toEqual(["chr_ada", "chr_zoe", "loc_mill"]);
    expect(findings.every((item) => item.code === "UNSPLIT_BIOGRAPHY" && item.severity === "warning" && item.evidence === "candidate")).toBe(true);
    expect(findings[0].message).toContain("line 3");
    expect(findings[1].message).toContain("Years later she will betray the guild.");
    const known = knowledgeAt(project, "chr_zoe", p.exit("scn_cellar"));
    expect(codes(known.diagnostics)).toEqual(["UNSPLIT_BIOGRAPHY"]);
    expect(biographyFindings(project, ["chr_plain"])).toEqual([]);
  });
});
