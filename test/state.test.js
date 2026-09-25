import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { loadProject } from "../src/project/load.js";
import { resolveState } from "../src/state/facts.js";
import { biographyFindings, knowledgeAt } from "../src/state/knowledge.js";
import { PREDICATES, predicateFor, validateFact } from "../src/state/predicates.js";
import { makeTempDir, memoryIo } from "./helpers.js";
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
    expect(ids(resolveState(await p.load(), at).facts)).toEqual(["fact_ada_learns", "fact_false_belief", "fact_later_reveal"]);
    expect(ids(resolveState(await loadProject(snapshot), at).facts))
      .toEqual(["fact_ada_learns", "fact_false_belief", "fact_key_handoff", "fact_later_reveal"]);
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

function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

function json(cwd, argv) {
  const result = invoke(cwd, [...argv, "--format", "json"]);
  expect(result.out.includes("\n")).toBe(false);
  return { ...result, parsed: JSON.parse(result.out) };
}

function writeData(p, name, data) {
  const file = path.join(p.root, "..", `${path.basename(p.root)}-${name}.json`);
  fs.writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data));
  return file;
}

function files(root) {
  const found = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".story") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else found[path.relative(root, full)] = fs.readFileSync(full, "utf8");
    }
  };
  walk(root);
  return found;
}

describe("fact add", () => {
  test("adds a schema-validated fact and hashes the named source span", async () => {
    const p = await makeKnowledgeFixture();
    const data = writeData(p, "zoe-location", {
      id: "fact_zoe_cellar",
      status: "established",
      kind: "world",
      subject: "chr_zoe",
      predicate: "location",
      value: "the cellar",
      "valid-from": { scene: "scn_cellar", side: "before" },
      sources: [{ path: "chapters/one.md", scene: "scn_cellar", beat: "beat_handoff", kind: "manuscript" }]
    });
    const result = json(p.root, ["fact", "add", "--data", data]);
    expect(result.code).toBe(0);
    expect(result.parsed.ok).toBe(true);
    expect(result.parsed.command).toBe("fact add");
    expect(result.parsed.data).toMatchObject({ id: "fact_zoe_cellar", path: "facts/fact_zoe_cellar.md", dryRun: false });
    expect(result.parsed.writes).toEqual([{ path: "facts/fact_zoe_cellar.md", action: "create", expectedHash: null }]);
    const project = await p.load();
    expect(project.diagnostics).toEqual([]);
    const stored = project.records.get("fact_zoe_cellar").record;
    expect(stored.sources[0].hash).toBe(p.source("scn_cellar", "beat_handoff").hash);
    expect(stored.format).toBe("story-toolkit");
    expect(resolveState(project, p.exit("scn_cellar")).facts.map((f) => f.id)).toContain("fact_zoe_cellar");
  });

  test("allocates an id, previews with --dry-run, and warns when an established fact has no sources", async () => {
    const p = await makeKnowledgeFixture();
    const before = files(p.root);
    const data = writeData(p, "unsourced", { status: "established", kind: "world", subject: "chr_ada", predicate: "status", value: "alive" });
    const preview = json(p.root, ["fact", "add", "--data", data, "--dry-run"]);
    expect(preview.code).toBe(0);
    expect(preview.parsed.data.dryRun).toBe(true);
    expect(preview.parsed.data.id).toMatch(/^fact_[0-9a-f]{8}$/);
    expect(preview.parsed.diagnostics.map((item) => [item.code, item.severity])).toEqual([["MISSING_PROVENANCE", "warning"]]);
    expect(files(p.root)).toEqual(before);
    const added = invoke(p.root, ["fact", "add", "--data", data]);
    expect(added.code).toBe(0);
    expect(added.out).toMatch(/^Added fact fact_[0-9a-f]{8}: facts\/fact_[0-9a-f]{8}\.md\n$/);
  });

  test("an unreadable, malformed or schema-invalid --data file is an invalid invocation", async () => {
    const p = await makeKnowledgeFixture();
    const before = files(p.root);
    const cases = [
      path.join(p.root, "..", "missing-data.json"),
      writeData(p, "broken", "{ not json"),
      writeData(p, "array", "[]"),
      writeData(p, "rumor", { status: "established", kind: "rumor", subject: "chr_ada", predicate: "status", value: "alive" }),
      writeData(p, "retracted", { status: "retracted", kind: "world", subject: "chr_ada", predicate: "status", value: "alive" }),
      writeData(p, "decision", { type: "decision", status: "established", kind: "world", subject: "chr_ada", predicate: "status", value: "alive" }),
      writeData(p, "bad-id", { id: "Fact Bad", status: "established", kind: "world", subject: "chr_ada", predicate: "status", value: "alive" })
    ];
    for (const data of cases) {
      const result = json(p.root, ["fact", "add", "--data", data]);
      expect(result.code).toBe(2);
      expect(result.parsed.ok).toBe(false);
      expect(result.parsed.writes).toEqual([]);
    }
    expect(invoke(p.root, ["fact", "add"]).code).toBe(2);
    expect(files(p.root)).toEqual(before);
  });

  test("a duplicate id, a catalog violation, a dangling reference or unreadable evidence writes nothing and exits 1", async () => {
    const p = await makeKnowledgeFixture();
    const before = files(p.root);
    const base = { status: "established", kind: "world", subject: "obj_brass_key", predicate: "holder", value: "chr_ada" };
    const cases = [
      [{ ...base, id: "fact_key_handoff" }, "DUPLICATE_RECORD_ID"],
      [{ ...base, subject: "chr_ada" }, "FACT_SUBJECT_INVALID"],
      [{ ...base, "valid-from": { scene: "scn_ghost", side: "after" } }, "DANGLING_REFERENCE"],
      [{ ...base, sources: [{ path: "chapters/one.md", scene: "scn_ghost", kind: "manuscript" }] }, "SOURCE_UNREADABLE"]
    ];
    for (const [data, code] of cases) {
      const result = json(p.root, ["fact", "add", "--data", writeData(p, code, data)]);
      expect(result.code).toBe(1);
      expect(result.parsed.diagnostics.map((item) => item.code)).toContain(code);
      expect(result.parsed.writes).toEqual([]);
    }
    expect(files(p.root)).toEqual(before);
  });

  test("a supplied source hash that no longer matches the evidence is stale", async () => {
    const p = await makeKnowledgeFixture();
    const data = writeData(p, "stale", {
      status: "established",
      kind: "world",
      subject: "obj_brass_key",
      predicate: "holder",
      value: "chr_ada",
      sources: [{ path: "chapters/one.md", scene: "scn_cellar", hash: "0".repeat(64), kind: "manuscript" }]
    });
    const result = json(p.root, ["fact", "add", "--data", data]);
    expect(result.code).toBe(3);
    expect(result.parsed.diagnostics[0].code).toBe("STALE_SOURCE");
  });

  test("a missing project fails the same way in text and JSON", async () => {
    const cwd = makeTempDir();
    const data = path.join(cwd, "data.json");
    fs.writeFileSync(data, "{}");
    const text = invoke(cwd, ["fact", "add", "--data", data]);
    const result = json(cwd, ["fact", "add", "--data", data]);
    expect(text.code).toBe(2);
    expect(result.code).toBe(2);
    expect(result.parsed.diagnostics[0].code).toBe("PROJECT_NOT_FOUND");
  });
});

describe("fact list", () => {
  async function listProject() {
    const p = await makeKnowledgeFixture();
    await p.addFact({ id: "fact_old", status: "superseded", subject: "chr_zoe", predicate: "status", value: "alive", sources: [p.source("scn_cellar")] });
    await p.addFact({ id: "fact_idea", status: "proposed", subject: "chr_zoe", predicate: "status", value: "missing", sources: [p.source("scn_cellar")] });
    p.write("work/facts/fact_draft.md", p.read("facts/fact_idea.md").replace("id: fact_idea", "id: fact_draft"));
    p.write("work/notes.md", "No frontmatter here.\n");
    p.write("work/story-note.md", "---\ntitle: A note\n---\nNot a fact.\n");
    return p;
  }

  test("lists established facts, and inactive or work/ records only when asked", async () => {
    const p = await listProject();
    const plain = json(p.root, ["fact", "list"]);
    expect(plain.code).toBe(0);
    expect(plain.parsed.data.facts.map((f) => f.id)).toEqual(["fact_ada_learns", "fact_false_belief", "fact_key_handoff", "fact_later_reveal"]);
    const all = json(p.root, ["fact", "list", "--include-inactive", "--include-work"]);
    expect(all.parsed.data.facts.map((f) => [f.id, f.status, f.active, f.location])).toEqual([
      ["fact_ada_learns", "established", true, "facts"],
      ["fact_false_belief", "established", true, "facts"],
      ["fact_idea", "proposed", false, "facts"],
      ["fact_key_handoff", "established", true, "facts"],
      ["fact_later_reveal", "established", true, "facts"],
      ["fact_old", "superseded", false, "facts"],
      ["fact_draft", "proposed", false, "work"]
    ]);
    const text = invoke(p.root, ["fact", "list", "--include-inactive"]);
    expect(text.out).toContain("- fact_old [superseded world] chr_zoe status alive (inactive)\n");
    expect(text.out).toContain("- fact_key_handoff [established world] obj_brass_key holder chr_zoe\n");
    const empty = await makeProject();
    expect(invoke(empty.root, ["fact", "list"]).out).toBe("Facts:\n- None\n");
    expect(invoke(empty.root, ["fact", "list", "--include-work"]).out).toBe("Facts:\n- None\n");
  });

  test("at a scene cursor, applicability is explicit and inactive records are not revived", async () => {
    const p = await listProject();
    const at = json(p.root, ["fact", "list", "--scene", "scn_cellar", "--beat", "beat_confession", "--side", "before", "--include-inactive", "--include-work"]);
    expect(at.code).toBe(0);
    expect(at.parsed.data.cursor).toEqual({ sceneId: "scn_cellar", beatId: "beat_confession", side: "before" });
    expect(at.parsed.data.facts.map((f) => [f.id, f.applies])).toEqual([
      ["fact_ada_learns", false],
      ["fact_false_belief", true],
      ["fact_idea", false],
      ["fact_key_handoff", true],
      ["fact_later_reveal", false],
      ["fact_old", false],
      ["fact_draft", false]
    ]);
    const entry = invoke(p.root, ["fact", "list", "--scene", "scn_cellar"]);
    expect(entry.out).toContain("Facts at scn_cellar (before):\n");
    expect(entry.out).toContain("- fact_key_handoff [established world] obj_brass_key holder chr_zoe (applies: no)\n");
    const exit = invoke(p.root, ["fact", "list", "--scene", "scn_cellar", "--side", "after"]);
    expect(exit.out).toContain("(applies: yes)");
  });

  test("unresolved facts and conflicts at a cursor are reported", async () => {
    const p = await listProject();
    await p.addFact({ id: "fact_ada_holds", subject: "obj_brass_key", predicate: "holder", value: "chr_ada", "valid-from": { scene: "scn_cellar", beat: "beat_handoff", side: "after" }, sources: [p.source("scn_cellar")] });
    await p.addFact({ id: "fact_unsourced", subject: "chr_ada", predicate: "status", value: "alive" });
    const result = json(p.root, ["fact", "list", "--scene", "scn_cellar", "--side", "after"]);
    expect(result.code).toBe(1);
    expect(result.parsed.data.conflicts.map((item) => item.factIds)).toEqual([["fact_ada_holds", "fact_key_handoff"]]);
    expect(result.parsed.data.facts.find((f) => f.id === "fact_unsourced")).toMatchObject({ applies: "unresolved", reason: "MISSING_PROVENANCE" });
    const text = invoke(p.root, ["fact", "list", "--scene", "scn_cellar", "--side", "after"]);
    expect(text.code).toBe(1);
    expect(text.err).toContain("(applies: unresolved, MISSING_PROVENANCE)");
    expect(text.err).toContain("Conflicts:\n- obj_brass_key holder: chr_ada, chr_zoe (fact_ada_holds, fact_key_handoff)\n");
    expect(text.err).toContain("warning MISSING_PROVENANCE");
  });

  test("--beat or --side without --scene is an invalid invocation", async () => {
    const p = await listProject();
    expect(json(p.root, ["fact", "list", "--beat", "beat_confession"]).code).toBe(2);
    expect(json(p.root, ["fact", "list", "--side", "after"]).code).toBe(2);
    expect(invoke(p.root, ["fact", "list", "--side", "sideways", "--scene", "scn_cellar"]).code).toBe(2);
  });
});

describe("fact retract", () => {
  test("retracts an established fact through a hash-checked replacement", async () => {
    const p = await makeKnowledgeFixture();
    const original = p.read("facts/fact_key_handoff.md");
    const preview = json(p.root, ["fact", "retract", "fact_key_handoff", "--dry-run"]);
    expect(preview.code).toBe(0);
    expect(preview.parsed.writes).toEqual([{ path: "facts/fact_key_handoff.md", action: "replace", expectedHash: p.hash("facts/fact_key_handoff.md") }]);
    expect(p.read("facts/fact_key_handoff.md")).toBe(original);
    const done = invoke(p.root, ["fact", "retract", "fact_key_handoff"]);
    expect(done.code).toBe(0);
    expect(done.out).toBe("Retracted fact fact_key_handoff: facts/fact_key_handoff.md\n");
    expect(p.read("facts/fact_key_handoff.md")).toBe(original.replace("status: established", "status: retracted"));
    const project = await p.load();
    expect(resolveState(project, p.exit("scn_cellar")).facts.map((f) => f.id)).not.toContain("fact_key_handoff");
  });

  test("a retracted fact cannot be retracted again and an unknown id is not a fact", async () => {
    const p = await makeKnowledgeFixture();
    expect(invoke(p.root, ["fact", "retract", "fact_key_handoff"]).code).toBe(0);
    const again = json(p.root, ["fact", "retract", "fact_key_handoff"]);
    expect(again.code).toBe(1);
    expect(again.parsed.diagnostics[0].code).toBe("FACT_TRANSITION_INVALID");
    for (const id of ["fact_nobody", "chr_ada"]) {
      const missing = json(p.root, ["fact", "retract", id]);
      expect(missing.code).toBe(1);
      expect(missing.parsed.diagnostics[0].code).toBe("FACT_NOT_FOUND");
    }
    expect(invoke(p.root, ["fact", "retract"]).code).toBe(2);
  });

  test("a blocking load error stops fact mutations before any write", async () => {
    const p = await makeKnowledgeFixture();
    p.write("facts/broken.md", "---\nformat: story-toolkit\nschema-version: 1\nid: fact_broken\ntype: fact\n---\n");
    const before = files(p.root);
    expect(json(p.root, ["fact", "retract", "fact_key_handoff"]).code).toBe(2);
    const data = writeData(p, "blocked", { status: "established", kind: "world", subject: "chr_ada", predicate: "status", value: "alive" });
    expect(json(p.root, ["fact", "add", "--data", data]).code).toBe(2);
    expect(files(p.root)).toEqual(before);
  });

  test("a held project lock stops fact mutations with the stale exit code", async () => {
    const p = await makeKnowledgeFixture();
    p.write(".story/lock", "{}\n");
    const before = files(p.root);
    const retract = json(p.root, ["fact", "retract", "fact_key_handoff"]);
    expect([retract.code, retract.parsed.diagnostics[0].code]).toEqual([3, "LOCKED"]);
    const data = writeData(p, "locked", { status: "established", kind: "world", subject: "chr_ada", predicate: "status", value: "alive", sources: [p.source("scn_cellar")] });
    const add = json(p.root, ["fact", "add", "--data", data]);
    expect([add.code, add.parsed.diagnostics[0].code]).toEqual([3, "LOCKED"]);
    expect(files(p.root)).toEqual(before);
  });
});
