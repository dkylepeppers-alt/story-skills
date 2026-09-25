import { describe, expect, test } from "bun:test";
import { buildChronology } from "../src/state/chronology.js";
import { appliesAt } from "../src/state/cursor.js";
import { makeChronologyFixture, makeProject } from "./support/project.js";

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
    expect(order.compare(p.entry("scn_cellar"), p.cursor("scn_cellar", "beat_approach", "before"))).toBe("before");
    expect(order.compare(p.cursor("scn_cellar", "beat_approach", "after"), p.cursor("scn_cellar", "beat_handoff", "before"))).toBe("before");
    expect(order.compare(p.cursor("scn_cellar", "beat_handoff", "before"), p.cursor("scn_cellar", "beat_handoff", "after"))).toBe("before");
    expect(order.compare(p.cursor("scn_cellar", "beat_handoff", "after"), p.exit("scn_cellar"))).toBe("before");
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
});
