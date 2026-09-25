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

async function issueProject() {
  const p = await makeProject({ issue: "dismissed" });
  await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
  await p.addIssue({ id: "issue_open", "affected-ids": ["chr_ada"], evidence: [p.fileSource("characters/chr_ada.md")] }, "Ada's eye colour drifts.\n");
  await p.addIssue({ id: "issue_done", status: "resolved", "affected-ids": ["chp_one"], evidence: [p.fileSource("story.md")] });
  return p;
}

describe("issue add", () => {
  test("adds an open issue, hashes its evidence and starts a readable history", async () => {
    const p = await issueProject();
    const data = writeData(p, "gap", {
      category: "continuity",
      severity: "error",
      "affected-ids": ["chr_ada"],
      evidence: [{ path: "characters/chr_ada.md", kind: "manuscript" }]
    });
    const preview = json(p.root, ["issue", "add", "--data", data, "--dry-run"]);
    expect(preview.code).toBe(0);
    expect(preview.parsed.data).toMatchObject({ status: "open", severity: "error", affectedIds: ["chr_ada"], dryRun: true });
    expect(preview.parsed.data.id).toMatch(/^issue_[0-9a-f]{8}$/);
    const added = invoke(p.root, ["issue", "add", "--data", writeData(p, "gap2", { id: "issue_gap", category: "continuity", severity: "error", "affected-ids": ["chr_ada"], evidence: [{ path: "characters/chr_ada.md", kind: "manuscript" }] })]);
    expect(added.code).toBe(0);
    expect(added.out).toBe("Added issue issue_gap: issues/issue_gap.md\n");
    const project = await p.load();
    expect(project.diagnostics).toEqual([]);
    expect(project.records.get("issue_gap").record.evidence[0].hash).toBe(p.fileSource("characters/chr_ada.md").hash);
    expect(p.read("issues/issue_gap.md").endsWith("## History\n\n- opened\n")).toBe(true);
  });

  test("a non-open status, a dismissal, or schema-invalid data is an invalid invocation", async () => {
    const p = await issueProject();
    const before = files(p.root);
    const base = { category: "continuity", severity: "warning" };
    const cases = [
      writeData(p, "broken", "[1]"),
      writeData(p, "dismissed", { ...base, status: "dismissed" }),
      writeData(p, "dismissal", { ...base, dismissal: { code: "X", reason: "y" } }),
      writeData(p, "severity", { ...base, severity: "fatal" }),
      writeData(p, "nocategory", { severity: "warning" }),
      writeData(p, "type", { ...base, type: "decision" }),
      writeData(p, "bad-id", { ...base, id: "Issue Bad" })
    ];
    for (const data of cases) {
      const result = json(p.root, ["issue", "add", "--data", data]);
      expect([result.code, result.parsed.writes]).toEqual([2, []]);
    }
    expect(files(p.root)).toEqual(before);
  });

  test("a duplicate id, a dangling affected id, unreadable or stale evidence writes nothing", async () => {
    const p = await issueProject();
    const before = files(p.root);
    const base = { category: "continuity", severity: "warning" };
    const cases = [
      [{ ...base, id: "issue_open" }, 1, "DUPLICATE_RECORD_ID"],
      [{ ...base, "affected-ids": ["chr_ghost"] }, 1, "DANGLING_REFERENCE"],
      [{ ...base, evidence: [{ path: "chapters/missing.md", kind: "manuscript" }] }, 1, "SOURCE_UNREADABLE"],
      [{ ...base, evidence: [{ path: "story.md", hash: "0".repeat(64), kind: "manuscript" }] }, 3, "STALE_SOURCE"]
    ];
    for (const [data, exitCode, code] of cases) {
      const result = json(p.root, ["issue", "add", "--data", writeData(p, code, data)]);
      expect([result.code, result.parsed.diagnostics.map((item) => item.code)]).toEqual([exitCode, [code]]);
    }
    expect(files(p.root)).toEqual(before);
  });
});

describe("issue list", () => {
  test("lists open issues, including reopened dismissals, and inactive ones on request", async () => {
    const p = await issueProject();
    const plain = json(p.root, ["issue", "list"]);
    expect(plain.code).toBe(0);
    expect(plain.parsed.data.issues.map((item) => [item.id, item.status])).toEqual([["issue_open", "open"]]);
    const all = json(p.root, ["issue", "list", "--include-inactive"]);
    expect(all.parsed.data.issues.map((item) => [item.id, item.status])).toEqual([
      ["issue_done", "resolved"],
      ["issue_fixture", "dismissed"],
      ["issue_open", "open"]
    ]);
    p.write("chapters/one.md", `${p.read("chapters/one.md")}\nA changed event.\n`);
    const text = invoke(p.root, ["issue", "list"]);
    expect(text.code).toBe(0);
    expect(text.out).toBe([
      "Issues:",
      "- issue_fixture [open warning continuity] affects chp_one (reopened; was dismissed (FIXTURE_FINDING): Intentional in the fixture.)",
      "- issue_open [open warning continuity] affects chr_ada",
      "",
      "Diagnostics:",
      `- warning ISSUE_REOPENED: ${issueFindings(await p.load())[0].message}`,
      ""
    ].join("\n"));
    const empty = await makeProject();
    expect(invoke(empty.root, ["issue", "list"]).out).toBe("Issues:\n- None\n");
  });

  test("--record keeps issues that affect that record; unknown records and unbound dismissals are errors", async () => {
    const p = await issueProject();
    const ada = json(p.root, ["issue", "list", "--record", "chr_ada", "--include-inactive"]);
    expect(ada.parsed.data.issues.map((item) => item.id)).toEqual(["issue_open"]);
    const ghost = json(p.root, ["issue", "list", "--record", "chr_ghost"]);
    expect([ghost.code, ghost.parsed.diagnostics[0].code]).toEqual([1, "RECORD_NOT_FOUND"]);
    await p.addIssue({ id: "issue_loose", status: "dismissed", "affected-ids": ["chp_one"], evidence: [p.fileSource("story.md")], dismissal: { reason: "No code." } });
    const unbound = invoke(p.root, ["issue", "list", "--include-inactive"]);
    expect(unbound.code).toBe(1);
    expect(unbound.err).toContain("error ISSUE_DISMISSAL_UNBOUND: issues/issue_loose.md");
  });
});

describe("issue resolve and dismiss", () => {
  test("dismiss binds the exact code, affected ids and current evidence and records the reason", async () => {
    const p = await issueProject();
    p.write("characters/chr_ada.md", `${p.read("characters/chr_ada.md")}Ada's eyes are green.\n`);
    const data = writeData(p, "dismiss", { code: "EYE_COLOUR", "record-id": "chr_ada", reason: "Heterochromia is intentional." });
    const result = json(p.root, ["issue", "dismiss", "issue_open", "--data", data]);
    expect(result.code).toBe(0);
    expect(result.parsed.data).toMatchObject({ id: "issue_open", from: "open", to: "dismissed" });
    expect(result.parsed.writes.map((item) => [item.path, item.action])).toEqual([["issues/issue_open.md", "replace"]]);
    const project = await p.load();
    const record = project.records.get("issue_open").record;
    expect(record.status).toBe("dismissed");
    expect(record.dismissal).toEqual({ code: "EYE_COLOUR", "record-id": "chr_ada", reason: "Heterochromia is intentional." });
    expect(record.evidence[0].hash).toBe(p.fileSource("characters/chr_ada.md").hash);
    expect(p.read("issues/issue_open.md")).toContain("Ada's eye colour drifts.\n\n## History\n\n- dismissed (EYE_COLOUR on chr_ada): Heterochromia is intentional.\n");
    const finding = { code: "EYE_COLOUR", severity: "warning", message: "eyes", recordIds: ["chr_ada"] };
    expect(applyDismissals(project, [finding]).dismissed.map((item) => item.dismissedBy)).toEqual(["issue_open"]);
    expect(invoke(p.root, ["issue", "dismiss", "issue_open", "--data", data]).out).toBe("");
  });

  test("a reopened dismissal can be dismissed again or resolved, and history keeps the prior disposition", async () => {
    const p = await issueProject();
    p.write("chapters/one.md", `${p.read("chapters/one.md")}\nA changed event.\n`);
    const again = invoke(p.root, ["issue", "dismiss", "issue_fixture", "--data", writeData(p, "again", { code: "FIXTURE_FINDING", reason: "Still intentional." })]);
    expect(again.code).toBe(0);
    expect(again.out).toBe("Dismissed issue issue_fixture: issues/issue_fixture.md\n");
    expect(p.read("issues/issue_fixture.md")).toContain([
      "## History",
      "",
      "- reopened: evidence changed in chapters/one.md; it was dismissed (FIXTURE_FINDING): Intentional in the fixture.",
      "- dismissed (FIXTURE_FINDING): Still intentional.",
      ""
    ].join("\n"));
    expect(refreshIssueEvidence(await p.load()).find((item) => item.id === "issue_fixture").status).toBe("dismissed");
    p.write("chapters/one.md", `${p.read("chapters/one.md")}\nAnother change.\n`);
    const resolved = json(p.root, ["issue", "resolve", "issue_fixture", "--data", writeData(p, "fix", { reason: "Rewrote the scene." })]);
    expect(resolved.code).toBe(0);
    expect(resolved.parsed.data).toMatchObject({ from: "open", to: "resolved" });
    const record = (await p.load()).records.get("issue_fixture").record;
    expect(record.status).toBe("resolved");
    expect(record.dismissal).toBeUndefined();
    expect(p.read("issues/issue_fixture.md").endsWith("- dismissed (FIXTURE_FINDING): Still intentional.\n- reopened: evidence changed in chapters/one.md; it was dismissed (FIXTURE_FINDING): Still intentional.\n- resolved: Rewrote the scene.\n")).toBe(true);
  });

  test("resolve works without data and appends to an existing history", async () => {
    const p = await issueProject();
    await p.addIssue({ id: "issue_logged", "affected-ids": ["chp_one"] }, "## History\n\n- opened\n");
    const result = invoke(p.root, ["issue", "resolve", "issue_logged"]);
    expect(result.code).toBe(0);
    expect(result.out).toBe("Resolved issue issue_logged: issues/issue_logged.md\n");
    expect(p.read("issues/issue_logged.md").endsWith("## History\n\n- opened\n- resolved\n")).toBe(true);
    const bare = await p.addIssue({ id: "issue_bare", "affected-ids": ["chp_one"] });
    expect(invoke(p.root, ["issue", "resolve", bare]).code).toBe(0);
    expect(p.read("issues/issue_bare.md").endsWith("---\n\n## History\n\n- resolved\n")).toBe(true);
  });

  test("invalid transitions and unbound dismissals are rejected with no writes", async () => {
    const p = await issueProject();
    await p.addIssue({ id: "issue_unscoped", evidence: [p.fileSource("story.md")] });
    await p.addIssue({ id: "issue_unsourced", "affected-ids": ["chp_one"] });
    const before = files(p.root);
    const dismissData = writeData(p, "d", { code: "X_CODE", reason: "Because." });
    const cases = [
      [["issue", "resolve", "issue_ghost"], 1, "ISSUE_NOT_FOUND"],
      [["issue", "resolve", "chr_ada"], 1, "ISSUE_NOT_FOUND"],
      [["issue", "resolve", "issue_done"], 1, "ISSUE_TRANSITION_INVALID"],
      [["issue", "resolve", "issue_fixture"], 1, "ISSUE_TRANSITION_INVALID"],
      [["issue", "dismiss", "issue_done", "--data", dismissData], 1, "ISSUE_TRANSITION_INVALID"],
      [["issue", "dismiss", "issue_fixture", "--data", dismissData], 1, "ISSUE_TRANSITION_INVALID"],
      [["issue", "dismiss", "issue_unscoped", "--data", dismissData], 1, "ISSUE_DISMISSAL_UNBOUND"],
      [["issue", "dismiss", "issue_unsourced", "--data", dismissData], 1, "ISSUE_DISMISSAL_UNBOUND"],
      [["issue", "dismiss", "issue_open", "--data", writeData(p, "stray", { code: "X_CODE", "record-id": "chp_one", reason: "No." })], 1, "ISSUE_DISMISSAL_UNBOUND"],
      [["issue", "dismiss", "issue_open", "--data", writeData(p, "nocode", { reason: "No code." })], 2, "INVALID_INVOCATION"],
      [["issue", "dismiss", "issue_open", "--data", writeData(p, "noreason", { code: "X_CODE" })], 2, "INVALID_INVOCATION"],
      [["issue", "dismiss", "issue_open", "--data", writeData(p, "extra", { code: "X_CODE", reason: "r", scope: "all" })], 2, "INVALID_INVOCATION"],
      [["issue", "dismiss", "issue_open", "--data", writeData(p, "junk", "nope")], 2, "INVALID_INVOCATION"],
      [["issue", "resolve", "issue_open", "--data", writeData(p, "resolve-extra", { reason: "r", status: "open" })], 2, "INVALID_INVOCATION"],
      [["issue", "resolve", "issue_open", "--data", writeData(p, "resolve-type", { reason: 3 })], 2, "INVALID_INVOCATION"],
      [["issue", "dismiss", "issue_open"], 2, "INVALID_INVOCATION"]
    ];
    for (const [argv, exitCode, code] of cases) {
      const result = json(p.root, argv);
      expect([argv.slice(0, 3), result.code, result.parsed.diagnostics[0].code]).toEqual([argv.slice(0, 3), exitCode, code]);
    }
    expect(files(p.root)).toEqual(before);
  });

  test("unreadable evidence at dismissal, a held lock, and a blocking load error stop issue writes", async () => {
    const p = await issueProject();
    await p.addIssue({ id: "issue_lost", "affected-ids": ["chp_one"], evidence: [{ ...p.fileSource("story.md"), path: "chapters/lost.md" }] });
    const lost = json(p.root, ["issue", "dismiss", "issue_lost", "--data", writeData(p, "lost", { code: "X_CODE", reason: "r" })]);
    expect([lost.code, lost.parsed.diagnostics[0].code]).toEqual([1, "SOURCE_UNREADABLE"]);
    p.write(".story/lock", "{}\n");
    for (const argv of [
      ["issue", "resolve", "issue_open"],
      ["issue", "dismiss", "issue_open", "--data", writeData(p, "l1", { code: "X_CODE", reason: "r" })],
      ["issue", "add", "--data", writeData(p, "l2", { category: "continuity", severity: "info" })]
    ]) {
      const result = json(p.root, argv);
      expect([result.code, result.parsed.diagnostics[0].code]).toEqual([3, "LOCKED"]);
    }
    const broken = await issueProject();
    broken.write("issues/issue_broken.md", "---\nformat: story-toolkit\nschema-version: 1\nid: issue_broken\ntype: issue\n---\n");
    for (const argv of [
      ["issue", "resolve", "issue_open"],
      ["issue", "dismiss", "issue_open", "--data", writeData(broken, "b1", { code: "X_CODE", reason: "r" })],
      ["issue", "add", "--data", writeData(broken, "b2", { category: "continuity", severity: "info" })]
    ]) {
      expect(json(broken.root, argv).code).toBe(2);
    }
  });
});

describe("decision and issue references", () => {
  test("decision scope ids and issue affected ids block entity removal through the shared index", async () => {
    const p = await issueProject();
    await p.addDecision({ id: "dec_ada", "scope-ids": ["chr_ada"] });
    const before = files(p.root);
    for (const policy of ["refuse", "detach"]) {
      expect(json(p.root, ["entity", "remove", "chr_ada", "--policy", policy]).code).toBe(1);
    }
    const refused = json(p.root, ["entity", "remove", "chr_ada", "--policy", "refuse"]);
    const owners = refused.parsed.diagnostics.map((item) => item.recordIds).flat();
    expect(owners).toEqual(expect.arrayContaining(["dec_ada", "issue_open"]));
    expect(files(p.root)).toEqual(before);
  });
});
