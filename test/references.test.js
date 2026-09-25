import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { loadProject } from "../src/project/load.js";
import { removeEntity } from "../src/project/entities.js";
import { makeProject } from "./support/project.js";

const HASH = "a".repeat(64);

function snapshot(root) {
  const files = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".story") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files[path.relative(root, full)] = fs.readFileSync(full);
    }
  };
  walk(root);
  return files;
}

function dangling(project, target) {
  return project.diagnostics.filter((item) => item.code === "DANGLING_REFERENCE" && item.recordIds.includes(target));
}

describe("reference index", () => {
  test("remove --policy refuse reports a fact cursor and a manuscript scene marker and writes nothing", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    await p.addFact({
      id: "fact_when",
      subject: "chr_ada",
      predicate: "location",
      value: "the pier",
      "valid-from": { scene: "scn_door", side: "after" }
    });
    const before = snapshot(p.root);
    const result = removeEntity(p.root, "scn_door", { policy: "refuse" });

    expect(result.exitCode).not.toBe(0);
    expect(result.envelope.ok).toBe(false);
    expect(result.envelope.writes).toEqual([]);
    const fields = result.envelope.diagnostics.map((item) => item.message).join("\n");
    expect(fields).toContain("valid-from");
    expect(fields).toContain("story-scene");
    expect(snapshot(p.root)).toEqual(before);
    expect(fs.existsSync(path.join(p.root, "scenes", "scn_door.md"))).toBe(true);
  });

  test("remove --policy detach refuses a required fact cursor and writes nothing", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    await p.addFact({
      id: "fact_when",
      subject: "chr_bee",
      predicate: "location",
      value: "the pier",
      "valid-from": { scene: "scn_door", side: "before" }
    });
    const before = snapshot(p.root);
    const result = removeEntity(p.root, "scn_door", { policy: "detach" });

    expect(result.exitCode).not.toBe(0);
    expect(result.envelope.writes).toEqual([]);
    expect(result.envelope.diagnostics.some((item) => item.code === "REQUIRED_REFERENCE")).toBe(true);
    expect(snapshot(p.root)).toEqual(before);
  });

  test("loadProject reports a dangling fact valid-from cursor after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    await p.addFact({
      id: "fact_when",
      subject: "chr_ada",
      predicate: "location",
      value: "the pier",
      "valid-from": { scene: "scn_door", side: "after" }
    });
    expect(dangling(await p.load(), "scn_door")).toEqual([]);
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("valid-from"))).toBe(true);
  });

  test("loadProject reports a dangling fact valid-until cursor after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    await p.addFact({
      id: "fact_until",
      subject: "chr_ada",
      predicate: "location",
      value: "the pier",
      "valid-from": "baseline",
      "valid-until": { scene: "scn_door", side: "before" }
    });
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("valid-until"))).toBe(true);
  });

  test("loadProject reports a dangling sources scene reference after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    await p.addFact({
      id: "fact_src",
      subject: "chr_ada",
      predicate: "location",
      value: "the pier",
      sources: [{ path: "chapters/one.md", hash: HASH, kind: "manuscript", scene: "scn_door" }]
    });
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("sources"))).toBe(true);
  });

  test("loadProject reports a dangling scene after link after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_early", title: "Early" });
    await p.addScene({ id: "scn_late", title: "Late", chronology: { after: ["scn_early"] } });
    fs.rmSync(path.join(p.root, "scenes", "scn_early.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_early").some((item) => item.message.includes("after"))).toBe(true);
  });

  test("loadProject reports a dangling manuscript scene marker after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("story-scene"))).toBe(true);
  });

  test("loadProject reports a dangling fact subject after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addFact({ id: "fact_who", subject: "chr_ada", predicate: "location", value: "the pier" });
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("subject"))).toBe(true);
  });

  test("loadProject reports a dangling fact value after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addFact({ id: "fact_sees", subject: "chr_bee", predicate: "sees", value: "chr_ada" });
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("value"))).toBe(true);
  });

  test("loadProject reports a dangling cast reference after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addScene({ id: "scn_door", title: "Door", cast: ["chr_ada"] });
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("cast"))).toBe(true);
  });

  test("loadProject reports a dangling chapter-id after the chapter file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    fs.rmSync(path.join(p.root, "chapters", "one.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chp_one").some((item) => item.message.includes("chapter-id"))).toBe(true);
  });

  test("loadProject reports a dangling entity source scene after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    await p.addEntity({
      id: "chr_ada",
      type: "character",
      name: "Ada",
      sources: [{ path: "chapters/one.md", hash: HASH, kind: "manuscript", scene: "scn_door" }]
    });
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.recordIds.includes("chr_ada"))).toBe(true);
  });

  test("loadProject reports a dangling issue affected-id after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    p.write("issues/iss_plot.md", `---
format: story-toolkit
schema-version: 1
id: iss_plot
type: issue
category: plot
severity: warning
status: open
affected-ids:
  - chr_ada
---
`);
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("affected-ids"))).toBe(true);
  });

  test("loadProject reports a dangling decision scope id after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    p.write("decisions/dec_keep.md", `---
format: story-toolkit
schema-version: 1
id: dec_keep
type: decision
status: accepted
scope-ids:
  - chr_ada
---
`);
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("scope-ids"))).toBe(true);
  });

  test("loadProject reports a dangling decision supersedes link after the decision file is deleted", async () => {
    const p = await makeProject();
    p.write("decisions/dec_old.md", `---
format: story-toolkit
schema-version: 1
id: dec_old
type: decision
status: superseded
---
`);
    p.write("decisions/dec_new.md", `---
format: story-toolkit
schema-version: 1
id: dec_new
type: decision
status: accepted
supersedes:
  - dec_old
---
`);
    fs.rmSync(path.join(p.root, "decisions", "dec_old.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "dec_old").some((item) => item.message.includes("supersedes"))).toBe(true);
  });

  test("loadProject reports a dangling asset depicts reference after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    p.write("assets/records/ast_face.md", `---
format: story-toolkit
schema-version: 1
id: ast_face
type: asset
file:
  path: assets/face.png
depicts:
  - chr_ada
---
`);
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("depicts"))).toBe(true);
  });

  test("loadProject reports a dangling shot scene-id after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    p.write("shots/sht_door.md", `---
format: story-toolkit
schema-version: 1
id: sht_door
type: shot
prompt: Ada at the door
scene-id: scn_door
---
`);
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("scene-id"))).toBe(true);
  });

  test("loadProject reports a dangling shot asset reference after the asset file is deleted", async () => {
    const p = await makeProject();
    p.write("assets/records/ast_face.md", `---
format: story-toolkit
schema-version: 1
id: ast_face
type: asset
file:
  path: assets/face.png
---
`);
    p.write("shots/sht_door.md", `---
format: story-toolkit
schema-version: 1
id: sht_door
type: shot
prompt: Ada at the door
references:
  - asset: ast_face
    role: identity
---
`);
    fs.rmSync(path.join(p.root, "assets", "records", "ast_face.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "ast_face").some((item) => item.message.includes("references"))).toBe(true);
  });

  test("loadProject reports a dangling research used-by reference after the chapter file is deleted", async () => {
    const p = await makeProject();
    p.write("research/rsc_pier.md", `---
format: story-toolkit
schema-version: 1
id: rsc_pier
type: research
status: open
title: The pier
used-by:
  - chp_one
---
`);
    fs.rmSync(path.join(p.root, "chapters", "one.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chp_one").some((item) => item.message.includes("used-by"))).toBe(true);
  });

  test("loadProject reports a dangling cursor beat when its manuscript marker is removed", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    p.write("chapters/one.md", `${p.read("chapters/one.md").replace(/\n?$/, "\n")}<!-- story-beat: beat_knock -->\n`);
    await p.addFact({
      id: "fact_beat",
      subject: "chr_ada",
      predicate: "location",
      value: "the pier",
      "valid-from": { scene: "scn_door", side: "after", beat: "beat_knock" }
    });
    expect(dangling(await p.load(), "beat_knock")).toEqual([]);
    const chapter = p.read("chapters/one.md").replace("<!-- story-beat: beat_knock -->\n", "");
    p.write("chapters/one.md", chapter);
    const project = await loadProject(p.root);
    expect(dangling(project, "beat_knock").some((item) => item.message.includes("beat"))).toBe(true);
  });

  test("a free-text fact value is not reported as a dangling id", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addFact({ id: "fact_where", subject: "chr_ada", predicate: "location", value: "the pier" });
    const project = await p.load();
    expect(project.diagnostics.filter((item) => item.code === "DANGLING_REFERENCE")).toEqual([]);
  });

  test("remove --policy detach clears an optional after link when nothing required points at the scene", async () => {
    const p = await makeProject();
    p.write("scenes/scn_early.md", `---
format: story-toolkit
schema-version: 1
id: scn_early
type: scene
chapter-id: chp_one
title: Early
---
`);
    p.write("scenes/scn_late.md", `---
format: story-toolkit
schema-version: 1
id: scn_late
type: scene
chapter-id: chp_one
title: Late
chronology:
  after:
    - scn_early
---
`);
    const result = removeEntity(p.root, "scn_early", { policy: "detach" });
    expect(result.exitCode).toBe(0);
    expect(result.envelope.writes.map((item) => item.path).sort()).toEqual(["scenes/scn_early.md", "scenes/scn_late.md"]);
    const project = await loadProject(p.root);
    expect(project.records.has("scn_early")).toBe(false);
    expect(project.records.get("scn_late").record.chronology.after).toEqual([]);
    expect(project.diagnostics.filter((item) => item.code === "DANGLING_REFERENCE")).toEqual([]);
  });

  test("remove does not delete a target named only by a schema-invalid fact", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    p.write("facts/fact_bad.md", `---
format: story-toolkit
schema-version: 1
id: fact_bad
type: fact
subject: chr_ada
---
`);
    const before = snapshot(p.root);
    const result = removeEntity(p.root, "chr_ada", { policy: "detach" });
    expect(result.exitCode).toBe(2);
    expect(result.envelope.ok).toBe(false);
    expect(result.envelope.writes).toEqual([]);
    expect(result.envelope.diagnostics.some((item) => item.code === "SCHEMA_VIOLATION")).toBe(true);
    expect(result.envelope.diagnostics.some((item) => item.message.includes("subject"))).toBe(true);
    expect(snapshot(p.root)).toEqual(before);
    expect(fs.existsSync(path.join(p.root, "characters", "chr_ada.md"))).toBe(true);
  });

  test("loadProject reports a dangling issue evidence scene after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    p.write("issues/iss_plot.md", `---
format: story-toolkit
schema-version: 1
id: iss_plot
type: issue
category: plot
severity: warning
status: open
evidence:
  - path: chapters/one.md
    hash: ${HASH}
    kind: manuscript
    scene: scn_door
---
`);
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("evidence"))).toBe(true);
  });

  test("loadProject reports a dangling dismissal record id after the entity file is deleted", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    p.write("issues/iss_plot.md", `---
format: story-toolkit
schema-version: 1
id: iss_plot
type: issue
category: plot
severity: warning
status: dismissed
dismissal:
  record-id: chr_ada
  reason: checked against the manuscript
---
`);
    fs.rmSync(path.join(p.root, "characters", "chr_ada.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "chr_ada").some((item) => item.message.includes("record-id"))).toBe(true);
  });

  test("loadProject reports a dangling shot beat id when its manuscript marker is removed", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    p.write("chapters/one.md", `${p.read("chapters/one.md").replace(/\n?$/, "\n")}<!-- story-beat: beat_knock -->\n`);
    p.write("shots/sht_door.md", `---
format: story-toolkit
schema-version: 1
id: sht_door
type: shot
prompt: Ada knocks
beat-id: beat_knock
---
`);
    expect(dangling(await p.load(), "beat_knock")).toEqual([]);
    p.write("chapters/one.md", p.read("chapters/one.md").replace("<!-- story-beat: beat_knock -->\n", ""));
    const project = await loadProject(p.root);
    expect(dangling(project, "beat_knock").some((item) => item.message.includes("beat"))).toBe(true);
  });

  test("loadProject reports a dangling unresolved fact after the fact file is deleted", async () => {
    const p = await makeProject();
    await p.addFact({ id: "fact_color", subject: "chr_ada", predicate: "color", value: "the pier" });
    p.write("shots/sht_door.md", `---
format: story-toolkit
schema-version: 1
id: sht_door
type: shot
prompt: Ada at the door
unresolved-facts:
  - fact_color
---
`);
    fs.rmSync(path.join(p.root, "facts", "fact_color.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "fact_color").some((item) => item.message.includes("unresolved-facts"))).toBe(true);
  });

  test("loadProject reports a dangling asset source scene after the scene file is deleted", async () => {
    const p = await makeProject();
    await p.addScene({ id: "scn_door", title: "Door" });
    p.write("assets/records/ast_face.md", `---
format: story-toolkit
schema-version: 1
id: ast_face
type: asset
file:
  path: assets/face.png
source:
  path: chapters/one.md
  hash: ${HASH}
  kind: manuscript
  scene: scn_door
---
`);
    fs.rmSync(path.join(p.root, "scenes", "scn_door.md"));
    const project = await loadProject(p.root);
    expect(dangling(project, "scn_door").some((item) => item.message.includes("source"))).toBe(true);
  });
});
