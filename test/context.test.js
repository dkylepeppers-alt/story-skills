import { describe, expect, test } from "bun:test";
import { DEFAULT_MAX_BYTES, TASKS, buildContext, validateRequest } from "../src/context/build.js";
import { packetBytes } from "../src/context/budget.js";
import { makeKnowledgeFixture, makeProject } from "./support/project.js";

function ids(list) {
  return list.map((item) => item.id);
}

function kinds(list) {
  return [...new Set(list.map((item) => item.kind))].sort();
}

// The knowledge fixture plus linked plans, decisions, issues, research, a
// style source, and a later scene with a later fact.
async function contextFixture() {
  const p = await makeKnowledgeFixture();
  p.write("characters/chr_zoe.md", `${p.read("characters/chr_zoe.md")}A quiet locksmith with ink-stained hands.\n`);
  await p.addScene({ id: "scn_morning", title: "Morning", cast: ["chr_ada"], chronology: { after: ["scn_cellar"] } });
  p.write("chapters/one.md", `${p.read("chapters/one.md")}By morning the key is gone from Zoë's coat.\n`);
  await p.addEntity({ id: "arc_trust", type: "arc", name: "Trust", sources: [p.source("scn_cellar")] });
  await p.addEntity({ id: "que_thief", type: "question", name: "Who took the key?" });
  await p.addFact({
    id: "fact_key_gone",
    subject: "obj_brass_key",
    predicate: "availability",
    value: "lost",
    "valid-from": { scene: "scn_morning", side: "after" },
    sources: [p.source("scn_morning")]
  });
  await p.addDecision({ id: "dec_tense", "scope-ids": ["prj_00000001"], rationale: "Past tense throughout." });
  await p.addDecision({ id: "dec_cellar_dark", "scope-ids": ["scn_cellar"], rationale: "The cellar is lit only by the lantern." });
  await p.addDecision({ id: "dec_zoe_limp", status: "proposed", "scope-ids": ["chr_zoe"], rationale: "Maybe Zoë limps." });
  await p.addDecision({ id: "dec_pier", "scope-ids": ["scn_morning"], rationale: "Not about the cellar." });
  await p.addIssue({ id: "issue_zoe_eyes", "affected-ids": ["chr_zoe"], evidence: [p.fileSource("characters/chr_zoe.md")] });
  await p.addIssue({ id: "issue_done", status: "resolved", "affected-ids": ["chr_zoe"] });
  p.write("research/rsc_locks.md", "---\nformat: story-toolkit\nschema-version: 1\nid: rsc_locks\ntype: research\nstatus: open\ntitle: Victorian locks\nused-by:\n  - scn_cellar\n---\nWarded locks open with simple keys.\n");
  p.write("styles/voice.md", "Short sentences. No adverbs.\n");
  p.write("story.md", p.read("story.md").replace("premise: A fixture premise for tests.", "premise: A fixture premise for tests.\ninstructions:\n  - Keep Zoë's secret until the confession.\nstyle-sources:\n  - styles/voice.md"));
  return p;
}

describe("context requests", () => {
  test("context excludes a later reveal and explains selection", async () => {
    const p = await makeKnowledgeFixture();
    const packet = buildContext(await p.load(), {
      task: "draft", target: p.entry("scn_opening"), maxBytes: 48000,
    });
    expect(packet.items.map((x) => x.id)).not.toContain("fact_later_reveal");
    expect(packet.items.every((x) => x.reason && x.sources.length)).toBe(true);
  });

  test("all ten task types are accepted; scene tasks need a target and project tasks do not", () => {
    expect(TASKS).toEqual(["plan", "draft", "revise", "review", "world", "memory", "research", "series", "image", "publish"]);
    for (const task of ["plan", "world", "memory", "research", "series", "publish"]) {
      expect(validateRequest({ task }).problems).toEqual([]);
    }
    for (const task of ["draft", "revise", "review", "image"]) {
      expect(validateRequest({ task }).problems).toEqual([`Task ${task} needs a target scene cursor`]);
      expect(validateRequest({ task, target: { sceneId: "scn_x", side: "before" } }).problems).toEqual([]);
    }
    expect(validateRequest({ task: "plan" }).request).toEqual({
      task: "plan", target: null, audience: "writer", constraints: [], include: [], maxBytes: DEFAULT_MAX_BYTES
    });
  });

  test("invalid tasks, targets, audiences, budgets, constraints and includes are rejected", () => {
    const target = { sceneId: "scn_x", side: "before" };
    const cases = [
      [{}, "task must be one of plan, draft, revise, review, world, memory, research, series, image, publish"],
      [{ task: "summarize" }, "task must be one of plan, draft, revise, review, world, memory, research, series, image, publish"],
      [{ task: "draft", target: { sceneId: "scn_x" } }, "target needs sceneId and side before or after"],
      [{ task: "draft", target: { sceneId: "", side: "after" } }, "target needs sceneId and side before or after"],
      [{ task: "draft", target: { sceneId: "scn_x", side: "after", beatId: 3 } }, "target beatId must be a beat id"],
      [{ task: "draft", target: "scn_x" }, "target needs sceneId and side before or after"],
      [{ task: "draft", target, audience: "editor" }, "audience must be writer or reader"],
      [{ task: "draft", target, audience: "reader" }, "audience reader is a reader simulation; use task review"],
      [{ task: "plan", audience: "reader" }, "audience reader is a reader simulation; use task review"],
      [{ task: "review", target, audience: "reader", include: ["chr_ada"] }, "a reader simulation cannot include records outside its reading boundary"],
      [{ task: "draft", target, maxBytes: 0 }, "maxBytes must be a positive integer"],
      [{ task: "draft", target, maxBytes: 1.5 }, "maxBytes must be a positive integer"],
      [{ task: "draft", target, constraints: ["ok", ""] }, "constraints must be non-empty strings"],
      [{ task: "draft", target, constraints: "one" }, "constraints must be non-empty strings"],
      [{ task: "draft", target, include: [7] }, "include must list record ids"]
    ];
    for (const [request, problem] of cases) {
      expect(validateRequest(request).problems).toContain(problem);
    }
  });

  test("an invalid request or an unknown target returns only diagnostics", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    const invalid = buildContext(project, { task: "draft" });
    expect(invalid.items).toEqual([]);
    expect(invalid.diagnostics.map((item) => item.code)).toEqual(["REQUEST_INVALID"]);
    const ghost = buildContext(project, { task: "draft", target: p.entry("scn_ghost") });
    expect(ghost.items).toEqual([]);
    expect(ghost.diagnostics.map((item) => [item.code, item.severity])).toEqual([["TARGET_NOT_FOUND", "error"]]);
    const beat = buildContext(project, { task: "draft", target: p.cursor("scn_cellar", "beat_ghost", "after") });
    expect(beat.diagnostics.map((item) => item.code)).toEqual(["TARGET_NOT_FOUND"]);
    const record = buildContext(project, { task: "draft", target: p.entry("chr_ada") });
    expect(record.diagnostics.map((item) => item.code)).toEqual(["TARGET_NOT_FOUND"]);
    const unplaced = await makeProject();
    unplaced.write("scenes/scn_loose.md", "---\nformat: story-toolkit\nschema-version: 1\nid: scn_loose\ntype: scene\nchapter-id: chp_one\n---\n");
    const loose = buildContext(await unplaced.load(), { task: "draft", target: unplaced.entry("scn_loose") });
    expect(loose.diagnostics.map((item) => item.code)).toContain("TARGET_NOT_FOUND");
  });
});

describe("writer packets", () => {
  test("a draft at a beat gets in-scene knowledge up to the cursor, with a reason and sources on every item", async () => {
    const p = await contextFixture();
    const packet = buildContext(await p.load(), {
      task: "draft",
      target: p.cursor("scn_cellar", "beat_confession", "before"),
      constraints: ["Write from Ada's point of view."]
    });
    expect(packet.operation).toBe("draft");
    expect(packet.audience).toBe("writer");
    expect(packet.target).toEqual({ sceneId: "scn_cellar", beatId: "beat_confession", side: "before" });
    expect(packet.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
    const got = ids(packet.items);
    expect(got.slice(0, 5)).toEqual(["constraint:1", "project:prj_00000001", "scene:scn_cellar", "prose:scn_cellar", "prose:scn_opening"]);
    for (const id of ["chr_ada", "chr_zoe", "fact_key_handoff", "fact_false_belief", "dec_tense", "dec_cellar_dark", "dec_zoe_limp", "issue_zoe_eyes", "arc_trust", "rsc_locks", "style:styles/voice.md"]) {
      expect(got).toContain(id);
    }
    for (const id of ["fact_ada_learns", "fact_later_reveal", "fact_key_gone", "dec_pier", "issue_done", "que_thief", "prose:scn_morning", "obj_brass_key"]) {
      expect(got).not.toContain(id);
    }
    expect(packet.impact).toEqual([]);
    expect(packet.items.every((item) => typeof item.reason === "string" && item.reason.length > 0 && item.sources.length > 0)).toBe(true);
    const prose = packet.items.find((item) => item.id === "prose:scn_cellar");
    expect(prose).toMatchObject({ kind: "prose", required: true });
    expect(prose.content).toContain("Zoë slips the brass key into her coat.");
    expect(prose.content).not.toContain("I took it");
    expect(prose.sources[0]).toMatchObject({ path: "chapters/one.md", scene: "scn_cellar", until: { beat: "beat_confession", side: "before" }, kind: "manuscript" });
    expect(prose.sources[0].hash).toMatch(/^[0-9a-f]{64}$/);
    expect(packet.items.find((item) => item.id === "constraint:1")).toMatchObject({ kind: "constraint", required: true, content: "Write from Ada's point of view.", sources: [{ path: "request", index: 1, kind: "request" }] });
    const project = packet.items.find((item) => item.id === "project:prj_00000001");
    expect(project.content.instructions).toEqual(["Keep Zoë's secret until the confession."]);
    expect(packet.items.find((item) => item.id === "dec_zoe_limp").reason).toContain("not an instruction");
    expect(packet.items.find((item) => item.id === "style:styles/voice.md")).toMatchObject({ kind: "style", content: "Short sentences. No adverbs.\n" });
    expect(packet.items.find((item) => item.id === "fact_key_handoff").sources.map((item) => item.kind)).toEqual(["record", "manuscript"]);
    expect(packet.omissions).toEqual([]);
    expect(packet.bytes).toBe(packetBytes(packet));
    expect(packet.bytes).toBeLessThanOrEqual(DEFAULT_MAX_BYTES);
  });

  test("revision impact material is separated from writer knowledge", async () => {
    const p = await contextFixture();
    const packet = buildContext(await p.load(), { task: "revise", target: p.exit("scn_cellar") });
    expect(ids(packet.items)).not.toContain("prose:scn_morning");
    expect(ids(packet.items)).not.toContain("fact_key_gone");
    expect(ids(packet.impact)).toEqual(["impact:prose:scn_morning", "impact:fact_key_gone"]);
    expect(packet.impact.every((item) => item.kind.startsWith("impact") && item.reason.includes("not writer knowledge"))).toBe(true);
    expect(packet.items.find((item) => item.id === "prose:scn_cellar").content).toContain("I took it");
    const beat = buildContext(await p.load(), { task: "revise", target: p.cursor("scn_cellar", "beat_handoff", "before") });
    const span = beat.items.find((item) => item.id === "prose:scn_cellar");
    expect(span.content.startsWith("<!-- story-beat: beat_handoff -->")).toBe(true);
    expect(span.sources[0]).toMatchObject({ scene: "scn_cellar", beat: "beat_handoff" });
    const draft = buildContext(await p.load(), { task: "draft", target: p.exit("scn_cellar") });
    expect(draft.impact).toEqual([]);
  });

  test("unresolved state is labelled and a profile with unsplit history is flagged", async () => {
    const p = await contextFixture();
    p.write("characters/chr_ada.md", `${p.read("characters/chr_ada.md")}## Later life\n\nAda eventually runs the guild.\n`);
    await p.addFact({ id: "fact_unsourced", subject: "chr_ada", predicate: "status", value: "tired" });
    const packet = buildContext(await p.load(), { task: "draft", target: p.exit("scn_cellar") });
    const unresolved = packet.items.find((item) => item.id === "fact_unsourced");
    expect(unresolved).toMatchObject({ kind: "unresolved-fact" });
    expect(unresolved.reason).toContain("MISSING_PROVENANCE");
    expect(packet.diagnostics.map((item) => item.code)).toContain("UNSPLIT_BIOGRAPHY");
  });

  test("a missing style source is a warning, and includes are required primary material", async () => {
    const p = await contextFixture();
    p.write("story.md", p.read("story.md").replace("  - styles/voice.md", "  - styles/voice.md\n  - styles/missing.md"));
    const packet = buildContext(await p.load(), { task: "image", target: p.entry("scn_opening"), include: ["que_thief", "scn_morning", "dec_pier"] });
    expect(packet.diagnostics.map((item) => [item.code, item.severity])).toContainEqual(["STYLE_SOURCE_UNREADABLE", "warning"]);
    const requested = packet.items.filter((item) => item.reason === "requested by the caller");
    expect(ids(requested)).toEqual(["que_thief", "scene:scn_morning", "prose:scn_morning", "dec_pier"]);
    expect(requested.every((item) => item.required)).toBe(true);
    const missing = buildContext(await p.load(), { task: "plan", include: ["chr_ghost"] });
    expect(missing.diagnostics.map((item) => item.code)).toContain("TARGET_NOT_FOUND");
  });
});

describe("selection edges", () => {
  test("unlinked unresolved facts stay out, and memory labels unresolved facts", async () => {
    const p = await contextFixture();
    await p.addFact({ id: "fact_unlinked", subject: "obj_brass_key", predicate: "location", value: "the pier" });
    await p.addFact({ id: "fact_ada_unsourced", subject: "chr_ada", predicate: "status", value: "tired" });
    const project = await p.load();
    const draft = buildContext(project, { task: "draft", target: p.exit("scn_cellar") });
    expect(ids(draft.items)).not.toContain("fact_unlinked");
    expect(draft.items.find((item) => item.id === "fact_ada_unsourced").kind).toBe("unresolved-fact");
    expect(draft.diagnostics.filter((item) => item.code === "MISSING_PROVENANCE").map((item) => item.recordIds)).toEqual([["fact_ada_unsourced"]]);
    const memory = buildContext(project, { task: "memory" });
    const unlinked = memory.items.find((item) => item.id === "fact_unlinked");
    expect(unlinked.kind).toBe("unresolved-fact");
    expect(unlinked.reason).toContain("MISSING_PROVENANCE");
    expect(memory.items.find((item) => item.id === "fact_key_handoff").kind).toBe("fact");
  });

  test("style paths outside the project, reopened issues, superseded decisions and matter", async () => {
    const p = await contextFixture();
    p.write("story.md", p.read("story.md").replace("  - styles/voice.md", "  - styles/voice.md\n  - ../outside.md"));
    await p.addIssue({
      id: "issue_reopened",
      status: "dismissed",
      "affected-ids": ["chr_ada"],
      evidence: [{ path: "characters/chr_ada.md", hash: "0".repeat(64), kind: "manuscript" }],
      dismissal: { code: "FIXTURE_FINDING", "record-id": "chr_ada", reason: "Fine." }
    });
    await p.addDecision({ id: "dec_old", "scope-ids": ["prj_00000001"], rationale: "Old rule." });
    await p.addDecision({ id: "dec_new", "scope-ids": ["prj_00000001"], supersedes: ["dec_old"], rationale: "New rule." });
    await p.addEntity({ id: "mat_dedication", type: "matter", name: "Dedication" });
    const project = await p.load();
    const draft = buildContext(project, { task: "draft", target: p.exit("scn_cellar") });
    expect(draft.diagnostics.filter((item) => item.code === "STYLE_SOURCE_UNREADABLE").map((item) => item.message)).toEqual([
      expect.stringContaining("../outside.md")
    ]);
    expect(draft.items.find((item) => item.id === "issue_reopened").reason).toContain("reopened because its evidence changed");
    const plan = buildContext(project, { task: "plan" });
    expect(ids(plan.items)).toContain("dec_new");
    expect(ids(plan.items)).not.toContain("dec_old");
    const publish = buildContext(project, { task: "publish" });
    expect(ids(publish.items)).toContain("mat_dedication");
  });

  test("a review writer packet also gets impact material, and scene titles reach the outline", async () => {
    const p = await contextFixture();
    const project = await p.load();
    const review = buildContext(project, { task: "review", target: p.cursor("scn_cellar", "beat_arrival", "after") });
    expect(ids(review.impact)).toContain("impact:prose:scn_morning");
    expect(ids(review.impact)).toContain("impact:fact_key_handoff");
    expect(ids(review.items)).not.toContain("fact_key_handoff");
    const outline = buildContext(project, { task: "plan" }).items.find((item) => item.id === "outline");
    expect(outline.content[1]).toEqual({ sceneId: "scn_cellar", chapterId: "chp_one", title: "Cellar" });
    expect(outline.sources.map((item) => item.path)).toEqual(["chapters/one.md", "scenes/scn_opening.md", "scenes/scn_cellar.md", "scenes/scn_morning.md"]);
  });
});

describe("project-level packets", () => {
  test("planning and publishing need no scene", async () => {
    const p = await contextFixture();
    const project = await p.load();
    const plan = buildContext(project, { task: "plan" });
    expect(plan.target).toBeNull();
    expect(plan.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
    expect(kinds(plan.items)).toEqual(["decision", "entity", "issue", "outline", "plan", "project"]);
    expect(ids(plan.items)).toEqual(expect.arrayContaining(["arc_trust", "que_thief", "dec_tense", "dec_pier", "dec_zoe_limp", "issue_zoe_eyes", "outline"]));
    expect(ids(plan.items)).not.toContain("issue_done");
    const outline = plan.items.find((item) => item.id === "outline");
    expect(outline.content.map((scene) => scene.sceneId)).toEqual(["scn_opening", "scn_cellar", "scn_morning"]);
    const publish = buildContext(project, { task: "publish" });
    expect(kinds(publish.items)).toEqual(["decision", "issue", "outline", "project"]);
    expect(publish.items.every((item) => item.kind !== "prose")).toBe(true);
  });

  test("world, memory, research and series tasks select their own material", async () => {
    const p = await contextFixture();
    p.write("series.md", "---\nformat: story-toolkit\nschema-version: 1\nid: ser_keys\ntype: series\ntitle: Keys\n---\n");
    p.write("glossary/trm_ward.md", "---\nformat: story-toolkit\nschema-version: 1\nid: trm_ward\ntype: term\nname: Ward\n---\n");
    const project = await p.load();
    expect(project.diagnostics).toEqual([]);
    const world = buildContext(project, { task: "world" });
    expect(ids(world.items)).toEqual(expect.arrayContaining(["obj_brass_key", "trm_ward"]));
    expect(ids(world.items)).not.toContain("chr_ada");
    const memory = buildContext(project, { task: "memory" });
    expect(ids(memory.items)).toEqual(expect.arrayContaining(["fact_key_handoff", "fact_ada_learns", "fact_later_reveal", "fact_key_gone"]));
    const memoryAt = buildContext(project, { task: "memory", target: p.entry("scn_cellar") });
    expect(ids(memoryAt.items)).toContain("scene:scn_cellar");
    expect(ids(memoryAt.items)).not.toContain("fact_key_gone");
    const research = buildContext(project, { task: "research" });
    expect(ids(research.items)).toContain("rsc_locks");
    const series = buildContext(project, { task: "series" });
    expect(ids(series.items)).toContain("ser_keys");
  });
});

describe("reader simulations", () => {
  test("a first reader gets only prose and reader reveals up to the reading boundary", async () => {
    const p = await contextFixture();
    const packet = buildContext(await p.load(), {
      task: "review",
      audience: "reader",
      target: p.cursor("scn_cellar", "beat_handoff", "after"),
      constraints: ["React as a first-time reader."]
    });
    expect(packet.audience).toBe("reader");
    expect(kinds(packet.items)).toEqual(["constraint", "prose"]);
    expect(ids(packet.items)).toEqual(["constraint:1", "prose:scn_cellar", "prose:scn_opening"]);
    const prose = packet.items.find((item) => item.id === "prose:scn_cellar");
    expect(prose.content).toContain("Zoë slips the brass key");
    expect(prose.content).not.toContain("I took it");
    for (const item of packet.items) {
      for (const source of item.sources) {
        expect(["request", "chapters/one.md"]).toContain(source.path);
        if (source.path !== "request") expect(["scn_opening", "scn_cellar"]).toContain(source.scene);
      }
    }
    expect(packet.impact).toEqual([]);
  });

  test("a reveal reaches the reader only once its reveal point and its sources are behind the boundary", async () => {
    const p = await contextFixture();
    const exit = buildContext(await p.load(), { task: "review", audience: "reader", target: p.exit("scn_cellar") });
    expect(ids(exit.items)).toEqual(["prose:scn_cellar", "prose:scn_opening", "fact_later_reveal"]);
    expect(exit.items.find((item) => item.id === "fact_later_reveal").kind).toBe("reveal");
    await p.addFact({
      id: "fact_early_claim",
      kind: "reader-reveal",
      subject: "chr_zoe",
      predicate: "status",
      value: "locksmith",
      "valid-from": { scene: "scn_opening", side: "after" },
      sources: [p.source("scn_morning")]
    });
    const early = buildContext(await p.load(), { task: "review", audience: "reader", target: p.exit("scn_cellar") });
    expect(ids(early.items)).not.toContain("fact_early_claim");
    const later = buildContext(await p.load(), { task: "review", audience: "reader", target: p.exit("scn_morning") });
    expect(ids(later.items)).toContain("fact_early_claim");
    const entry = buildContext(await p.load(), { task: "review", audience: "reader", target: p.entry("scn_opening") });
    expect(entry.items).toEqual([]);
    await p.addFact({
      id: "fact_file_reveal",
      kind: "reader-reveal",
      subject: "chr_zoe",
      predicate: "injury",
      value: "a scarred hand",
      sources: [p.fileSource("chapters/one.md")]
    });
    await p.addFact({
      id: "fact_baseline_reveal",
      kind: "reader-reveal",
      subject: "chr_ada",
      predicate: "injury",
      value: "a bruised wrist",
      sources: [p.source("scn_opening")]
    });
    const baseline = buildContext(await p.load(), { task: "review", audience: "reader", target: p.exit("scn_morning") });
    expect(ids(baseline.items)).toContain("fact_baseline_reveal");
    expect(ids(baseline.items)).not.toContain("fact_file_reveal");
  });
});

describe("byte budget", () => {
  test("the serialized packet stays within maxBytes, counting UTF-8 bytes, and omissions keep a reason and retrieval id", async () => {
    const p = await contextFixture();
    // About 21 KB of UTF-8 but only about 15,000 characters of nearby prose.
    p.write("chapters/one.md", p.read("chapters/one.md").replace("Ada reaches the inn at dusk", `Ada reaches the inn at dusk ${"żółw ".repeat(3000)}`));
    const project = await p.load();
    const full = buildContext(project, { task: "draft", target: p.exit("scn_cellar") });
    expect(full.omissions).toEqual([]);
    expect(ids(full.items)).toContain("prose:scn_opening");
    // Nearby prose outranks profiles and decisions, so it is kept while it
    // fits. Take away half its size and it no longer fits with the required
    // items; the smaller, lower-priority items still do.
    const openingBytes = Buffer.byteLength(JSON.stringify(full.items.find((item) => item.id === "prose:scn_opening")), "utf8");
    const maxBytes = full.bytes - Math.ceil(openingBytes / 2);
    const packet = buildContext(project, { task: "draft", target: p.exit("scn_cellar"), maxBytes });
    expect(packet.maxBytes).toBe(maxBytes);
    expect(packet.bytes).toBe(Buffer.byteLength(JSON.stringify(packet), "utf8"));
    expect(packet.bytes).toBeLessThanOrEqual(maxBytes);
    expect(JSON.stringify(packet).length).toBeLessThan(packet.bytes);
    expect(packet.diagnostics.map((item) => item.code)).not.toContain("CONTEXT_BUDGET_EXCEEDED");
    expect(packet.items.filter((item) => item.required).length).toBe(full.items.filter((item) => item.required).length);
    const opening = packet.omissions.find((item) => item.id === "prose:scn_opening");
    expect(opening).toMatchObject({ kind: "prose", reason: "over the byte budget", retrieval: "scn_opening" });
    expect(opening.bytes).toBeGreaterThan(20000);
    // Smaller, lower-priority material still fills the remaining budget.
    expect(ids(packet.items)).toEqual(expect.arrayContaining(["chr_zoe", "dec_tense", "rsc_locks"]));
    const tight = buildContext(project, { task: "draft", target: p.exit("scn_cellar"), maxBytes: 4000 });
    expect(tight.bytes).toBeLessThanOrEqual(4000);
    expect(tight.omissions.length).toBeGreaterThan(1);
    for (const omission of tight.omissions) {
      expect(omission.reason).toBe("over the byte budget");
      expect(typeof omission.retrieval).toBe("string");
      expect(omission.bytes).toBeGreaterThan(0);
    }
    // A record is retrieved by its own id, prose by its scene id.
    expect(tight.omissions.find((item) => item.id === "prose:scn_opening").retrieval).toBe("scn_opening");
    const records = tight.omissions.filter((item) => !item.id.includes(":"));
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((item) => item.retrieval === item.id)).toBe(true);
  });

  test("required instructions that cannot fit return a budget finding and the required source list", async () => {
    const p = await contextFixture();
    p.write("story.md", p.read("story.md").replace("  - Keep Zoë's secret until the confession.", `  - "${"Ł".repeat(3000)}"`));
    const packet = buildContext(await p.load(), { task: "draft", target: p.exit("scn_cellar"), maxBytes: 5000 });
    expect(packet.items).toEqual([]);
    expect(packet.impact).toEqual([]);
    expect(packet.diagnostics.map((item) => [item.code, item.severity])).toContainEqual(["CONTEXT_BUDGET_EXCEEDED", "error"]);
    expect(packet.required.map((item) => item.id)).toEqual(["project:prj_00000001", "scene:scn_cellar", "prose:scn_cellar"]);
    expect(packet.required[0].bytes).toBeGreaterThan(5000);
    expect(packet.required[0].sources[0]).toMatchObject({ path: "story.md", kind: "record" });
    expect(packet.omissions.length).toBeGreaterThan(0);
  });

  test("a multibyte constraint counts bytes, not characters", async () => {
    const p = await makeKnowledgeFixture();
    const constraint = "ß".repeat(1500);
    const packet = buildContext(await p.load(), { task: "plan", constraints: [constraint], maxBytes: 2500 });
    expect(constraint.length).toBeLessThan(2500);
    expect(packet.diagnostics.map((item) => item.code)).toContain("CONTEXT_BUDGET_EXCEEDED");
    expect(packet.required[0]).toMatchObject({ id: "constraint:1" });
    expect(packet.required[0].bytes).toBeGreaterThan(3000);
  });
});
