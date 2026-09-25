import { describe, expect, test } from "bun:test";
import { validateDocument, validateRecord } from "../src/project/schema.js";
import { makeProject } from "./support/project.js";

function record(fields) {
  return { format: "story-toolkit", "schema-version": 1, ...fields };
}

const VALID_RECORDS = [
  ["project", { id: "prj_00000001", type: "project", title: "The Last Ember" }],
  ["entity", { id: "chr_sera", type: "character", name: "Sera Voss" }],
  ["entity", { id: "loc_mill", type: "location", name: "Old Mill" }],
  ["entity", { id: "chp_one", type: "chapter", name: "One", number: 1 }],
  ["scene", { id: "scn_7f83d6a2", type: "scene", "chapter-id": "chp_one", cast: ["chr_sera"] }],
  ["fact", { id: "fact_key_holder", type: "fact", status: "established", kind: "world", subject: "obj_brass_key", predicate: "holder", value: "chr_marin" }],
  ["decision", { id: "dec_pov_choice", type: "decision", status: "accepted", rationale: "Close POV raises tension." }],
  ["issue", { id: "iss_timeline", type: "issue", category: "continuity", severity: "warning", status: "open" }],
  ["research", { id: "res_tides", type: "research", status: "verified", citations: ["tide tables 1897"] }],
  ["series", { id: "ser_ember", type: "series", books: [{ id: "prj_00000001" }] }],
  ["asset", { id: "ast_sera_face", type: "asset", file: { path: "assets/files/sera.png" }, role: "identity" }],
  ["shot", { id: "sht_cellar", type: "shot", prompt: "A lantern-lit cellar, handoff moment." }]
];

describe("record schemas", () => {
  test("every record class validates against its schema", () => {
    for (const [schemaName, fields] of VALID_RECORDS) {
      const candidate = record(fields);
      expect(validateRecord(candidate), schemaName).toEqual([]);
    }
  });

  test("unknown core fields are rejected with a precise diagnostic", () => {
    const diagnostics = validateRecord(record({ id: "fact_x", type: "fact", status: "established", kind: "world", subject: "a", predicate: "b", value: "c", stablereport: true }));
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("SCHEMA_VIOLATION");
    expect(diagnostics[0].message).toContain("stablereport");
    expect(diagnostics[0].action).toContain("extensions");
  });

  test("a documented extensions object carries project-specific metadata", () => {
    const diagnostics = validateRecord(record({
      id: "fact_x", type: "fact", status: "established", kind: "world",
      subject: "a", predicate: "b", value: "c",
      extensions: { "siren-contract": { mode: "noir" } }
    }));
    expect(diagnostics).toEqual([]);
  });

  test("upstream schema v2 is rejected explicitly, not misread", () => {
    const diagnostics = validateRecord({ "schema-version": 2, id: "chr_old", type: "character", name: "Old" });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("FORMAT_UPSTREAM_V2");
    expect(diagnostics[0].message).toContain("v2");
  });

  test("a missing or wrong format is unsupported", () => {
    const missing = validateRecord({ id: "fact_x", type: "fact", status: "established", kind: "world", subject: "a", predicate: "b", value: "c" });
    expect(missing.map((d) => d.code)).toEqual(["FORMAT_UNSUPPORTED"]);
    const wrong = validateRecord({ format: "other-tool", "schema-version": 1, id: "fact_x", type: "fact", status: "established", kind: "world", subject: "a", predicate: "b", value: "c" });
    expect(wrong.map((d) => d.code)).toEqual(["FORMAT_UNSUPPORTED"]);
  });

  test("a wrong schema-version is rejected", () => {
    const diagnostics = validateRecord({ format: "story-toolkit", "schema-version": 2, id: "fact_x", type: "fact", status: "established", kind: "world", subject: "a", predicate: "b", value: "c" });
    expect(diagnostics.map((d) => d.code)).toEqual(["SCHEMA_VERSION_UNSUPPORTED"]);
  });

  test("unknown record types are named", () => {
    const diagnostics = validateRecord(record({ id: "x", type: "creature" }));
    expect(diagnostics.map((d) => d.code)).toEqual(["UNKNOWN_RECORD_TYPE"]);
  });

  test("fact lifecycle and evidence shapes are enforced", () => {
    const badStatus = validateRecord(record({ id: "fact_x", type: "fact", status: "true", kind: "world", subject: "a", predicate: "b", value: "c" }));
    expect(badStatus.map((d) => d.code)).toEqual(["SCHEMA_VIOLATION"]);
    const badHash = validateRecord(record({
      id: "fact_x", type: "fact", status: "established", kind: "world",
      subject: "a", predicate: "b", value: "c",
      sources: [{ path: "chapters/one.md", hash: "nope", kind: "manuscript" }]
    }));
    expect(badHash.map((d) => d.code)).toEqual(["SCHEMA_VIOLATION"]);
    expect(badHash[0].message).toContain("sources.0.hash");
    const baseline = validateRecord(record({
      id: "fact_x", type: "fact", status: "established", kind: "world",
      subject: "a", predicate: "b", value: "c", "valid-from": "baseline"
    }));
    expect(baseline).toEqual([]);
  });

  test("proposal and scope documents validate", () => {
    const proposal = {
      format: "story-toolkit",
      "schema-version": 1,
      id: "prp_dialogue_fix",
      type: "proposal",
      operation: "working-edit",
      "expected-hashes": { "chapters/one.md": "a".repeat(64) },
      writes: [{ path: "chapters/one.md", action: "replace", "expected-hash": "a".repeat(64), content: "…" }],
      "affected-ids": ["scn_7f83d6a2"],
      changes: [{ id: "fact_key_holder", rationale: "Holder changed in the edit.", sources: [{ path: "chapters/one.md", hash: "a".repeat(64), kind: "manuscript" }] }]
    };
    expect(validateDocument(proposal, "proposal")).toEqual([]);

    const scope = {
      format: "story-toolkit",
      "schema-version": 1,
      files: [{ path: "chapters/one.md", "baseline-hash": "a".repeat(64), ranges: [{ start: 0, end: 20 }] }]
    };
    expect(validateDocument(scope, "scope")).toEqual([]);

    const badProposal = { ...proposal, operation: "mind-edit" };
    expect(validateDocument(badProposal, "proposal").map((d) => d.code)).toEqual(["SCHEMA_VIOLATION"]);
  });
});

describe("loading records from disk", () => {
  test("schema findings carry the file they came from", async () => {
    const p = await makeProject();
    p.write("characters/broken.md", [
      "---",
      "format: story-toolkit",
      "schema-version: 1",
      "id: chr_broken",
      "type: character",
      "name: Broken",
      "stablereport: true",
      "---",
      ""
    ].join("\n"));
    const project = await p.load();
    const finding = project.diagnostics.find((d) => d.code === "SCHEMA_VIOLATION");
    expect(finding.message).toContain("characters/broken.md");
    expect(finding.message).toContain("stablereport");
  });

  test("unparseable records are reported without loading the project down", async () => {
    const p = await makeProject();
    p.write("facts/broken.md", "No frontmatter here\n");
    const project = await p.load();
    expect(project.diagnostics.map((d) => d.code)).toEqual(["RECORD_UNPARSEABLE"]);
    expect(project.records.has("prj_00000001")).toBe(true);
  });
});
