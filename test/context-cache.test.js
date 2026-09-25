import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { CACHE_VERSION, cacheKey, cachedContext } from "../src/context/cache.js";
import { buildContext } from "../src/context/build.js";
import { SCHEMA_VERSION } from "../src/contracts.js";
import { makeKnowledgeFixture } from "./support/project.js";

const draftAtExit = (p) => ({ task: "draft", target: p.exit("scn_cellar") });
const ids = (packet) => packet.items.map((item) => item.id);

function cacheFile(p, key) {
  return path.join(p.root, ".story", "cache", "context", `${key}.json`);
}

describe("context cache", () => {
  test("a repeat request is a hit and returns the same packet as a fresh build", async () => {
    const p = await makeKnowledgeFixture();
    const first = cachedContext(await p.load(), draftAtExit(p));
    expect(first.cache).toMatchObject({ hit: false, stored: true });
    expect(first.cache.key).toMatch(/^[0-9a-f]{64}$/);
    const stored = JSON.parse(fs.readFileSync(cacheFile(p, first.cache.key), "utf8"));
    expect(stored).toMatchObject({ cacheVersion: CACHE_VERSION, schemaVersion: SCHEMA_VERSION, key: first.cache.key });
    const second = cachedContext(await p.load(), draftAtExit(p));
    expect(second.cache).toEqual({ hit: true, key: first.cache.key, stored: true });
    expect(second.packet).toEqual(buildContext(await p.load(), draftAtExit(p)));
  });

  test("query options are part of the key", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    const base = cacheKey(project, draftAtExit(p));
    expect(cacheKey(project, { ...draftAtExit(p), maxBytes: 9000 })).not.toBe(base);
    expect(cacheKey(project, { ...draftAtExit(p), constraints: ["Keep it short."] })).not.toBe(base);
    expect(cacheKey(project, { task: "revise", target: p.exit("scn_cellar") })).not.toBe(base);
    // A spelled-out default is the same query.
    expect(cacheKey(project, { ...draftAtExit(p), audience: "writer", maxBytes: 48000 })).toBe(base);
  });

  test("a prose edit invalidates the entry and the fresh packet shows the new prose", async () => {
    const p = await makeKnowledgeFixture();
    const first = cachedContext(await p.load(), draftAtExit(p));
    p.write("chapters/one.md", p.read("chapters/one.md").replace("“I took it,” Zoë says.", "“I kept it,” Zoë says."));
    const second = cachedContext(await p.load(), draftAtExit(p));
    expect(second.cache.hit).toBe(false);
    expect(second.cache.key).not.toBe(first.cache.key);
    expect(second.packet.items.find((item) => item.id === "prose:scn_cellar").content).toContain("I kept it");
  });

  test("a newly linked record invalidates and appears; removing it invalidates again", async () => {
    const p = await makeKnowledgeFixture();
    const first = cachedContext(await p.load(), draftAtExit(p));
    expect(ids(first.packet)).not.toContain("dec_cellar_dark");
    await p.addDecision({ id: "dec_cellar_dark", "scope-ids": ["scn_cellar"], rationale: "Lantern light only." });
    const linked = cachedContext(await p.load(), draftAtExit(p));
    expect(linked.cache.hit).toBe(false);
    expect(ids(linked.packet)).toContain("dec_cellar_dark");
    fs.rmSync(path.join(p.root, "decisions", "dec_cellar_dark.md"));
    const removed = cachedContext(await p.load(), draftAtExit(p));
    expect(removed.cache.key).toBe(first.cache.key);
    expect(ids(removed.packet)).not.toContain("dec_cellar_dark");
  });

  test("edits to unselected candidates, style files and non-record evidence all change the key", async () => {
    const p = await makeKnowledgeFixture();
    p.write("research/notes.txt", "Locks of the period.\n");
    await p.addEntity({ id: "que_thief", type: "question", name: "Who took the key?" });
    await p.addFact({
      id: "fact_lock_age",
      subject: "obj_brass_key",
      predicate: "status",
      value: "old",
      sources: [p.fileSource("research/notes.txt", "research")]
    });
    p.write("story.md", p.read("story.md").replace("premise: A fixture premise for tests.", "premise: A fixture premise for tests.\nstyle-sources:\n  - styles/voice.md"));
    p.write("styles/voice.md", "Short sentences.\n");
    const keys = new Set();
    const key = async () => cacheKey(await p.load(), draftAtExit(p));
    keys.add(await key());
    expect(ids(buildContext(await p.load(), draftAtExit(p)))).not.toContain("que_thief");
    p.write("plot/que_thief.md", p.read("plot/que_thief.md").replace("Who took the key?", "Who has the key?"));
    keys.add(await key());
    p.write("styles/voice.md", "Long sentences.\n");
    keys.add(await key());
    fs.rmSync(path.join(p.root, "styles", "voice.md"));
    keys.add(await key());
    p.write("research/notes.txt", "Locks of another period.\n");
    keys.add(await key());
    expect(keys.size).toBe(5);
    // The rebuilt packet reports the removed style file.
    const packet = cachedContext(await p.load(), draftAtExit(p)).packet;
    expect(packet.diagnostics.map((item) => item.code)).toContain("STYLE_SOURCE_UNREADABLE");
  });

  test("a schema or cache version change, a corrupt entry or a foreign entry is never reused", async () => {
    const p = await makeKnowledgeFixture();
    const project = await p.load();
    const current = cachedContext(project, draftAtExit(p));
    const next = cachedContext(project, draftAtExit(p), { schemaVersion: SCHEMA_VERSION + 1 });
    expect(next.cache.hit).toBe(false);
    expect(next.cache.key).not.toBe(current.cache.key);
    const file = cacheFile(p, current.cache.key);
    const stored = JSON.parse(fs.readFileSync(file, "utf8"));
    const poisoned = { ...stored.packet, items: [] };
    for (const entry of [
      { ...stored, cacheVersion: CACHE_VERSION + 1, packet: poisoned },
      { ...stored, schemaVersion: SCHEMA_VERSION + 1, packet: poisoned },
      { ...stored, key: "0".repeat(64), packet: poisoned },
      { ...stored, packet: null }
    ]) {
      fs.writeFileSync(file, JSON.stringify(entry));
      const again = cachedContext(project, draftAtExit(p));
      expect(again.cache.hit).toBe(false);
      expect(again.packet).toEqual(current.packet);
      expect(JSON.parse(fs.readFileSync(file, "utf8"))).toEqual(stored);
    }
    fs.writeFileSync(file, "{ not json");
    expect(cachedContext(project, draftAtExit(p)).cache.hit).toBe(false);
    expect(cachedContext(project, draftAtExit(p)).cache.hit).toBe(true);
  });

  test("invalid requests are not cached, and an unwritable cache still returns the packet", async () => {
    const p = await makeKnowledgeFixture();
    const invalid = cachedContext(await p.load(), { task: "draft" });
    expect(invalid.cache).toEqual({ hit: false, key: null, stored: false });
    expect(invalid.packet.diagnostics.map((item) => item.code)).toEqual(["REQUEST_INVALID"]);
    expect(fs.existsSync(path.join(p.root, ".story"))).toBe(false);
    p.write(".story", "a file where the cache directory would go\n");
    const blocked = cachedContext(await p.load(), draftAtExit(p));
    expect(blocked.cache).toMatchObject({ hit: false, stored: false });
    expect(blocked.cache.warning).toContain(".story");
    expect(blocked.packet).toEqual(buildContext(await p.load(), draftAtExit(p)));
  });

  test("the cache never writes through a symlink that leaves the project", async () => {
    const p = await makeKnowledgeFixture();
    const outside = fs.mkdtempSync(path.join(path.dirname(p.root), "story-outside-"));
    try {
      fs.symlinkSync(outside, path.join(p.root, ".story"));
      const result = cachedContext(await p.load(), draftAtExit(p));
      expect(result.cache).toMatchObject({ hit: false, stored: false });
      expect(result.cache.warning).toContain("outside the project root");
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});
