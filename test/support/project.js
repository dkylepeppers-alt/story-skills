import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach } from "bun:test";
import { parseFrontmatter, replaceFrontmatter } from "../../src/frontmatter.js";
import { loadProject } from "../../src/project/load.js";
import { sha256Hex, sourceHash } from "../../src/storage/hash.js";
import { stringify as yamlStringify } from "yaml";

// Fixtures register cleanup through the test runner's afterEach hook: every
// project made here is removed after the test that created it finishes, even
// when the test fails partway through.
const live = new Set();
afterEach(() => {
  for (const cleanup of live) {
    cleanup();
  }
  live.clear();
});

const ENTITY_DIRECTORIES = {
  character: "characters",
  location: "worldbuilding",
  system: "worldbuilding",
  faction: "worldbuilding",
  object: "worldbuilding",
  arc: "plot",
  question: "plot",
  promise: "plot",
  clue: "plot",
  term: "glossary",
  chapter: "chapters",
  matter: "matter"
};

function recordMarkdown(fields, body = "") {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }
    lines.push(...yamlStringify({ [key]: value }, { lineWidth: 0 }).split("\n").filter((line) => line !== ""));
  }
  lines.push("---", "");
  return `${lines.join("\n")}${body}`;
}

export async function makeProject(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "story-toolkit-"));
  live.add(() => fs.rmSync(root, { recursive: true, force: true }));

  const originals = new Map();
  const put = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    if (!originals.has(rel)) {
      originals.set(rel, content.toString());
    }
  };

  put("story.md", recordMarkdown({
    format: "story-toolkit",
    "schema-version": 1,
    id: "prj_00000001",
    type: "project",
    title: options.title ?? "Fixture Project",
    premise: "A fixture premise for tests."
  }, options.storyBody ?? ""));

  put("chapters/one.md", recordMarkdown({
    format: "story-toolkit",
    "schema-version": 1,
    id: "chp_one",
    type: "chapter",
    name: "One",
    title: "One",
    number: 1
  }, options.body ?? ""));

  const findChapterFile = (chapterId) => {
    for (const name of fs.readdirSync(path.join(root, "chapters"))) {
      const rel = `chapters/${name}`;
      if (parseFrontmatter(fs.readFileSync(path.join(root, rel), "utf8"), rel).data.id === chapterId) {
        return rel;
      }
    }
    throw new Error(`No chapter with id ${chapterId}`);
  };

  const p = {
    root,
    read: (rel) => fs.readFileSync(path.join(root, rel), "utf8"),
    write: (rel, content) => put(rel, content),
    hash: (rel) => sha256Hex(fs.readFileSync(path.join(root, rel))),
    bytes: (rel) => {
      const raw = fs.readFileSync(path.join(root, rel));
      const parsed = parseFrontmatter(raw.toString("utf8"), rel);
      return { raw, data: parsed.data, body: parsed.body };
    },
    load: () => loadProject(root),
    initial: (rel) => {
      if (!originals.has(rel)) {
        throw new Error(`No initial content recorded for ${rel}`);
      }
      return originals.get(rel);
    },
    addEntity: async (entity) => {
      const dir = ENTITY_DIRECTORIES[entity.type];
      if (!dir) {
        throw new Error(`Unknown entity type: ${entity.type}`);
      }
      put(`${dir}/${entity.id}.md`, recordMarkdown({
        format: "story-toolkit",
        "schema-version": 1,
        ...entity
      }));
      return entity.id;
    },
    addScene: async (scene) => {
      const { chapter = "chp_one", ...fields } = scene;
      put(`scenes/${scene.id}.md`, recordMarkdown({
        format: "story-toolkit",
        "schema-version": 1,
        type: "scene",
        "chapter-id": chapter,
        ...fields
      }));
      const chapterRel = findChapterFile(chapter);
      put(chapterRel, `${p.read(chapterRel).replace(/\n?$/, "\n")}<!-- story-scene: ${scene.id} -->\n`);
      return scene.id;
    },
    addFact: async (fact) => {
      put(`facts/${fact.id}.md`, recordMarkdown({
        format: "story-toolkit",
        "schema-version": 1,
        type: "fact",
        status: "established",
        kind: "world",
        ...fact
      }));
      return fact.id;
    },
    twoFileReplacement: () => {
      return ["story.md", "chapters/one.md"].map((rel) => ({
        path: rel,
        action: "replace",
        expectedHash: p.hash(rel),
        content: `${p.read(rel)}<!-- touched by the test transaction -->\n`
      }));
    },
    entry: (sceneId) => ({ sceneId, side: "before" }),
    exit: (sceneId) => ({ sceneId, side: "after" }),
    cursor: (sceneId, beatId, side) => ({ sceneId, beatId, side }),
    // A manuscript SourceRef over the current bytes of a scene or beat span.
    source: (sceneId, beatId, rel = "chapters/one.md") => {
      const ref = { path: rel, scene: sceneId };
      if (beatId) ref.beat = beatId;
      ref.hash = sourceHash(root, { path: rel, sceneId, beatId });
      ref.kind = "manuscript";
      return ref;
    }
  };

  return p;
}

export async function setRecordField(root, recordId, field, value) {
  const project = await loadProject(root);
  const entry = project.records.get(recordId);
  if (!entry) {
    throw new Error(`No record with id ${recordId}`);
  }
  const abs = path.join(root, entry.path);
  const markdown = fs.readFileSync(abs, "utf8");
  const parsed = parseFrontmatter(markdown, entry.path);
  const updated = replaceFrontmatter(markdown, { ...parsed.data, [field]: value });
  fs.writeFileSync(abs, updated);
  return updated;
}

export async function makeChronologyFixture() {
  const p = await makeProject();
  await p.addEntity({ id: "obj_brass_key", type: "object", name: "Brass Key" });
  // Reading order is marker order: opening, then the flashback, then an
  // undated scene. Story time puts the flashback first via an explicit after
  // edge and leaves the undated scene unordered.
  await p.addScene({
    id: "scn_opening",
    title: "Opening",
    chronology: { after: ["scn_flashback"] }
  });
  await p.addScene({ id: "scn_flashback", title: "Flashback" });
  await p.addScene({ id: "scn_undated", title: "Undated" });
  await p.addScene({
    id: "scn_aftermath",
    title: "Aftermath",
    chronology: { after: ["scn_opening"] }
  });
  await p.addFact({
    id: "fact_key_placed",
    subject: "obj_brass_key",
    predicate: "location",
    value: "the cellar",
    "valid-from": { scene: "scn_opening", side: "after" }
  });
  return p;
}

// One cellar scene with three beats. Zoë takes the key at beat_handoff, Ada
// learns it at beat_confession, and Ada's false belief that the key is lost
// is established from beat_arrival. Every fact carries a real source hash.
export async function makeKnowledgeFixture() {
  const p = await makeProject();
  await p.addEntity({ id: "chr_zoe", type: "character", name: "Zoë Voss" });
  await p.addEntity({ id: "chr_ada", type: "character", name: "Ada Quill" });
  await p.addEntity({ id: "obj_brass_key", type: "object", name: "Brass Key" });
  await p.addScene({ id: "scn_cellar", title: "Cellar" });
  const marker = "<!-- story-scene: scn_cellar -->\n";
  p.write("chapters/one.md", p.read("chapters/one.md").replace(marker, [
    marker,
    "<!-- story-beat: beat_arrival -->\n",
    "Ada finds the cellar door open and decides the key is lost.\n",
    "<!-- story-beat: beat_handoff -->\n",
    "Zoë slips the brass key into her coat.\n",
    "<!-- story-beat: beat_confession -->\n",
    "“I took it,” Zoë says.\n"
  ].join("")));
  await p.addFact({
    id: "fact_key_handoff",
    subject: "obj_brass_key",
    predicate: "holder",
    value: "chr_zoe",
    "valid-from": { scene: "scn_cellar", beat: "beat_handoff", side: "after" },
    sources: [p.source("scn_cellar", "beat_handoff")]
  });
  await p.addFact({
    id: "fact_ada_learns",
    kind: "knowledge",
    subject: "chr_ada",
    predicate: "knows",
    value: "fact_key_handoff",
    "valid-from": { scene: "scn_cellar", beat: "beat_confession", side: "after" },
    sources: [p.source("scn_cellar", "beat_confession")]
  });
  await p.addFact({
    id: "fact_false_belief",
    kind: "belief",
    subject: "chr_ada",
    predicate: "believes",
    value: "The brass key is lost",
    "valid-from": { scene: "scn_cellar", beat: "beat_arrival", side: "after" },
    sources: [p.source("scn_cellar", "beat_arrival")]
  });
  return p;
}
