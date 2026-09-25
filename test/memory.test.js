import { describe, expect, test } from "bun:test";
import path from "node:path";
import { decisionFindings, decisionsFor, summarizeDecisions } from "../src/memory/decisions.js";
import { applyDismissals, issueFindings, refreshIssueEvidence } from "../src/memory/issues.js";
import { biographyFindings } from "../src/state/knowledge.js";
import { files, invoke, json, writeData } from "./support/cli.js";
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

describe("decision add", () => {
  test("adds a scoped decision from --data and allocates an id", async () => {
    const p = await decisionProject();
    const data = writeData(p, "pov", { status: "accepted", "scope-ids": ["scn_pier"], rationale: "The pier scene is Ada's POV.", source: "Author, chat 2026-09-24" });
    const preview = json(p.root, ["decision", "add", "--data", data, "--dry-run"]);
    expect(preview.code).toBe(0);
    expect(preview.parsed.data).toMatchObject({ status: "accepted", instruction: true, scopeIds: ["scn_pier"], dryRun: true });
    expect(preview.parsed.data.id).toMatch(/^dec_[0-9a-f]{8}$/);
    const added = invoke(p.root, ["decision", "add", "--data", data]);
    expect(added.code).toBe(0);
    expect(added.out).toMatch(/^Added decision dec_[0-9a-f]{8}: decisions\/dec_[0-9a-f]{8}\.md\n$/);
    const project = await p.load();
    expect(project.diagnostics).toEqual([]);
    expect(decisionsFor(project, ["scn_pier"]).instructions.map((item) => item.rationale)).toContain("The pier scene is Ada's POV.");
  });

  test("a proposed decision is recorded but is not an instruction", async () => {
    const p = await decisionProject();
    const data = writeData(p, "maybe", { id: "dec_maybe", status: "proposed", "scope-ids": ["chr_ada"], rationale: "Ada might limp." });
    const result = json(p.root, ["decision", "add", "--data", data]);
    expect(result.parsed.data).toMatchObject({ id: "dec_maybe", status: "proposed", instruction: false });
    expect(decisionsFor(await p.load(), ["chr_ada"]).proposed.map((item) => item.id)).toContain("dec_maybe");
  });

  test("invalid data, a superseded status, supersedes links or a missing scope are invalid invocations", async () => {
    const p = await decisionProject();
    const before = files(p.root);
    const base = { status: "accepted", "scope-ids": ["chr_ada"] };
    const cases = [
      writeData(p, "broken", "{"),
      writeData(p, "extra", { ...base, instructions: "none" }),
      writeData(p, "superseded", { ...base, status: "superseded" }),
      writeData(p, "links", { ...base, supersedes: ["dec_tense"] }),
      writeData(p, "unscoped", { status: "accepted" }),
      writeData(p, "empty-scope", { ...base, "scope-ids": [] }),
      writeData(p, "issue", { ...base, type: "issue" }),
      writeData(p, "bad-id", { ...base, id: "Dec Bad" })
    ];
    for (const data of cases) {
      const result = json(p.root, ["decision", "add", "--data", data]);
      expect([result.code, result.parsed.writes]).toEqual([2, []]);
    }
    expect(invoke(p.root, ["decision", "add"]).code).toBe(2);
    expect(files(p.root)).toEqual(before);
  });

  test("a duplicate id or a dangling scope id writes nothing and exits 1", async () => {
    const p = await decisionProject();
    const before = files(p.root);
    const cases = [
      [{ id: "dec_tense", status: "accepted", "scope-ids": ["chr_ada"] }, "DUPLICATE_RECORD_ID"],
      [{ status: "accepted", "scope-ids": ["chr_ghost"] }, "DANGLING_REFERENCE"]
    ];
    for (const [data, code] of cases) {
      const result = json(p.root, ["decision", "add", "--data", writeData(p, code, data)]);
      expect(result.code).toBe(1);
      expect(result.parsed.diagnostics.map((item) => item.code)).toEqual([code]);
    }
    expect(files(p.root)).toEqual(before);
  });
});

describe("decision list", () => {
  test("lists active decisions, marks proposals, and shows inactive ones only on request", async () => {
    const p = await decisionProject();
    const plain = json(p.root, ["decision", "list"]);
    expect(plain.code).toBe(0);
    expect(plain.parsed.data.decisions.map((item) => [item.id, item.status, item.instruction])).toEqual([
      ["dec_ada_voice", "accepted", true],
      ["dec_cellar_dark", "proposed", false],
      ["dec_tense", "accepted", true]
    ]);
    const all = json(p.root, ["decision", "list", "--include-inactive"]);
    expect(all.parsed.data.decisions.map((item) => item.id)).toContain("dec_pier_rain");
    const text = invoke(p.root, ["decision", "list"]);
    expect(text.out).toBe([
      "Decisions:",
      "- dec_ada_voice [accepted] scope chr_ada: Ada never swears.",
      "- dec_cellar_dark [proposed, not an instruction] scope scn_cellar: Maybe the cellar is unlit.",
      "- dec_tense [accepted] scope prj_00000001: The series is past tense. (source: Author note, 2026-09-01)",
      ""
    ].join("\n"));
    const empty = await makeProject();
    expect(invoke(empty.root, ["decision", "list"]).out).toBe("Decisions:\n- None\n");
  });

  test("--record keeps decisions in that record's scope and project-wide decisions", async () => {
    const p = await decisionProject();
    const cellar = json(p.root, ["decision", "list", "--record", "scn_cellar"]);
    expect(cellar.parsed.data.decisions.map((item) => item.id)).toEqual(["dec_cellar_dark", "dec_tense"]);
    expect(cellar.parsed.data.record).toBe("scn_cellar");
    const missing = json(p.root, ["decision", "list", "--record", "scn_ghost"]);
    expect(missing.code).toBe(1);
    expect(missing.parsed.diagnostics.map((item) => item.code)).toEqual(["RECORD_NOT_FOUND"]);
  });

  test("supersession cycles are reported as errors", async () => {
    const p = await decisionProject();
    await p.addDecision({ id: "dec_a", "scope-ids": ["chr_ada"], supersedes: ["dec_b"] });
    await p.addDecision({ id: "dec_b", status: "superseded", "scope-ids": ["chr_ada"], supersedes: ["dec_a"] });
    const result = invoke(p.root, ["decision", "list", "--include-inactive"]);
    expect(result.code).toBe(1);
    expect(result.err).toContain("error SUPERSESSION_CYCLE: Decisions supersede each other in a cycle: dec_a -> dec_b");
  });
});

describe("decision supersede", () => {
  test("creates the successor and marks the prior decision superseded in one transaction", async () => {
    const p = await decisionProject();
    const data = writeData(p, "tense", { id: "dec_tense_present", rationale: "Switch the series to present tense." });
    const result = json(p.root, ["decision", "supersede", "dec_tense", "--data", data]);
    expect(result.code).toBe(0);
    expect(result.parsed.data).toMatchObject({
      prior: { id: "dec_tense", from: "accepted", to: "superseded" },
      successor: { id: "dec_tense_present", status: "accepted", scopeIds: ["prj_00000001"], supersedes: ["dec_tense"] }
    });
    expect(result.parsed.writes.map((item) => [item.path, item.action])).toEqual([
      ["decisions/dec_tense_present.md", "create"],
      ["decisions/dec_tense.md", "replace"]
    ]);
    const project = await p.load();
    expect(project.diagnostics).toEqual([]);
    expect(project.records.get("dec_tense").record.status).toBe("superseded");
    expect(project.records.get("dec_tense").record.rationale).toBe("The series is past tense.");
    expect(summarizeDecisions(project).find((item) => item.id === "dec_tense").supersededBy).toEqual(["dec_tense_present"]);
    expect(decisionsFor(project, []).instructions.map((item) => item.id)).toEqual(["dec_tense_present"]);
    const text = invoke(p.root, ["decision", "supersede", "dec_ada_voice", "--data", writeData(p, "voice", { "scope-ids": ["chr_ada"] })]);
    expect(text.out).toMatch(/^Superseded decision dec_ada_voice with dec_[0-9a-f]{8}\n$/);
  });

  test("--dry-run previews both writes and changes nothing", async () => {
    const p = await decisionProject();
    const before = files(p.root);
    const result = json(p.root, ["decision", "supersede", "dec_cellar_dark", "--data", writeData(p, "dark", {}), "--dry-run"]);
    expect(result.code).toBe(0);
    expect(result.parsed.data.dryRun).toBe(true);
    expect(result.parsed.writes).toHaveLength(2);
    expect(files(p.root)).toEqual(before);
  });

  test("only proposed or accepted decisions can be superseded, by an accepted successor", async () => {
    const p = await decisionProject();
    const before = files(p.root);
    const unknown = json(p.root, ["decision", "supersede", "dec_ghost", "--data", writeData(p, "a", {})]);
    expect([unknown.code, unknown.parsed.diagnostics[0].code]).toEqual([1, "DECISION_NOT_FOUND"]);
    const notDecision = json(p.root, ["decision", "supersede", "chr_ada", "--data", writeData(p, "b", {})]);
    expect([notDecision.code, notDecision.parsed.diagnostics[0].code]).toEqual([1, "DECISION_NOT_FOUND"]);
    const rejected = json(p.root, ["decision", "supersede", "dec_pier_rain", "--data", writeData(p, "c", {})]);
    expect([rejected.code, rejected.parsed.diagnostics[0].code]).toEqual([1, "DECISION_TRANSITION_INVALID"]);
    for (const data of [{ status: "proposed" }, { supersedes: ["dec_ada_voice"] }, { type: "fact" }, { rationale: 7 }]) {
      expect(json(p.root, ["decision", "supersede", "dec_tense", "--data", writeData(p, "d", data)]).code).toBe(2);
    }
    const same = json(p.root, ["decision", "supersede", "dec_tense", "--data", writeData(p, "e", { id: "dec_tense" })]);
    expect([same.code, same.parsed.diagnostics[0].code]).toEqual([1, "DUPLICATE_RECORD_ID"]);
    expect(invoke(p.root, ["decision", "supersede", "dec_tense"]).code).toBe(2);
    expect(files(p.root)).toEqual(before);
  });

  test("a successor that would close a supersession cycle is rejected", async () => {
    const p = await decisionProject();
    await p.addDecision({ id: "dec_a", "scope-ids": ["chr_ada"], supersedes: ["dec_b"] });
    await p.addDecision({ id: "dec_b", status: "superseded", "scope-ids": ["chr_ada"], supersedes: ["dec_next"] });
    const before = files(p.root);
    const result = json(p.root, ["decision", "supersede", "dec_a", "--data", writeData(p, "cycle", { id: "dec_next" })]);
    expect(result.code).toBe(1);
    expect(result.parsed.diagnostics.map((item) => [item.code, item.recordIds])).toEqual([["SUPERSESSION_CYCLE", ["dec_a", "dec_b", "dec_next"]]]);
    expect(files(p.root)).toEqual(before);
  });

  test("a held lock or a blocking load error stops decision writes", async () => {
    const p = await decisionProject();
    p.write(".story/lock", "{}\n");
    const locked = json(p.root, ["decision", "supersede", "dec_tense", "--data", writeData(p, "lock", {})]);
    expect([locked.code, locked.parsed.diagnostics[0].code]).toEqual([3, "LOCKED"]);
    const lockedAdd = json(p.root, ["decision", "add", "--data", writeData(p, "lock2", { status: "accepted", "scope-ids": ["chr_ada"] })]);
    expect([lockedAdd.code, lockedAdd.parsed.diagnostics[0].code]).toEqual([3, "LOCKED"]);
    const broken = await decisionProject();
    broken.write("decisions/dec_broken.md", "---\nformat: story-toolkit\nschema-version: 1\nid: dec_broken\ntype: decision\n---\n");
    expect(json(broken.root, ["decision", "supersede", "dec_tense", "--data", writeData(broken, "x", {})]).code).toBe(2);
    expect(json(broken.root, ["decision", "add", "--data", writeData(broken, "y", { status: "accepted", "scope-ids": ["chr_ada"] })]).code).toBe(2);
    const missing = json(p.root, ["decision", "list", "--project", path.join(p.root, "nowhere")]);
    expect([missing.code, missing.parsed.diagnostics[0].code]).toEqual([2, "PROJECT_NOT_FOUND"]);
  });
});
