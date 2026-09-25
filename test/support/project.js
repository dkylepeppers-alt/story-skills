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
  await p.addScene({ id: "scn_opening", title: "Opening" });
  await p.addScene({ id: "scn_aftermath", title: "Aftermath", chronology: { after: ["scn_opening"] } });
  await p.addFact({
    id: "fact_key_placed",
    subject: "obj_brass_key",
    predicate: "location",
    value: "the cellar",
    "valid-from": { scene: "scn_opening", side: "after" }
  });
  return p;
}

export async function makeKnowledgeFixture() {
  const p = await makeProject();
  await p.addEntity({ id: "chr_zoe", type: "character", name: "Zoë Voss" });
  await p.addEntity({ id: "obj_brass_key", type: "object", name: "Brass Key" });
  await p.addScene({ id: "scn_cellar", title: "Cellar" });
  await p.addFact({
    id: "fact_key_handoff",
    kind: "knowledge",
    subject: "chr_zoe",
    predicate: "holder",
    value: "obj_brass_key",
    "valid-from": { scene: "scn_cellar", side: "after" },
    sources: [{
      path: "chapters/one.md",
      scene: "scn_cellar",
      hash: sourceHash(p.root, { path: "chapters/one.md", sceneId: "scn_cellar" }),
      kind: "manuscript"
    }]
  });
  return p;
}
