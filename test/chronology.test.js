import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { buildChronology } from "../src/state/chronology.js";
import { appliesAt, beatCursor, sceneEntry, sceneExit } from "../src/state/cursor.js";
import { makeChronologyFixture, makeProject, setRecordField } from "./support/project.js";

function codes(order) {
  return order.diagnostics.map((item) => item.code);
}

async function withBeats(sceneId, beats, fields = {}) {
  const p = await makeProject();
  await p.addScene({ id: sceneId, title: sceneId, ...fields });
  const marker = `<!-- story-scene: ${sceneId} -->\n`;
  const beatText = beats.map((beat) => `<!-- story-beat: ${beat} -->\n`).join("");
  p.write("chapters/one.md", p.read("chapters/one.md").replace(marker, `${marker}${beatText}`));
  return p;
}

describe("partial chronology", () => {
  test("a flashback does not follow reading order", async () => {
    const p = await makeChronologyFixture();
    const order = buildChronology(await p.load());
    const reading = order.readingOrder.map((entry) => entry.sceneId);
    expect(reading.indexOf("scn_opening")).toBeLessThan(reading.indexOf("scn_flashback"));
    expect(order.compare(p.exit("scn_flashback"), p.entry("scn_opening"))).toBe("before");
    expect(order.compare(p.exit("scn_undated"), p.entry("scn_opening"))).toBe("unordered");
    expect(Array.isArray(order.storyOrder)).toBe(false);
    expect(order.storyOrder.unplaced).toContain("scn_undated");
  });

  test("unordered when information is insufficient", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_left", title: "Left" });
    await p.addScene({ id: "scn_right", title: "Right" });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_left"), p.entry("scn_right"))).toBe("unordered");
    expect(order.compare(p.entry("scn_right"), p.exit("scn_left"))).toBe("unordered");
  });

  test("reachability follows explicit after edges", async () => {
    const p = await makeChronologyFixture();
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_flashback"), p.entry("scn_aftermath"))).toBe("before");
    expect(order.compare(p.entry("scn_opening"), p.exit("scn_aftermath"))).toBe("before");
    expect(order.compare(p.exit("scn_aftermath"), p.entry("scn_flashback"))).toBe("after");
  });

  test("a scene record points to exactly one matching span", async () => {
    const p = await makeChronologyFixture();
    const matched = buildChronology(await p.load());
    expect(codes(matched).filter((code) => code.startsWith("SCENE_SPAN") || code === "SCENE_MARKER_UNMATCHED")).toEqual([]);
    const opening = matched.readingOrder.find((entry) => entry.sceneId === "scn_opening");
    expect(opening).toMatchObject({ chapterId: "chp_one", path: "chapters/one.md" });

    p.write("chapters/one.md", `${p.read("chapters/one.md")}<!-- story-scene: scn_opening -->\n`);
    const ambiguous = buildChronology(await p.load());
    expect(codes(ambiguous)).toContain("SCENE_SPAN_AMBIGUOUS");

    const missing = await makeProject();
    await missing.addScene({ id: "scn_lost", title: "Lost" });
    missing.write("chapters/one.md", missing.read("chapters/one.md").replace("<!-- story-scene: scn_lost -->\n", ""));
    const gone = buildChronology(await missing.load());
    expect(codes(gone)).toContain("SCENE_SPAN_MISSING");
    expect(gone.readingOrder.map((entry) => entry.sceneId)).not.toContain("scn_lost");

    const extra = await makeProject();
    extra.write("chapters/one.md", `${extra.read("chapters/one.md")}<!-- story-scene: scn_unrecorded -->\n`);
    const unmatched = buildChronology(await extra.load());
    expect(codes(unmatched)).toContain("SCENE_MARKER_UNMATCHED");
  });

  test("a same-scene handoff", async () => {
    const p = await withBeats("scn_cellar", ["beat_approach", "beat_handoff"]);
    const order = buildChronology(await p.load());
    const beats = order.readingOrder.find((entry) => entry.sceneId === "scn_cellar").beats;
    expect(beats).toEqual(["beat_approach", "beat_handoff"]);
    expect(sceneEntry("scn_cellar")).toEqual({ sceneId: "scn_cellar", side: "before" });
    expect(sceneExit("scn_cellar")).toEqual({ sceneId: "scn_cellar", side: "after" });
    expect(beatCursor("scn_cellar", "beat_approach", "before")).toEqual({ sceneId: "scn_cellar", beatId: "beat_approach", side: "before" });
    expect(order.compare(sceneEntry("scn_cellar"), beatCursor("scn_cellar", "beat_approach", "before"))).toBe("before");
    expect(order.compare(p.cursor("scn_cellar", "beat_approach", "after"), p.cursor("scn_cellar", "beat_handoff", "before"))).toBe("before");
    expect(order.compare(p.cursor("scn_cellar", "beat_handoff", "before"), p.cursor("scn_cellar", "beat_handoff", "after"))).toBe("before");
    expect(order.compare(beatCursor("scn_cellar", "beat_handoff", "after"), sceneExit("scn_cellar"))).toBe("before");
    expect(order.compare(
      { scene: "scn_cellar", beat: "beat_approach", side: "after" },
      { scene: "scn_cellar", side: "after" }
    )).toBe("before");
    expect(order.compare(p.cursor("scn_cellar", "beat_handoff", "after"), p.cursor("scn_cellar", "beat_handoff", "after"))).toBe("equal");

    const fact = { "valid-from": { scene: "scn_cellar", beat: "beat_handoff", side: "after" } };
    expect(appliesAt(order, fact, p.cursor("scn_cellar", "beat_handoff", "before"))).toBe(false);
    expect(appliesAt(order, fact, p.entry("scn_cellar"))).toBe(false);
    expect(appliesAt(order, fact, p.cursor("scn_cellar", "beat_handoff", "after"))).toBe(true);
    expect(appliesAt(order, fact, p.exit("scn_cellar"))).toBe(true);
  });

  test("the exclusive valid-until boundary", async () => {
    const p = await withBeats("scn_cellar", ["beat_handoff", "beat_after"]);
    const order = buildChronology(await p.load());
    const fact = {
      "valid-from": "baseline",
      "valid-until": { scene: "scn_cellar", beat: "beat_handoff", side: "after" }
    };
    expect(appliesAt(order, fact, p.entry("scn_cellar"))).toBe(true);
    expect(appliesAt(order, fact, p.cursor("scn_cellar", "beat_handoff", "before"))).toBe(true);
    expect(appliesAt(order, fact, p.cursor("scn_cellar", "beat_handoff", "after"))).toBe(false);
    expect(appliesAt(order, fact, p.cursor("scn_cellar", "beat_after", "before"))).toBe(false);
    expect(appliesAt(order, fact, p.exit("scn_cellar"))).toBe(false);
  });

  test("equal timestamps with explicit edges", async () => {
    const p = await makeProject();
    const stamp = { date: "2024-06-01", time: "12:00:00Z" };
    await p.addScene({ id: "scn_left", title: "Left", chronology: stamp });
    await p.addScene({ id: "scn_right", title: "Right", chronology: { ...stamp, after: ["scn_left"] } });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_left"), p.entry("scn_right"))).toBe("before");
    expect(codes(order)).not.toContain("CONTRADICTORY_TIMESTAMP");
    expect(order.storyOrder.constraints).toEqual([
      { earlier: "scn_left", later: "scn_right", reason: "after" }
    ]);
  });

  test("contradictory edges", async () => {
    const p = await makeProject();
    await p.addScene({
      id: "scn_morning",
      title: "Morning",
      chronology: { after: ["scn_evening"], date: "2024-05-01", time: "08:00:00Z" }
    });
    await p.addScene({
      id: "scn_evening",
      title: "Evening",
      chronology: { date: "2024-05-01", time: "20:00:00Z" }
    });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_evening"), p.entry("scn_morning"))).toBe("unordered");
    expect(order.compare(p.exit("scn_morning"), p.entry("scn_evening"))).toBe("unordered");
    expect(codes(order)).toContain("CONTRADICTORY_TIMESTAMP");
  });

  test("two cycles stay separate groups", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_a", title: "A", chronology: { after: ["scn_b"] } });
    await p.addScene({ id: "scn_b", title: "B", chronology: { after: ["scn_a"] } });
    await p.addScene({ id: "scn_c", title: "C", chronology: { after: ["scn_d"] } });
    await p.addScene({ id: "scn_d", title: "D", chronology: { after: ["scn_c"] } });
    const order = buildChronology(await p.load());
    expect(order.storyOrder.cyclic).toEqual([["scn_a", "scn_b"], ["scn_c", "scn_d"]]);
    expect(order.compare(p.exit("scn_a"), p.entry("scn_c"))).toBe("unordered");
    expect(Array.isArray(order.storyOrder)).toBe(false);
  });

  test("a cycle", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_a", title: "A", chronology: { after: ["scn_c"] } });
    await p.addScene({ id: "scn_b", title: "B", chronology: { after: ["scn_a"] } });
    await p.addScene({ id: "scn_c", title: "C", chronology: { after: ["scn_b"] } });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_a"), p.entry("scn_b"))).toBe("unordered");
    expect(order.compare(p.exit("scn_b"), p.entry("scn_c"))).toBe("unordered");
    expect(order.compare(p.exit("scn_c"), p.entry("scn_a"))).toBe("unordered");
    expect(codes(order)).toContain("CYCLE");
    expect(order.storyOrder.cyclic.flat().sort()).toEqual(["scn_a", "scn_b", "scn_c"]);
    expect(Array.isArray(order.storyOrder)).toBe(false);
  });

  test("missing beat references", async () => {
    const p = await makeChronologyFixture();
    const order = buildChronology(await p.load());
    expect(order.compare(p.cursor("scn_opening", "beat_missing", "before"), p.entry("scn_opening"))).toBe("unordered");
    const missing = order.diagnostics.find((item) => item.code === "MISSING_BEAT");
    expect(missing.recordIds).toContain("beat_missing");
    expect(appliesAt(order, {
      "valid-from": { scene: "scn_opening", beat: "beat_missing", side: "after" }
    }, p.entry("scn_opening"))).toBe("unresolved");
  });

  test("missing scene references", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_opening", title: "Opening", chronology: { after: ["scn_ghost"] } });
    const order = buildChronology(await p.load());
    expect(codes(order)).toContain("MISSING_SCENE");
    expect(order.diagnostics.find((item) => item.code === "MISSING_SCENE").recordIds).toContain("scn_ghost");
    expect(order.compare(p.exit("scn_opening"), p.entry("scn_ghost"))).toBe("unordered");
  });

  test("duplicate beat ids", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_cellar", title: "Cellar" });
    const marker = "<!-- story-scene: scn_cellar -->\n";
    const body = `${marker}<!-- story-beat: beat_handoff -->\nOne.\n<!-- story-beat: beat_handoff -->\nTwo.\n`;
    p.write("chapters/one.md", p.read("chapters/one.md").replace(marker, body));
    const order = buildChronology(await p.load());
    expect(codes(order)).toContain("DUPLICATE_BEAT_ID");
    expect(order.compare(p.cursor("scn_cellar", "beat_handoff", "before"), p.exit("scn_cellar"))).toBe("unordered");
  });

  test("date-versus-instant precision", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_day", title: "Day", chronology: { date: "2024-03-01" } });
    await p.addScene({ id: "scn_next", title: "Next", chronology: { date: "2024-03-02", time: "00:00:00Z" } });
    await p.addScene({ id: "scn_same", title: "Same", chronology: { date: "2024-03-01", time: "15:00:00Z" } });
    await p.addScene({ id: "scn_civil", title: "Civil", chronology: { date: "2024-03-01", time: "15:00:00" } });
    await p.addScene({ id: "scn_early", title: "Early", chronology: { date: "2024-01-01" } });
    await p.addScene({ id: "scn_late", title: "Late", chronology: { date: "2024-02-01" } });
    await p.addScene({ id: "scn_inst_early", title: "Instant early", chronology: { time: "2024-04-01T00:00:00Z" } });
    await p.addScene({ id: "scn_inst_late", title: "Instant late", chronology: { time: "2024-04-02T00:00:00+00:00" } });
    const order = buildChronology(await p.load());

    expect(order.compare(p.exit("scn_day"), p.entry("scn_next"))).toBe("unordered");
    expect(order.compare(p.exit("scn_day"), p.entry("scn_same"))).toBe("unordered");
    expect(order.compare(p.exit("scn_civil"), p.entry("scn_same"))).toBe("unordered");
    expect(order.compare(p.exit("scn_early"), p.entry("scn_late"))).toBe("before");
    expect(order.compare(p.exit("scn_inst_early"), p.entry("scn_inst_late"))).toBe("before");
    expect(order.scenes.find((scene) => scene.id === "scn_day").timestamp.precision).toBe("date");
    expect(order.scenes.find((scene) => scene.id === "scn_same").timestamp.precision).toBe("instant");
    expect(order.scenes.find((scene) => scene.id === "scn_civil").timestamp.precision).toBe("civil");
    expect(codes(order)).not.toContain("MALFORMED_TIMESTAMP");
  });

  test("ambiguous branches stay separate constraints", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_a", title: "A" });
    await p.addScene({ id: "scn_b", title: "B", chronology: { after: ["scn_a"] } });
    await p.addScene({ id: "scn_c", title: "C" });
    await p.addScene({ id: "scn_d", title: "D", chronology: { after: ["scn_c"] } });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_a"), p.entry("scn_b"))).toBe("before");
    expect(order.compare(p.exit("scn_c"), p.entry("scn_d"))).toBe("before");
    expect(order.compare(p.exit("scn_a"), p.entry("scn_c"))).toBe("unordered");
    expect(order.compare(p.exit("scn_b"), p.entry("scn_d"))).toBe("unordered");
    expect(order.storyOrder.constraints).toEqual([
      { earlier: "scn_a", later: "scn_b", reason: "after" },
      { earlier: "scn_c", later: "scn_d", reason: "after" }
    ]);
    expect(order.storyOrder.sequence).toBeUndefined();
  });

  test("scene after links and fact cursors keep the schema shape", async () => {
    const p = await makeChronologyFixture();
    await p.addFact({
      id: "fact_key_lost",
      subject: "obj_brass_key",
      predicate: "location",
      value: "lost",
      "valid-from": "baseline",
      "valid-until": { scene: "scn_opening", beat: "beat_end", side: "before" }
    });
    const project = await p.load();
    expect(project.records.get("scn_opening").record.chronology.after).toEqual(["scn_flashback"]);
    expect(project.records.get("fact_key_placed").record["valid-from"]).toEqual({ scene: "scn_opening", side: "after" });
    expect(project.records.get("fact_key_lost").record["valid-from"]).toBe("baseline");
    expect(project.records.get("fact_key_lost").record["valid-until"]).toEqual({
      scene: "scn_opening",
      beat: "beat_end",
      side: "before"
    });
    const order = buildChronology(project);
    expect(order.compare({ scene: "scn_flashback", side: "after" }, { scene: "scn_opening", side: "before" })).toBe("before");
  });

  test("reading order is chapter number then marker order", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chp_aaa", type: "chapter", name: "Aaa", title: "Aaa", number: 1 });
    await p.addEntity({ id: "chp_two", type: "chapter", name: "Two", title: "Two", number: 2 });
    await p.addEntity({ id: "chp_tail", type: "chapter", name: "Tail", title: "Tail" });
    await p.addScene({ id: "scn_one", title: "One", "reading-order": 9 });
    await p.addScene({ id: "scn_aaa", title: "Aaa", chapter: "chp_aaa", "reading-order": 0 });
    await p.addScene({ id: "scn_two", title: "Two", chapter: "chp_two", "reading-order": 0 });
    await p.addScene({ id: "scn_tail", title: "Tail", chapter: "chp_tail", "reading-order": 0 });
    const order = buildChronology(await p.load());
    expect(order.readingOrder.map((entry) => entry.sceneId)).toEqual(["scn_aaa", "scn_one", "scn_two", "scn_tail"]);
  });

  test("a scene marker in the wrong chapter, a beat outside a scene, and an unreadable chapter", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chp_two", type: "chapter", name: "Two", title: "Two", number: 2 });
    await p.addScene({ id: "scn_misfiled", title: "Misfiled" });
    await setRecordField(p.root, "scn_misfiled", "chapter-id", "chp_two");
    const chapterPath = "chapters/one.md";
    p.write(chapterPath, p.read(chapterPath).replace(
      "<!-- story-scene: scn_misfiled -->",
      "<!-- story-beat: beat_loose -->\n<!-- story-scene: Not A Scene -->\n<!-- story-scene: scn_misfiled -->"
    ));
    const marked = buildChronology(await p.load());
    expect(codes(marked)).toEqual(expect.arrayContaining(["SCENE_CHAPTER_MISMATCH", "BEAT_OUTSIDE_SCENE", "MALFORMED_MARKER"]));
    const reloaded = await p.load();
    fs.rmSync(path.join(p.root, chapterPath));
    const unreadable = buildChronology(reloaded);
    expect(codes(unreadable)).toContain("CHAPTER_UNREADABLE");
  });

  test("duplicate after edges collapse and a self-loop is a cycle", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_loop", title: "Loop", chronology: { after: ["scn_loop", "scn_loop"] } });
    await p.addScene({ id: "scn_other", title: "Other" });
    const order = buildChronology(await p.load());
    expect(codes(order)).toContain("CYCLE");
    expect(order.storyOrder.constraints).toEqual([]);
    expect(order.compare(p.entry("scn_loop"), p.exit("scn_loop"))).toBe("before");
    expect(order.compare(p.exit("scn_loop"), p.entry("scn_other"))).toBe("unordered");
    expect(order.diagnostics.filter((item) => item.code === "CYCLE")).toHaveLength(1);
  });

  test("a joined partial order keeps unrelated branches unordered", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_a", title: "A" });
    await p.addScene({ id: "scn_b", title: "B", chronology: { after: ["scn_a"] } });
    await p.addScene({ id: "scn_c", title: "C", chronology: { after: ["scn_a"] } });
    await p.addScene({ id: "scn_d", title: "D", chronology: { after: ["scn_b", "scn_c"] } });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_a"), p.entry("scn_d"))).toBe("before");
    expect(order.compare(p.exit("scn_b"), p.entry("scn_c"))).toBe("unordered");
    expect(order.storyOrder.constraints.filter((edge) => edge.earlier === "scn_b" && edge.later === "scn_d")).toHaveLength(1);
  });

  test("an agreeing timestamp does not add a second constraint or a contradiction", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_dawn", title: "Dawn", chronology: { date: "2024-05-01", time: "08:00:00Z" } });
    await p.addScene({
      id: "scn_dusk",
      title: "Dusk",
      chronology: { date: "2024-05-01", time: "20:00:00Z", after: ["scn_dawn"] }
    });
    const order = buildChronology(await p.load());
    expect(codes(order)).not.toContain("CONTRADICTORY_TIMESTAMP");
    expect(order.storyOrder.constraints).toEqual([
      { earlier: "scn_dawn", later: "scn_dusk", reason: "after" }
    ]);
  });

  test("a timestamp inside a cycle contradicts the cycle", async () => {
    const p = await makeProject();
    await p.addScene({
      id: "scn_a",
      title: "A",
      chronology: { after: ["scn_b"], date: "2024-01-01", time: "00:00:00Z" }
    });
    await p.addScene({
      id: "scn_b",
      title: "B",
      chronology: { after: ["scn_a"], date: "2024-06-01", time: "00:00:00Z" }
    });
    const order = buildChronology(await p.load());
    expect(codes(order)).toEqual(expect.arrayContaining(["CYCLE", "CONTRADICTORY_TIMESTAMP"]));
    expect(order.compare(p.exit("scn_a"), p.entry("scn_b"))).toBe("unordered");
  });

  test("civil clocks, equal dates, and cross-precision days", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_civil_early", title: "Civil early", chronology: { date: "2024-03-01", time: "09:00" } });
    await p.addScene({ id: "scn_civil_same", title: "Civil same", chronology: { date: "2024-03-01", time: "09:00:00" } });
    await p.addScene({ id: "scn_civil_later", title: "Civil later", chronology: { date: "2024-03-01", time: "10:30:00" } });
    await p.addScene({ id: "scn_civil_next", title: "Civil next", chronology: { date: "2024-03-02", time: "08:00:00" } });
    await p.addScene({ id: "scn_day", title: "Day", chronology: { date: "2024-03-01" } });
    await p.addScene({ id: "scn_day_same", title: "Day same", chronology: { date: "2024-03-01" } });
    await p.addScene({ id: "scn_day_next", title: "Day next", chronology: { date: "2024-03-04" } });
    await p.addScene({ id: "scn_zoned", title: "Zoned", chronology: { date: "2024-04-01", time: "15:00Z" } });
    await p.addScene({ id: "scn_offset", title: "Offset", chronology: { date: "2024-04-01", time: "16:00:00+01:00" } });
    const order = buildChronology(await p.load());
    expect(order.compare(p.exit("scn_civil_early"), p.entry("scn_civil_same"))).toBe("unordered");
    expect(order.compare(p.exit("scn_civil_early"), p.entry("scn_civil_later"))).toBe("before");
    expect(order.compare(p.exit("scn_civil_later"), p.entry("scn_civil_next"))).toBe("before");
    expect(order.compare(p.exit("scn_day"), p.entry("scn_day_same"))).toBe("unordered");
    expect(order.compare(p.exit("scn_day"), p.entry("scn_day_next"))).toBe("before");
    expect(order.compare(p.exit("scn_day"), p.entry("scn_civil_next"))).toBe("before");
    expect(order.compare(p.exit("scn_day"), p.entry("scn_civil_early"))).toBe("unordered");
    expect(order.compare(p.exit("scn_zoned"), p.entry("scn_offset"))).toBe("unordered");
    expect(order.scenes.find((scene) => scene.id === "scn_zoned").timestamp.precision).toBe("instant");
    expect(codes(order)).not.toContain("MALFORMED_TIMESTAMP");
  });

  test("malformed timestamps and after lists are diagnostics", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_bad_date", title: "Bad date", chronology: { date: "2024-02-31" } });
    await p.addScene({ id: "scn_bad_clock", title: "Bad clock", chronology: { date: "2024-01-01", time: "24:01:60" } });
    await p.addScene({ id: "scn_prose", title: "Prose", chronology: { date: "2024-01-01", time: "dawn" } });
    await p.addScene({ id: "scn_mapping", title: "Mapping" });
    await p.addScene({ id: "scn_disagree", title: "Disagree", chronology: { date: "2024-01-01", time: "2024-02-01T00:00:00Z" } });
    await p.addScene({ id: "scn_civil_bad", title: "Civil bad", chronology: { date: "2024-01-01", time: "2024-02-31T00:00:00" } });
    await p.addScene({ id: "scn_bad_instant", title: "Bad instant", chronology: { time: "2024-02-31T00:00:00Z" } });
    await p.addScene({ id: "scn_bad_local", title: "Bad local", chronology: { time: "2024-02-31T09:00:00" } });
    await p.addScene({ id: "scn_local_ok", title: "Local ok", chronology: { time: "2024-03-02T09:15" } });
    await p.addScene({ id: "scn_bad_zoned", title: "Bad zoned", chronology: { date: "2024-01-01", time: "25:00Z" } });
    await p.addScene({ id: "scn_offset", title: "Offset", chronology: { date: "2024-01-01", time: "00:00:00+99:99" } });
    await p.addScene({ id: "scn_blank", title: "Blank", chronology: { after: [""] } });
    await p.addScene({ id: "scn_typed", title: "Typed" });
    await p.addScene({ id: "scn_numeric", title: "Numeric" });
    await p.addScene({ id: "scn_trimmed", title: "Trimmed", chronology: { time: "  2024-04-01T00:00:00Z  " } });
    const loaded = await p.load();
    loaded.records.get("scn_typed").record.chronology = { after: "scn_bad_date" };
    loaded.records.get("scn_numeric").record.chronology = { after: [3] };
    loaded.records.get("scn_mapping").record.chronology = ["not-a-mapping"];
    loaded.records.get("scn_bad_clock").record.chronology = { date: 20240101, time: null };
    const order = buildChronology(loaded);
    expect(codes(order)).toEqual(expect.arrayContaining(["MALFORMED_TIMESTAMP", "MALFORMED_CHRONOLOGY", "MISSING_SCENE"]));
    expect(order.scenes.find((scene) => scene.id === "scn_trimmed").timestamp.precision).toBe("instant");
    expect(order.scenes.find((scene) => scene.id === "scn_local_ok").timestamp).toMatchObject({ precision: "civil", day: "2024-03-02" });
    expect(order.scenes.find((scene) => scene.id === "scn_bad_instant").timestamp).toBeNull();
    expect(order.scenes.find((scene) => scene.id === "scn_bad_zoned").timestamp).toBeNull();
    expect(order.scenes.find((scene) => scene.id === "scn_prose").timestamp).toBeNull();
    const again = buildChronology(loaded);
    expect(again.diagnostics.filter((item) => item.code === "MALFORMED_TIMESTAMP").length)
      .toBe(order.diagnostics.filter((item) => item.code === "MALFORMED_TIMESTAMP").length);
  });

  test("a fact window is unresolved until a boundary excludes it", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_left", title: "Left" });
    await p.addScene({ id: "scn_right", title: "Right" });
    const order = buildChronology(await p.load());
    const leftEntry = { scene: "scn_left", side: "before" };
    const leftExit = { scene: "scn_left", side: "after" };
    const rightExit = { scene: "scn_right", side: "after" };
    expect(appliesAt(order, {}, leftExit)).toBe(true);
    expect(appliesAt(order, { "valid-from": "baseline" }, "baseline")).toBe("unresolved");
    expect(appliesAt(order, { "valid-from": "baseline" }, null)).toBe("unresolved");
    expect(appliesAt(order, { "valid-from": { scene: "" } }, leftExit)).toBe("unresolved");
    expect(appliesAt(order, { "valid-until": "baseline" }, leftExit)).toBe("unresolved");
    expect(appliesAt(order, { "valid-until": [] }, leftExit)).toBe("unresolved");
    expect(appliesAt(order, {
      validFrom: { sceneId: "scn_left", side: "after" },
      validUntil: { sceneId: "scn_right", side: "before" }
    }, leftEntry)).toBe(false);
    expect(appliesAt(order, {
      "valid-from": { scene: "scn_left", side: "after" },
      "valid-until": { scene: "scn_right", side: "before" }
    }, rightExit)).toBe(false);
    expect(appliesAt(order, {
      "valid-from": { scene: "scn_left", side: "after" },
      "valid-until": { scene: "scn_right", side: "before" }
    }, leftExit)).toBe("unresolved");
    expect(order.compare(null, leftEntry)).toBe("unordered");
    expect(order.compare({ scene: "scn_left", side: "beside" }, leftEntry)).toBe("unordered");
    expect(order.diagnostics.filter((item) => item.code === "INVALID_CURSOR")).toHaveLength(1);
    expect(order.compare({ sceneId: "scn_left", beatId: "", side: "before" }, leftExit)).toBe("before");
  });
});
