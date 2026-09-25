import { describe, expect, test } from "bun:test";
import { decisionFindings, decisionsFor, summarizeDecisions } from "../src/memory/decisions.js";
import { applyDismissals, issueFindings, refreshIssueEvidence } from "../src/memory/issues.js";
import { biographyFindings } from "../src/state/knowledge.js";
import { makeProject } from "./support/project.js";

function codes(list) {
  return list.map((item) => item.code);
}

async function decisionProject() {
  const p = await makeProject();
  await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
  await p.addScene({ id: "scn_cellar", title: "Cellar" });
  await p.addScene({ id: "scn_pier", title: "Pier" });
  await p.addDecision({ id: "dec_tense", "scope-ids": ["prj_00000001"], rationale: "The series is past tense.", source: "Author note, 2026-09-01" });
  await p.addDecision({ id: "dec_ada_voice", "scope-ids": ["chr_ada"], rationale: "Ada never swears." });
  await p.addDecision({ id: "dec_cellar_dark", status: "proposed", "scope-ids": ["scn_cellar"], rationale: "Maybe the cellar is unlit." });
  await p.addDecision({ id: "dec_pier_rain", status: "rejected", "scope-ids": ["scn_pier"], rationale: "Rain was considered and rejected." });
  return p;
}

describe("decisions", () => {
  test("accepted decisions in scope are instructions; proposed ones are returned apart", async () => {
    const p = await decisionProject();
    const project = await p.load();
    const cellar = decisionsFor(project, ["scn_cellar", "chr_ada"]);
    expect(cellar.instructions.map((item) => item.id)).toEqual(["dec_ada_voice", "dec_tense"]);
    expect(cellar.proposed.map((item) => item.id)).toEqual(["dec_cellar_dark"]);
    const pier = decisionsFor(project, ["scn_pier"]);
    expect(pier.instructions.map((item) => item.id)).toEqual(["dec_tense"]);
    expect(pier.proposed).toEqual([]);
  });

  test("summaries keep rationale, source and supersession links", async () => {
    const p = await decisionProject();
    await p.addDecision({ id: "dec_tense_v1", status: "superseded", "scope-ids": ["prj_00000001"], rationale: "Present tense." });
    await p.addDecision({ id: "dec_tense_v2", "scope-ids": ["prj_00000001"], supersedes: ["dec_tense_v1"], rationale: "Past tense." });
    const summaries = summarizeDecisions(await p.load());
    const v1 = summaries.find((item) => item.id === "dec_tense_v1");
    expect(v1).toMatchObject({ status: "superseded", instruction: false, supersededBy: ["dec_tense_v2"] });
    const tense = summaries.find((item) => item.id === "dec_tense");
    expect(tense).toMatchObject({
      status: "accepted",
      instruction: true,
      scopeIds: ["prj_00000001"],
      rationale: "The series is past tense.",
      source: "Author note, 2026-09-01",
      supersedes: [],
      supersededBy: [],
      path: "decisions/dec_tense.md"
    });
    expect(summaries.find((item) => item.id === "dec_cellar_dark").instruction).toBe(false);
  });

  test("supersession cycles and links to non-decisions are errors", async () => {
    const p = await decisionProject();
    await p.addDecision({ id: "dec_a", "scope-ids": ["chr_ada"], supersedes: ["dec_b"] });
    await p.addDecision({ id: "dec_b", status: "superseded", "scope-ids": ["chr_ada"], supersedes: ["dec_c"] });
    await p.addDecision({ id: "dec_c", status: "superseded", "scope-ids": ["chr_ada"], supersedes: ["dec_a"] });
    await p.addDecision({ id: "dec_self", "scope-ids": ["chr_ada"], supersedes: ["dec_self"] });
    await p.addDecision({ id: "dec_odd", "scope-ids": ["chr_ada"], supersedes: ["chr_ada"] });
    const findings = decisionFindings(await p.load());
    expect(findings.map((item) => [item.code, item.recordIds])).toEqual([
      ["SUPERSESSION_CYCLE", ["dec_a", "dec_b", "dec_c"]],
      ["SUPERSESSION_CYCLE", ["dec_self"]],
      ["SUPERSEDES_NOT_DECISION", ["dec_odd", "chr_ada"]]
    ]);
    expect(findings.every((item) => item.severity === "error")).toBe(true);
    expect(decisionFindings(await (await decisionProject()).load())).toEqual([]);
  });
});

describe("issue evidence", () => {
  test("a dismissal does not suppress changed evidence", async () => {
    const p = await makeProject({ issue: "dismissed" });
    await p.write("chapters/one.md", p.read("chapters/one.md") + "\nA changed event.\n");
    const issues = refreshIssueEvidence(await p.load());
    expect(issues.find((i) => i.id === "issue_fixture").status).toBe("open");
  });

  test("a reopened issue keeps its prior disposition and names the changed evidence", async () => {
    const p = await makeProject({ issue: "dismissed" });
    const unchanged = refreshIssueEvidence(await p.load())[0];
    expect(unchanged).toMatchObject({ id: "issue_fixture", status: "dismissed", storedStatus: "dismissed", changedEvidence: [], reopened: null });
    const recorded = p.fileSource("chapters/one.md").hash;
    p.write("chapters/one.md", `${p.read("chapters/one.md")}\nA changed event.\n`);
    const project = await p.load();
    const [issue] = refreshIssueEvidence(project);
    expect(issue.storedStatus).toBe("dismissed");
    expect(issue.changedEvidence).toEqual([{ path: "chapters/one.md", recorded, current: p.fileSource("chapters/one.md").hash }]);
    expect(issue.reopened).toEqual({
      from: "dismissed",
      dismissal: { code: "FIXTURE_FINDING", "record-id": "chp_one", reason: "Intentional in the fixture." }
    });
    const findings = issueFindings(project);
    expect(codes(findings)).toEqual(["ISSUE_REOPENED"]);
    expect(findings[0]).toMatchObject({ severity: "warning", recordIds: ["issue_fixture", "chp_one"] });
    expect(findings[0].message).toContain("was dismissed (FIXTURE_FINDING): Intentional in the fixture.");
  });

  test("unreadable evidence reopens a dismissal too, and open or resolved issues stay as stored", async () => {
    const p = await makeProject({ issue: "dismissed" });
    await p.addIssue({ id: "issue_open", "affected-ids": ["chp_one"], evidence: [p.fileSource("story.md")] });
    await p.addIssue({ id: "issue_done", status: "resolved", "affected-ids": ["chp_one"], evidence: [p.fileSource("story.md")] });
    p.write("story.md", `${p.read("story.md")}\nEdited.\n`);
    const gone = p.fileSource("chapters/one.md");
    await p.addIssue({ id: "issue_ghost", status: "dismissed", "affected-ids": ["chp_one"], evidence: [{ ...gone, path: "chapters/missing.md" }], dismissal: { code: "FIXTURE_FINDING", reason: "Gone." } });
    const issues = refreshIssueEvidence(await p.load());
    expect(issues.map((item) => [item.id, item.status, item.changedEvidence.length])).toEqual([
      ["issue_done", "resolved", 1],
      ["issue_fixture", "dismissed", 0],
      ["issue_ghost", "open", 1],
      ["issue_open", "open", 1]
    ]);
    expect(issues.find((item) => item.id === "issue_ghost").changedEvidence[0].current).toBeNull();
  });

  test("a dismissal without an exact code, affected ids or evidence is unbound", async () => {
    const p = await makeProject();
    const evidence = [p.fileSource("chapters/one.md")];
    await p.addIssue({ id: "issue_no_code", status: "dismissed", "affected-ids": ["chp_one"], evidence, dismissal: { reason: "No code." } });
    await p.addIssue({ id: "issue_no_ids", status: "dismissed", evidence, dismissal: { code: "FIXTURE_FINDING", reason: "No ids." } });
    await p.addIssue({ id: "issue_no_evidence", status: "dismissed", "affected-ids": ["chp_one"], dismissal: { code: "FIXTURE_FINDING", reason: "No evidence." } });
    await p.addIssue({ id: "issue_bare", status: "dismissed", "affected-ids": ["chp_one"], evidence });
    await p.addIssue({ id: "issue_stray", status: "dismissed", "affected-ids": ["chp_one"], evidence, dismissal: { code: "FIXTURE_FINDING", "record-id": "prj_00000001", reason: "Wrong record." } });
    const findings = issueFindings(await p.load());
    expect(findings.map((item) => [item.code, item.recordIds[0]])).toEqual([
      ["ISSUE_DISMISSAL_UNBOUND", "issue_bare"],
      ["ISSUE_DISMISSAL_UNBOUND", "issue_no_code"],
      ["ISSUE_DISMISSAL_UNBOUND", "issue_no_evidence"],
      ["ISSUE_DISMISSAL_UNBOUND", "issue_no_ids"],
      ["ISSUE_DISMISSAL_UNBOUND", "issue_stray"]
    ]);
    expect(findings.every((item) => item.severity === "error")).toBe(true);
  });
});

describe("exact dismissals", () => {
  async function biographyProject() {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addEntity({ id: "chr_zoe", type: "character", name: "Zoë" });
    p.write("characters/chr_ada.md", `${p.read("characters/chr_ada.md")}## Later life\n\nAda eventually runs the guild.\n`);
    p.write("characters/chr_zoe.md", `${p.read("characters/chr_zoe.md")}## Later life\n\nZoë eventually leaves.\n`);
    await p.addIssue({
      id: "issue_ada_bio",
      status: "dismissed",
      "affected-ids": ["chr_ada"],
      evidence: [p.fileSource("characters/chr_ada.md")],
      dismissal: { code: "UNSPLIT_BIOGRAPHY", "record-id": "chr_ada", reason: "Ada's epilogue profile is intentional." }
    });
    return p;
  }

  test("one dismissal cannot hide the same code on a different record", async () => {
    const p = await biographyProject();
    const project = await p.load();
    const findings = biographyFindings(project);
    expect(findings.map((item) => [item.code, item.recordIds])).toEqual([
      ["UNSPLIT_BIOGRAPHY", ["chr_ada"]],
      ["UNSPLIT_BIOGRAPHY", ["chr_zoe"]]
    ]);
    const applied = applyDismissals(project, findings);
    expect(applied.diagnostics.map((item) => item.recordIds)).toEqual([["chr_zoe"]]);
    expect(applied.dismissed.map((item) => [item.code, item.recordIds, item.dismissedBy, item.reason])).toEqual([
      ["UNSPLIT_BIOGRAPHY", ["chr_ada"], "issue_ada_bio", "Ada's epilogue profile is intentional."]
    ]);
    expect(applied.reopened).toEqual([]);
  });

  test("a dismissal matches the exact code and record set, never a substring or a superset", async () => {
    const p = await biographyProject();
    const project = await p.load();
    const [ada] = biographyFindings(project, ["chr_ada"]);
    const variants = [
      { ...ada, code: "UNSPLIT_BIOGRAPHY_EXTRA" },
      { ...ada, code: "UNSPLIT" },
      { ...ada, recordIds: ["chr_ada", "chr_zoe"] },
      { ...ada, recordIds: [] },
      { ...ada, message: "UNSPLIT_BIOGRAPHY chr_ada Ada's epilogue profile is intentional.", recordIds: ["chr_zoe"] }
    ];
    expect(applyDismissals(project, variants).dismissed).toEqual([]);
  });

  test("changed evidence stops the dismissal and reports the reopened issue", async () => {
    const p = await biographyProject();
    p.write("characters/chr_ada.md", `${p.read("characters/chr_ada.md")}She also marries.\n`);
    const project = await p.load();
    const applied = applyDismissals(project, biographyFindings(project));
    expect(applied.dismissed).toEqual([]);
    expect(applied.diagnostics.map((item) => item.recordIds)).toEqual([["chr_ada"], ["chr_zoe"]]);
    expect(codes(applied.reopened)).toEqual(["ISSUE_REOPENED"]);
  });

  test("an open or resolved issue does not dismiss anything", async () => {
    const p = await biographyProject();
    await setIssue(p, "resolved");
    const project = await p.load();
    expect(applyDismissals(project, biographyFindings(project)).dismissed).toEqual([]);
  });
});

async function setIssue(p, status) {
  const text = p.read("issues/issue_ada_bio.md").replace("status: dismissed", `status: ${status}`);
  p.write("issues/issue_ada_bio.md", text);
}
