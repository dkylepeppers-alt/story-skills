# Unified Story Toolkit — comprehensive implementation plan

> **For implementers:** Use `superpowers:executing-plans` for inline implementation, or `superpowers:subagent-driven-development` when the user selects delegated execution. Complete checkbox steps with evidence; adapt these instructions to the tools actually available. This document authorizes no automatic merge or public release.

**Goal:** Build the complete fork-owned writing toolkit: ten integrated skills, one primary agent, an optional reviewer, a dependable local CLI, and an owned OpenCode installation. Reuse the substantial existing code and preserve its capabilities.

**Architecture:** Editable Markdown/YAML is authoritative. A Node-compatible JavaScript core supplies project storage, temporal state, context, reconciliation, checks, series, assets and publishing. Skills provide creative judgment and use those services. One release owns the CLI, generated skill bundles and host agent definitions.

**Workspace:** [dkylepeppers-alt/story-skills](https://github.com/dkylepeppers-alt/story-skills), verified baseline `fcdb4314b9d8221fab1a65292ca2bb5b43a67098`.

**Design:** [Complete design specification](../specs/2026-09-24-story-toolkit-design.md). Read it before starting. Its schemas, semantics, operation classes and command matrix are the product contract; this document supplies execution order and checks.

**Status:** Proposed implementation plan, written 2026-09-24. No implementation task below is represented as completed. The local workspace contains the fork baseline and these planning documents.

## Scope and execution rules

This is one comprehensive delivery. The sequence below manages dependencies; it does not reduce the release to an MVP. The previous installation cleanup is complete and is not an implementation task. Upstream compatibility is not a requirement. Existing SIREN-specific instructions remain user content, loaded through the ordinary project-instruction mechanism.

### Global constraints

- Repository: `dkylepeppers-alt/story-skills`; no upstream CLI, schema, or installer compatibility requirement.
- Runtime: Node.js 22 or newer, JavaScript ESM; Bun 1.3.14 is the development/test/build tool, not an end-user runtime requirement.
- Required deployment target: OpenCode on Linux, including Android Termux and Debian/proot; verify the environment where OpenCode actually runs.
- Story source: editable Markdown with YAML frontmatter; generated indexes and caches are rebuildable.
- Normal story operations run locally without model credentials, a database service, or network access.
- The CLI performs deterministic storage, selection, comparison, validation, and packaging; the writing agent performs prose generation and semantic interpretation.
- Ship all ten core skills and the full CLI capability matrix; ship one primary agent and one opt-in reviewer.
- Project instructions and explicit user scope govern writing; generic craft guidance is advisory where the project intentionally differs.
- Explorations, simulations, and unadopted candidates do not update established story state.
- Every factual conclusion used by the CLI has declared provenance; missing chronology or evidence remains unresolved.
- All mutating operations validate their write set and expected source hashes before changing authoritative files.
- Install/update/uninstall operate on manifest-owned files; unrelated tooling and project prose are outside their write sets.

### Review focus

Review these failure modes explicitly, not merely whether the happy path passes:

| Risk | Required evidence |
|---|---|
| Manual YAML edits or Unicode/CRLF prose are corrupted by metadata updates | Task 2 byte-preservation, YAML, traversal and transaction tests; Task 9 interrupted-write tests. |
| Future facts leak into an earlier scene, first-reader simulation or prequel | Tasks 4–5 partial-order and beat tests; Task 7 context tests; Task 11 series tests. |
| A restricted edit changes unrelated prose or reconciliation overwrites new work | Tasks 8–9 range checks, actual-byte hashes, concurrent edits and stale-proposal tests. |
| Update/uninstall creates duplicate skills, deletes user files or leaves `story` unusable | Tasks 18–19 owned-manifest, collision, shell, rollback and real Termux/proot evidence. |
| Consolidation produces polished instructions but loses working capabilities or fails real writing | Task 1 capability ledger, Tasks 12–17 contract checks, Tasks 20–21 blind writing evaluation and integrated acceptance. |

### Working method

1. Work on implementation branches from the fork. Preserve unrelated changes. Keep these planning documents as the specification baseline.
2. For each behavioral task, first add the focused failing test, implement the contract, run the focused test, then relevant retained regression tests. Commit coherent changes with Conventional Commit messages.
3. Suggested tests below specify behavior and public interfaces; implement supporting fixture builders in Task 2. They are not a complete production implementation or an excuse to test only the happy path.
4. Use the repository's current formatting, coverage and CI requirements until Task 1 deliberately updates them. Never delete a failing regression merely to make a new architecture pass.
5. Record a genuine design change in both documents before depending on it. Routine implementation choices within the contract need no new user approval.
6. Complete all tasks and acceptance gates before describing the toolkit as finished. Do not block ordinary drafting behind a research, image or publishing workflow that the user did not request.

## Target code ownership

Keep JavaScript ESM. Introduce JSDoc typedefs and JSON Schemas where they improve boundary validation; do not require a TypeScript rewrite.

| Location | Responsibility |
|---|---|
| `src/cli.js`, `src/commands.js`, `src/options.js` | Command paths, option validation, dispatch; one source for help and accepted syntax. |
| `src/cli/result.js`, `src/cli/handlers/` | Shared result/diagnostic formatting and thin command handlers. |
| `src/storage/` | Frontmatter documents, source spans/hashes, safe paths, transactions and recovery. |
| `src/project/`, `schemas/` | Discovery, loading, validation, identity, import, entities and fork-owned data schemas. |
| `src/state/`, `src/context/` | Partial chronology, temporal assertions, knowledge, context selection and invalidation. |
| `src/memory/`, `src/changes/` | Facts/decisions/issues, revision comparison, impact, reconciliation proposals. |
| `src/checks/`, `src/reports/` | Shared diagnostics, derived indexes, word counts, progress and advisory prose checks. |
| `src/series/`, `src/publishing/`, `src/assets/` | Inter-book state, existing exporters, visual records and shot validation. |
| `src/install/`, `src/install/hosts/` | Release ownership and explicit OpenCode adapters. |
| `skills/`, `resources/`, `agents/` | Editable skill instructions, shared references and agent sources. |
| `scripts/`, `dist/` | Validation/build/release scripts and generated distribution output. |
| `test/`, `evals/`, `examples/` | Deterministic tests, model evaluations and representative editable projects. |

Existing modules move only when their replacement has regression coverage. `src/story.js` may temporarily delegate during extraction, but remove obsolete parallel implementations before release.

## Shared interfaces

Define these in `src/contracts.js` as documented typedefs and export the listed functions from their owning modules. JSON Schemas validate persisted/input records; JavaScript objects use camelCase internally and adapters translate frontmatter keys deliberately.

```js
// All SourceRef hashes cover actual selected UTF-8 bytes, not parsed prose.
// SourceRef = { path, sceneId?, beatId?, hash, kind }
// Cursor = { sceneId, beatId?, side: 'before' | 'after' }
// Diagnostic = { code, severity, message, recordIds, sources,
//                evidence: 'structural' | 'declared' | 'candidate', action }
// Result = { apiVersion: 1, command, ok, data, diagnostics, writes }
// Write = { path, action: 'create' | 'replace' | 'remove',
//           expectedHash: string | null, content?: Uint8Array }
// expectedHash:null asserts absence; it never means skip validation.

loadProject(root);                         // Promise<Project>
writeTransaction(root, writes, options);   // Promise<MutationResult>
buildChronology(project);                  // Chronology with compare(a,b)
resolveState(project, cursor);             // { facts, conflicts, unresolved }
buildContext(project, request);            // ContextPacket
compareRevision(project, baseline, scope); // ChangeReport
analyzeImpact(project, change);            // ImpactReport
validateProposal(project, proposal);       // { ok, diagnostics, writes }
applyProposal(root, proposal, options);    // Promise<MutationResult>
runChecks(project, options);               // Diagnostic[]
```

`Project` includes root, validated records indexed by ID, manuscript spans, source hashes and diagnostics. It is a snapshot of read files, not authority to overwrite later edits. `Chronology.compare` returns `before`, `equal`, `after` or `unordered`; do not encode unknown as equality.

`ContextRequest` contains `task`, target scene/beat/cursor as applicable, `audience`, optional reader boundary, caller constraints, extra requested IDs and `maxBytes`. `ContextPacket` contains constraints, selected source-bearing items with reasons, applicable state, diagnostics and omissions. `ImpactReport` has separate `explicit`, `transitive` and `candidates` collections.

`Proposal` has a unique ID, operation (`working-edit`, `adoption`, `retcon`), expected hashes for every evidence/precondition dependency, a complete write set, affected IDs and a rationale/source mapping for each factual change. Scope validation uses the baseline's exact byte ranges. A proposal cannot weaken or redefine its own caller-supplied scope restrictions.

## Dependency sequence

Tasks 1–3 establish identity, storage and the project model. Tasks 4–7 establish chronology, memory and context. Tasks 8–10 establish changes, reconciliation and diagnostics. Tasks 11–13 complete series, publishing and assets. Tasks 14–17 implement and package the skill/agent system. Tasks 18–19 establish installation. Tasks 20–21 validate and document the complete product.

Independent work may overlap only when shared interfaces are settled and file ownership is clear. This plan does not require a multi-agent implementation.

## Task 1 — Establish fork identity and a capability ledger

**Files:** Modify `package.json`, `bun.lock`, `AGENTS.md`, `README.md`, `src/version.js`, `scripts/check-metadata.js`. Create `docs/architecture/capability-ledger.md`, `provenance/creative-sources.json`, `THIRD_PARTY_NOTICES.md`, `licenses/Apache-2.0.txt`, `test/identity.test.js`. Retain `LICENSE` and applicable source notices.

**Depends on:** Nothing.

- [ ] Inventory the verified baseline commands, options, skills, templates, exporters and tests. Map each capability to a task and its replacement regression file; use explicit retained/adapted/intentionally-removed status. Removed compatibility aliases and copied fallback binaries are intentional removals; their underlying behavior must have a replacement.
- [ ] Set package name to `@dkylepeppers-alt/story-toolkit`, repository/bugs/homepage to the fork, Node engine to `>=22`, and keep the pinned Bun development tool. Reserve product release `1.0.0`; use development prereleases until acceptance.
- [ ] Update root developer guidance to the new runtime, schema and single-distribution approach. Do not leave old instructions requiring a copied CLI fallback.
- [ ] Record selected Creative Writing Skills files and exact revision `0d5bf7fd987554e05db7e05d569736e648297722`. Record original path, local destination, license and adaptation status per imported file. Include attribution in distributions.
- [ ] Add identity tests; do not depend on npm registry availability or publish a package during this task.

```js
import { expect, test } from 'bun:test';
import pkg from '../package.json';

test('the distribution identifies the fork and its runtime', () => {
  expect(pkg.name).toBe('@dkylepeppers-alt/story-toolkit');
  expect(pkg.engines.node).toBe('>=22');
  expect(JSON.stringify(pkg.repository)).toContain('dkylepeppers-alt/story-skills');
});
```

**Verify:** `bun test test/identity.test.js test/registry.test.js`; adapted registry checks must retain command/help coherence. Commit `chore: establish fork toolkit identity and capability ledger`.

## Task 2 — Implement source-preserving storage and schemas

**Files:** Create `src/contracts.js`, `src/storage/{document,paths,hash,spans,transaction}.js`, `src/project/{load,schema}.js`, `schemas/{project,entity,scene,fact,decision,issue,research,series,asset,shot,proposal,scope}.schema.json`, `test/support/project.js`, `test/storage.test.js`, `test/project-schema.test.js`. Adapt `src/frontmatter.js`, `src/markdown.js`, `test/frontmatter.test.js`, `test/schema.test.js`; add `yaml` and `ajv` dependencies.

**Depends on:** Task 1.

- [ ] Define `format: story-toolkit`, `schema-version: 1`, required IDs/types and discriminated record schemas. Reject unknown core fields with a precise diagnostic; allow a documented `extensions` object for project-specific metadata. Reject upstream v2 with an explicit format finding rather than misreading it.
- [ ] Parse YAML through its document API, preserve supported comments, and serialize only changed frontmatter. Preserve body bytes and original LF/CRLF when editing metadata. Reject invalid YAML and duplicate mapping keys before mutation.
- [ ] Implement `SourceRef` selection over actual file bytes. Exclude frontmatter when a scene span is requested; include the span between its marker and the next marker, using one documented marker-boundary convention in all hashing and range operations.
- [ ] Resolve project paths inside their root; reject traversal and symlink escapes for writes. Treat missing paths, case collisions and permission errors as actionable diagnostics. A `.story` lock must prevent two toolkit writers; revalidate expected hashes immediately before replacement. Document that uncooperative external writes cannot be fully locked out by an advisory lock.
- [ ] Stage writes on the destination filesystem, journal the full set, use per-file atomic rename and clean preimages after success. Implement preview without persistent source changes. Recovery completion is Task 9.
- [ ] Build `makeProject(options = {})` fixtures. It creates a temporary project, registers cleanup through the test runner’s `afterEach`, and provides `root`, `read`, `write`, `hash`, `load`, `addScene`, `addFact`, `addEntity` and `bytes`. Provide separate `makeChronologyFixture()`, `makeKnowledgeFixture()` and `makeInstallFixture()` builders where later tasks need richer defaults; do not hide malformed fixtures behind auto-repair.

```js
test('metadata edits preserve CRLF and Unicode manuscript bytes', async () => {
  const p = await makeProject({ body: '\r\n“Stay,” Zoë said.\r\n' });
  const before = p.bytes('chapters/one.md').body;
  await setRecordField(p.root, 'chp_one', 'title', 'A new title');
  expect(p.bytes('chapters/one.md').body).toEqual(before);
});

test('a stale write set changes none of its targets', async () => {
  const p = await makeProject();
  const writes = p.twoFileReplacement();
  await p.write(writes[1].path, 'an external edit');
  await expect(writeTransaction(p.root, writes, {})).rejects.toMatchObject({ code: 'STALE_SOURCE' });
  expect(p.read(writes[0].path)).toBe(p.initial(writes[0].path));
});
```

The tests use public storage functions and explicit fixture helpers; define `setRecordField`, `twoFileReplacement` and `initial` in the storage test/support layer as needed, without exposing test-only methods in the production API.

**Verify:** `bun test test/storage.test.js test/project-schema.test.js test/frontmatter.test.js test/markdown.test.js test/schema.test.js`. Include nested lists, block scalars, quotes, null values, duplicate IDs, wrong format, malformed markers, path escapes and no-write dry runs. Commit `feat: add source-preserving project storage and schemas`.

## Task 3 — Extract project creation, entities, import and command dispatch

**Files:** Create `src/project/{discover,init,import,entities,identity}.js`, `src/cli/result.js`, `src/cli/handlers/{project,entity}.js`, `test/project.test.js`, `test/command-contract.test.js`. Modify `src/cli.js`, `src/commands.js`, `src/options.js`, `src/story.js`, `src/import.js`, `bin/story.js`, `test/cli.test.js`, `test/init-add-safety.test.js`, `test/import.test.js`, `test/rename-remove.test.js`, `test/registry.test.js`.

**Depends on:** Task 2.

- [x] Extend command registry entries to command paths, argument/option schemas, project requirements, mutation status and handler. Help, validation, examples and dispatch must read this registry.
- [x] Implement the shared result envelope and exit-code policy from the design. JSON stdout contains exactly one JSON value; operational logs go to stderr. Errors still use the envelope when JSON was requested and parsing permits it.
- [x] Implement discovery and initialization without overwriting an existing project. Create only required folders. Assign immutable opaque IDs; enforce uniqueness, including imported IDs.
- [x] Implement all entity types in the command matrix. Rename display name/path while preserving identity and updating structural links. `remove --policy refuse` reports dependencies; `detach` removes optional structural references and records consequences, never silently rewrites prose or retargets facts. Required semantic references still block removal until an explicit reconciliation proposal resolves them; deletion must leave a schema-valid project.
- [x] Port Markdown import, heading detection and natural chapter ordering. Import into a new directory only; ambiguous scene breaks produce a finding. Optional old-format conversion may be a separate explicit adapter, never a prerequisite for the fresh design.
- [x] Register commands as their handlers land in subsequent tasks; require the complete registry by Task 21. No hidden success stubs for unimplemented commands.

```js
test('rename preserves identity and manuscript wording', async () => {
  const p = await makeProject();
  const prose = p.read('chapters/one.md');
  await renameEntity(p.root, 'chr_ada', 'Adaline');
  const project = await p.load();
  expect(project.records.get('chr_ada').name).toBe('Adaline');
  expect(p.read('chapters/one.md')).toBe(prose);
});
```

**Verify:** `bun test test/project.test.js test/command-contract.test.js test/cli.test.js test/init-add-safety.test.js test/import.test.js test/rename-remove.test.js test/registry.test.js`. Include commands invoked outside a project and from a nested directory; verify `detach` refuses required unresolved fact references. Commit `feat: add fork project operations and unified command results`.

## Task 4 — Model scenes, beats and partial chronology

**Files:** Create `src/state/{chronology,cursor}.js`, `src/cli/handlers/timeline.js`, `test/chronology.test.js`. Adapt `src/timeline.js`, `test/timeline.test.js`, `test/custody-time.test.js`.

**Depends on:** Task 3.

- [ ] Load scene markers and beat order from chapter source; validate scene records point to exactly one matching span. Keep chapter/scene reading order separate from story chronology.
- [ ] Combine explicit `after` edges with comparable timestamps. Support dates and instants as distinct precision types; do not invent timezone information or compare incompatible precision as exact instants.
- [ ] Compute reachability and detect cycles, contradictory timestamps, missing nodes and duplicate beat IDs. Return `unordered` for insufficient information.
- [ ] Implement scene-entry, beat-before/after and scene-exit cursors. A fact valid after a beat is unavailable before that beat. A valid-until boundary is exclusive.
- [ ] Expose `timeline` with independent reading/story order fields and diagnostics. Do not hide ambiguous branches by printing them as a certain linear sequence.

```js
test('a flashback does not follow reading order', async () => {
  const p = await makeChronologyFixture();
  const order = buildChronology(await p.load());
  expect(order.compare(p.exit('scn_flashback'), p.entry('scn_opening'))).toBe('before');
  expect(order.compare(p.exit('scn_undated'), p.entry('scn_opening'))).toBe('unordered');
});
```

**Verify:** `bun test test/chronology.test.js test/timeline.test.js test/custody-time.test.js`. Include a same-scene handoff, equal timestamps with explicit edges, contradictory edges and missing beat references. Commit `feat: model scene and beat chronology independently of reading order`.

## Task 5 — Implement facts, knowledge, belief and state resolution

**Files:** Create `src/state/{facts,predicates,knowledge}.js`, `src/memory/facts.js`, `src/cli/handlers/{fact,knowledge}.js`, `test/state.test.js`. Adapt `test/knowledge.test.js`, `test/knowledge-errors.test.js`, `test/continuity.test.js`.

**Depends on:** Task 4.

- [ ] Implement the separate lifecycle and epistemic-kind fields. Validate subject/predicate/value types and sources. Keep belief and character knowledge separate from objective world assertions.
- [ ] Define predicate cardinality and temporal behavior for location, holder, availability, injury/status, affiliation/relationship and knowledge/belief. Conflicting exclusive assertions remain visible conflicts. Additive assertions may coexist.
- [ ] Resolve established applicable assertions at a cursor; return indeterminate assertions separately. Exclude proposals, simulations, `work/`, retracted and superseded records from current established state.
- [ ] Implement `fact add|list|retract` and `knowledge`. Lists may include inactive records when explicitly requested; scene context does not silently revive them.
- [ ] Preserve historical revision queries by resolving the baseline record set, not by trying to reconstruct the past from current lifecycle fields alone. Flag unsplit biographies that contain unclassified temporal history.

```js
test('learning inside a scene respects its beat boundary', async () => {
  const p = await makeKnowledgeFixture();
  const project = await p.load();
  const before = resolveState(project, p.cursor('scn_cellar', 'beat_confession', 'before'));
  const after = resolveState(project, p.cursor('scn_cellar', 'beat_confession', 'after'));
  expect(before.facts.map(f => f.id)).not.toContain('fact_ada_learns');
  expect(after.facts.map(f => f.id)).toContain('fact_ada_learns');
  expect(after.facts.find(f => f.id === 'fact_false_belief').kind).toBe('belief');
});
```

**Verify:** `bun test test/state.test.js test/knowledge.test.js test/knowledge-errors.test.js test/continuity.test.js`. Include missing provenance, stale source hashes, two simultaneous holders, baseline facts and unordered applicability. Commit `feat: resolve sourced facts and character knowledge at story moments`.

## Task 6 — Add durable author decisions and review issues

**Files:** Create `src/memory/{decisions,issues}.js`, `src/cli/handlers/{decision,issue}.js`, `test/memory.test.js`. Adapt `test/exemptions.test.js`.

**Depends on:** Task 5.

- [ ] Implement decision and issue schemas, transitions and structured `--data` commands from the command matrix. `decision supersede` creates a successor link and updates the prior record through one transaction.
- [ ] Scope decisions to project/record/scene IDs. Preserve rationale and evidence; proposed decisions do not behave as accepted instructions.
- [ ] Bind dismissed issues to exact diagnostic code, affected IDs and source fingerprints. A new source fingerprint invalidates that dismissal and reopens the issue or emits a corresponding review finding with the prior disposition attached.
- [ ] Keep issue history readable. Reject invalid transitions and supersession cycles. Do not use global substring exemption lists.

```js
test('a dismissal does not suppress changed evidence', async () => {
  const p = await makeProject({ issue: 'dismissed' });
  await p.write('chapters/one.md', p.read('chapters/one.md') + '\nA changed event.\n');
  const issues = refreshIssueEvidence(await p.load());
  expect(issues.find(i => i.id === 'issue_fixture').status).toBe('open');
});
```

**Verify:** `bun test test/memory.test.js test/exemptions.test.js`. Include two identical diagnostic codes on different records so one dismissal cannot hide the other. Commit `feat: track scoped decisions and evidence-bound issues`.

## Task 7 — Build reusable context packets and dependency-aware caches

**Files:** Create `src/context/{build,select,budget,cache}.js`, `src/cli/handlers/context.js`, `test/context.test.js`, `test/context-cache.test.js`.

**Depends on:** Tasks 5–6.

- [ ] Implement all ten task types and target/audience validation. Support project-level planning/publishing requests without requiring a scene; scene-specific tasks receive a precise cursor.
- [ ] Load explicit caller constraints, project contract, relevant style resources, target prose, nearby prose, stable profiles, applicable state, linked plans and decisions/issues. Every item has source references and selection reasons.
- [ ] Enforce the 48,000 UTF-8-byte default over the serialized packet, including overhead. Required constraints and requested primary material may not be silently dropped; return a budget finding when they cannot fit. Optional omitted items retain reason and retrieval ID.
- [ ] Separate later impact material from in-scene writer knowledge. Apply a reader's reading boundary as well as source chronology; a fresh first-reader session must never receive private outline/reveal material.
- [ ] Cache by dependency content hashes, query options and schema version. Detect additions/removals that alter candidate selection, not just edits to previously selected files. Scanning metadata may be cached, but no stale cache may override changed disk content.

```js
test('context excludes a later reveal and explains selection', async () => {
  const p = await makeKnowledgeFixture();
  const packet = buildContext(await p.load(), {
    task: 'draft', target: p.entry('scn_opening'), maxBytes: 48000,
  });
  expect(packet.items.map(x => x.id)).not.toContain('fact_later_reveal');
  expect(packet.items.every(x => x.reason && x.sources.length)).toBe(true);
});
```

**Verify:** `bun test test/context.test.js test/context-cache.test.js`. Test multibyte text, required-instruction overflow, newly linked records, cache schema changes and first-reader source inspection. Commit `feat: assemble bounded source-grounded writing context`.

## Task 8 — Implement baselines, stable-ID comparison and edit scope checks

**Files:** Create `src/changes/{baseline,snapshot,compare,scope}.js`, `src/cli/handlers/{snapshot,changes}.js`, `test/changes.test.js`, `test/scope.test.js`. Adapt `src/compare.js`, `test/compare.test.js`.

**Depends on:** Tasks 3–4.

- [ ] Read Git baselines without changing the working tree. Resolve refs to immutable commits and store the resolution in results. Support explicit `.story/revisions/` snapshots for projects without Git; do not create permanent snapshots automatically.
- [ ] Match records and scenes by ID across file rename and chapter movement. Classify add/remove/content change/move independently; moving a scene with identical bytes is not a rewrite.
- [ ] Validate `ScopeSpec` against baseline file hashes and half-open UTF-8 byte ranges. Compare edits to ensure every changed baseline range and insertion position is allowed. Define insertion-at-boundary behavior in the schema and test it.
- [ ] Have the agent choose explicit ranges for dialogue-only edits. Quote inference offers candidate ranges; it never substitutes for a verified caller scope. Distinguish dialogue content from tags/beats when the user restricts them.
- [ ] Surface changed source references and facts, including removed scenes. Report scope violations as error findings with before/after evidence, without attempting an automatic prose rewrite.

```js
test('a dialogue edit cannot alter narration outside its allowed range', () => {
  const before = Buffer.from('Ada paused. “Wait.”\n');
  const after = Buffer.from('Ada smiled. “Stay.”\n');
  const scope = scopeForText(before, '“Wait.”');
  const report = checkScope(before, after, scope);
  expect(report.diagnostics.map(d => d.code)).toContain('EDIT_OUT_OF_SCOPE');
});
```

`scopeForText` is a test helper using byte offsets, not a production quote classifier.

**Verify:** `bun test test/changes.test.js test/scope.test.js test/compare.test.js`. Include repeated dialogue, moved unchanged text, Unicode offsets, deleted files, ambiguous Git refs and explicit snapshots. Commit `feat: compare revisions and enforce declared prose edit ranges`.

## Task 9 — Add impact analysis, reconciliation and interrupted-write recovery

**Files:** Create `src/changes/{impact,proposal,reconcile}.js`, `src/storage/recovery.js`, `src/cli/handlers/{impact,reconcile,repair}.js`, `test/impact.test.js`, `test/reconcile.test.js`, `test/recovery.test.js`. Extend `src/storage/transaction.js`.

**Depends on:** Tasks 2, 5–8.

- [ ] Build explicit dependency edges from structured IDs and sources, traverse transitive consumers and perform separately labeled candidate prose searches. Missing string matches never certify semantic safety.
- [ ] Validate proposal provenance, expected hashes, allowed scope and full write set. Treat accepted retcons/adoptions as operations within existing user authorization, not a reason to ask again for every record change.
- [ ] Preview proposed mutations by default. Apply only with `--apply`; re-read all evidence and write preconditions, validate all outputs and obtain the project lock before any replacement. Recompute affected derived views.
- [ ] Record staged/applied journal entries with hashes. Implement deterministic `repair --action finish|rollback`; refuse to overwrite new external edits encountered during repair. Preserve a conflicted journal for explicit resolution rather than guessing.
- [ ] Inject faults before the first rename, between two renames and during cleanup. Recovery must yield the chosen consistent state or a precise unresolved conflict. Clearly report an incomplete multi-file operation.

```js
test('reconciliation refuses changed evidence before applying any write', async () => {
  const p = await makeProject();
  const proposal = await proposalForRetcon(p);
  await p.write('chapters/one.md', p.read('chapters/one.md') + '\nNew work.\n');
  const priorFact = p.read('facts/holder.md');
  await expect(applyProposal(p.root, proposal, {})).rejects.toMatchObject({ code: 'STALE_SOURCE' });
  expect(p.read('facts/holder.md')).toBe(priorFact);
});
```

**Verify:** `bun test test/impact.test.js test/reconcile.test.js test/recovery.test.js test/storage.test.js`. Include a proposal that attempts to relax its scope, evidence-only stale files and both recovery actions. Commit `feat: reconcile authorized changes with impact and recovery`.

## Task 10 — Consolidate checks, reports, indexes and progress

**Files:** Create `src/checks/{index,structure,links,continuity,sources,research}.js`, `src/reports/{report,next,prose,progress,indexes,wordcount}.js`, `src/cli/handlers/{check,report,doctor,next,index,wordcount,prose,progress}.js`, `test/diagnostics.test.js`. Adapt `src/continuity.js`, `src/prose.js`, `src/progress.js` and their corresponding existing tests; retain `test/clue.test.js`, `test/research.test.js`.

**Depends on:** Tasks 5–9.

- [ ] Port structure/link, cast/death, setup/payoff, clue, research, travel and custody checks through the shared project/state contracts. Distinguish mechanically proven errors, declared-state conflicts and semantic review candidates.
- [ ] Implement stable codes and source spans, scoped issue dispositions and `check --only`. Reuse these findings in `report`, `doctor`, `next` and publishing readiness.
- [ ] Preserve useful prose/progress reports. Word repetition and stylistic patterns are configurable advice; do not revive a universal no-ai-slop skill or turn stylistic preferences into mandatory rewriting.
- [ ] Make indexes derived and explicitly writable with `--write`. Word counts exclude frontmatter, markers and non-manuscript records; preserve existing documented counting conventions.
- [ ] `next` ranks visible unresolved work and gives its reason, without starting a chapter. Progress writes a log only with `--log`. All report-only commands have empty source write sets.

```js
test('report and check share continuity diagnostic identity', async () => {
  const p = await makeProject({ conflictingHolder: true });
  const project = await p.load();
  const checks = runChecks(project, { only: ['continuity'] });
  const report = buildReport(project);
  const conflict = checks.find(d => d.code === 'STATE_EXCLUSIVE_CONFLICT');
  expect(report.diagnostics).toContainEqual(conflict);
});
```

**Verify:** `bun test test/diagnostics.test.js test/continuity.test.js test/clue.test.js test/research.test.js test/prose.test.js test/progress.test.js`. Commit `feat: unify project diagnostics and retained reporting capabilities`.

## Task 11 — Preserve series features with explicit shared identities

**Files:** Create `src/series/{load,links,state,check,timeline,transaction}.js`, `src/cli/handlers/series.js`, `test/series-state.test.js`. Adapt `src/series.js`, `test/series.test.js`, `test/series-backlink.test.js`.

**Depends on:** Tasks 5, 9–10.

- [ ] Implement series ID namespaces and explicit book/entity mappings. Identical filenames or names alone do not imply shared identity.
- [ ] Port link/backlink checks. A multi-book mutation enumerates all roots and expected hashes; read-only checks never repair another book implicitly. Default links write the current book only. An explicitly requested reciprocal link uses a coordinator with root locks acquired in deterministic path order and journals in each affected root; apply and recovery must respect each root’s path boundaries. Report interrupted cross-root work honestly rather than claiming global atomicity.
- [ ] Combine declared shared events with each book's chronology; surface ambiguous intervals and contradictory assertions. Preserve book reading order independently.
- [ ] Implement `series link`, `series check` and `series timeline`; provide context to `story-series` through the common service.

```js
test('prequel context does not inherit a sequel revelation', async () => {
  const series = await makeSeriesFixture();
  const state = resolveSeriesState(series.project, series.prequelEntry);
  expect(state.facts.map(f => f.id)).not.toContain('fact_sequel_identity');
});
```

**Verify:** `bun test test/series-state.test.js test/series.test.js test/series-backlink.test.js`. Include offline/missing linked books, same names with different identities and conflicting shared facts. Commit `feat: model explicit series identity and cross-book chronology`.

## Task 12 — Extract and preserve the complete publishing pipeline

**Files:** Create `src/publishing/{assemble,markdown,epub,docx,shunn,synopsis,readiness}.js`, `src/cli/handlers/{export,build,synopsis,publish}.js`, `test/publishing.test.js`. Extract relevant code from `src/story.js`; port `test/matter.test.js`, `test/shunn.test.js`, `test/shunn-docx.test.js`, `test/synopsis.test.js`, `test/synopsis-pages.test.js` and relevant `test/story.test.js` export cases.

**Depends on:** Tasks 3, 10–11.

- [ ] Preserve Markdown, EPUB, DOCX, Shunn Markdown/DOCX, matter pages, covers, author/contact metadata, chapter ordering and word-count conventions.
- [ ] Assemble authoritative chapter prose once, stripping internal scene/beat markers. Exclude plans, record bodies and `work/` even when they contain chapter-like headings.
- [ ] Implement `export --out`, `build --kind`, `synopsis --pages` and `publish check`; output JSON formatting must remain separate from export kind.
- [ ] Retain mechanical synopsis as a labeled scaffold. Readiness reports distinguish mechanical failures from unresolved research/semantic review and stylistic advice.
- [ ] Validate generated archive contents, readable document structure and essential formatting. Inspect a representative DOCX/EPUB in an available viewer during final acceptance, not only ZIP existence.

```js
test('all manuscript outputs exclude internal markers and experiments', async () => {
  const p = await makeProject({ markers: true, experiment: 'SECRET CANDIDATE' });
  const assembled = assembleManuscript(await p.load());
  expect(assembled.text).not.toContain('story-scene:');
  expect(assembled.text).not.toContain('story-beat:');
  expect(assembled.text).not.toContain('SECRET CANDIDATE');
});
```

**Verify:** `bun test test/publishing.test.js test/matter.test.js test/shunn.test.js test/shunn-docx.test.js test/synopsis.test.js test/synopsis-pages.test.js`. Keep fixture assertions for every existing format. Commit `feat: preserve publishing formats through the new project model`.

## Task 13 — Add assets and scene-linked prompt packages

**Files:** Create `src/assets/{records,shots,profiles,check}.js`, `src/cli/handlers/{assets,shots}.js`, `test/assets.test.js`, `test/shots.test.js`. Use schemas from Task 2.

**Depends on:** Tasks 7, 9–10.

- [ ] Implement asset records, file hashes, depicted IDs, applicability, verification/selection status and explicit reference roles.
- [ ] Implement shot packages with full prompt, ordered reference manifest, target moment, source dependencies, unresolved visual facts and optional versioned provider profile. No image-generation service is required.
- [ ] Validate available paths, hashes, role conflicts and selected profile limits. Uninspected images remain unverified. Changes invalidate only packages depending on the changed fact/asset/applicability.
- [ ] Register `assets add|list|check` and `shots add|check` and route `check --only assets` to the same validator. Support structured dry-run mutations.

```js
test('an outfit change invalidates its shot but not an unrelated face reference', async () => {
  const p = await makeAssetFixture();
  const impact = analyzeImpact(await p.load(), { recordId: 'fact_coat', kind: 'changed' });
  expect(impact.explicit.map(x => x.id)).toContain('shot_cellar');
  expect(impact.explicit.map(x => x.id)).not.toContain('asset_face');
});
```

**Verify:** `bun test test/assets.test.js test/shots.test.js`. Include missing images, stale hashes, ordered roles and text-only reference creation records. Commit `feat: track visual references and scene-linked prompt packages`.

## Task 14 — Build workflow, planning and writing skills

**Files:** Create/replace `skills/story-workflow/SKILL.md`, `skills/story-planning/SKILL.md`, `skills/story-writing/SKILL.md`. Create `resources/{operation-modes,planning,discovery,scene-craft,dialogue,prose-modes,style,genre,theme}.md`, `skill-resources.json`, `scripts/check-skills.js`, `test/skill-contract.test.js`.

**Depends on:** Tasks 7–9; final command examples depend on Task 17.

- [ ] Consolidate existing init/plot/theme/genre/scene/discovery/chapter methods into these three owners. Retain substantive references rather than compressing each specialty into a generic paragraph.
- [ ] Adapt selected creative-writing modes/craft/planning material with the provenance manifest and required notices. Remove framework-specific orchestration and prior patch-layer assumptions.
- [ ] Encode chat draft, exploration, working edit, adoption/retcon and review behavior. An adequate brief triggers writing directly. Optional brainstorming or an outline is offered only when useful to the request.
- [ ] Writing modes cover fresh drafting, discovery, targeted revision, dialogue, bridging, alternate takes and polish. Every mode follows the user/project voice, perspective, scope and output destination; no compulsory economy or punctuation doctrine.
- [ ] Define operation briefs and handoffs to `story-memory`; consequential established changes trigger reconciliation. An unadopted alternate does not update facts. Requested prose is delivered completely, not replaced by a progress summary.
- [ ] Include examples: short chat fiction without initialization; discovery draft; exact dialogue-only change; adoption of an alternative; custom project instructions overriding generic craft advice.

```js
test('the writing skill declares scope and memory handoffs', async () => {
  const contract = await readSkillContract('skills/story-writing/SKILL.md');
  expect(contract.operations).toEqual(expect.arrayContaining(['draft', 'revise', 'explore', 'adopt']));
  expect(contract.handoffs).toContain('story-memory');
});
```

Store machine-checkable contracts in an adjacent `contract.json`, and implement its reader/validator in `scripts/check-skills.js` now; Task 17 extends it to distribution checks. Each listed skill path includes this contract file. This test verifies integration fields, not whether prose guidance is good; Task 20 evaluates behavior.

**Verify:** `bun test test/skill-contract.test.js`; manually trace each example against the operation table. Commit `feat: consolidate workflow planning and writing skills`.

## Task 15 — Build review, world, memory and research skills

**Files:** Create/replace `skills/story-{review,world,memory,research}/SKILL.md`. Create `resources/{review-levels,feedback-triage,character-simulation,reader-simulation,worldbuilding,character-development,memory-reconciliation,research-methods}.md`. Extend `skill-resources.json`, `test/skill-contract.test.js`.

**Depends on:** Tasks 5–10, 14.

- [ ] Review provides distinct editorial, developmental, line, copy and proof passes, plus beta/alpha feedback synthesis. Findings cite passages, explain reader effect and distinguish taste from mechanical error. Do not rewrite unless requested.
- [ ] Optional character/reader simulations are limited methods, not a mandatory multi-agent committee. Reader simulation specifies reading boundary and clean-context requirement; disclose contamination if the same context already saw future material.
- [ ] World merges character, relationship, location, system, faction, object and terminology work. Separate stable profiles from changing state. Incidental invention allowed by the brief does not require a form-filling ceremony.
- [ ] Memory uses the shared packet, proposal and issue contracts. Explain evidence, uncertain chronology, belief vs truth, explicit retcons and downstream review; never manufacture missing events to make metadata consistent.
- [ ] Research turns sources into usable details with citations, verification status, uncertainty and `usedBy` links. Use the host's authorized research tools when needed; do not add a mandatory research API dependency to the CLI.
- [ ] Update provenance for adapted review, memory, research and principle resources. Keep voice-preserving line-edit methods while omitting the deleted standalone no-ai-slop layer.

**Verify:** Extend `bun test test/skill-contract.test.js` with read-only review output, memory command references, simulation boundaries and research record schemas. Walk a false-belief scene and a conflicting-beta-feedback example manually. Commit `feat: integrate review world memory and research workflows`.

## Task 16 — Build series, image-prompt and publishing skills

**Files:** Create/replace `skills/story-{series,image-prompts,publishing}/SKILL.md`. Create `resources/{series-continuity,image-reference-roles,image-prompt-packages,publishing,submission-materials}.md`. Extend `skill-resources.json`, `test/skill-contract.test.js`.

**Depends on:** Tasks 11–15.

- [ ] Series handles sequel/prequel/spinoff planning, shared identities, reader order and cross-book changes through the series CLI and common context.
- [ ] Image prompting handles reference creation and a scene's visible moment, using registered reference roles and ordered manifests. Inspect provided assets when tools allow; preserve identity without turning a face reference into an outfit instruction. Record unresolved details and source hashes. Keep it one normal skill in the stack.
- [ ] The earlier image skill's files are absent. Implement the specified native workflow now; if its retained source is supplied before this task, inspect it and incorporate useful licensed material. Do not block the other nine skills or claim that missing files were reviewed.
- [ ] Publishing handles assembly/readiness, synopsis refinement, query/blurb/submission material and all retained formats. Keep mechanical and artistic assessments separate.
- [ ] Remove the sixteen superseded skill entry points only after the capability ledger maps their methods into the ten new skills/resources. Update every catalog and example; no legacy duplicate triggers in the release.

**Verify:** `bun test test/skill-contract.test.js test/assets.test.js test/shots.test.js test/publishing.test.js`. Confirm exactly ten shipped core skill IDs, with complete resource references. Commit `feat: complete series visual and publishing skill workflows`.

## Task 17 — Package self-contained skills and host-neutral agent sources

**Files:** Create `agents/story.md`, `agents/story-reviewer.md`, `scripts/{build,build-skills}.js`, `test/skill-build.test.js`, `test/agent-contract.test.js`. Modify `scripts/check-skills.js`, `scripts/check-metadata.js`, `package.json`, plugin/catalog manifests discovered in Task 1; retire `scripts/check-fallback.js` and copied fallback generation after its replacement tests pass.

**Depends on:** Tasks 14–16.

- [ ] Generate `dist/skills/<id>/SKILL.md` and self-contained `references/` trees from editable sources and `skill-resources.json`. Rewrite source references deliberately, reject missing/escaping references and include attribution. Never maintain independently edited resource copies.
- [ ] Bundle the CLI and dependencies into `dist/story.js` for Node. Keep `bin/story.js` a stable shebang entry point that invokes the built artifact. The package includes all required static schemas/resources and no checkout-relative runtime imports.
- [ ] Add primary agent routing and opt-in reviewer source contracts. Reviewer permissions prohibit manuscript/canon writes. Agent model names/settings come from the host; no hardcoded product-specific aliases.
- [ ] Validate every documented command against the registry and every handoff against a shipped skill. Reject stale `ss-*`, copied-CLI fallback and external slash-command dependencies where they appear as operational instructions.
- [ ] Keep source skill files readable in the repository. Generated distributions carry all their dependencies, so installation does not require the entire source tree.

```js
test('each distributed skill resolves its references in isolation', async () => {
  const bundles = await buildSkills({ out: tempDir() });
  expect(bundles).toHaveLength(10);
  for (const bundle of bundles) {
    expect(await validateSkillReferences(bundle.path, { isolated: true })).toEqual([]);
  }
});
```

**Verify:** `bun test test/skill-build.test.js test/agent-contract.test.js test/skill-contract.test.js`; `bun run build`; invoke `node dist/story.js --help` with Bun absent from the test process PATH. Commit `build: package one CLI with self-contained skills and agents`.

## Task 18 — Implement OpenCode setup, ownership and installation diagnostics

**Files:** Create `src/install/{manifest,paths,discover,setup,doctor}.js`, `src/install/hosts/{opencode,opencode-v1,opencode-v2}.js`, `src/cli/handlers/{setup,installation}.js`, `scripts/bootstrap.sh`, `test/install.test.js`, `test/install-hosts.test.js`, `test/install-path.test.js`. Extend the project `doctor` handler with installation mode.

**Depends on:** Task 17.

- [ ] Verify supported OpenCode documentation and installed version behavior during implementation. Pin tested major/minor fixtures and record actual adapter paths/frontmatter. Unknown versions produce actionable diagnostics; do not guess a schema from historical examples.
- [ ] Implement user/project scope, XDG/home manifest storage and registration of managed project installs. Manifest entries include package, release, source commit, prefix, executable realpath, host version, destination, hash and link target.
- [ ] Detect skills/agents from active user/project paths, compatibility paths and explicitly configured sources. Distinguish active duplicates from passive source checkouts. Refuse to overwrite an unowned destination or duplicate active ID.
- [ ] Install links where supported; otherwise validated copies. Detect and report modified owned files. Use temporary stage directories and transaction/ownership checks for setup mutations.
- [ ] Bootstrap from a built fork release tarball, then execute setup explicitly. Resolve npm's actual global prefix and bin path. Check a new shell can resolve `story`; explain the exact PATH correction if needed. Do not depend on a hidden npm hook or repeated manual aliases.
- [ ] Test native Termux and Debian/proot as distinct environments. Use the Node/npm/OpenCode in the environment where the user runs OpenCode; never assume their prefixes or home directories are interchangeable.
- [ ] `doctor --installation` works outside a story project and reports realpath, fork identity, versions, active sources, duplicates and drift. Setup project scope uses the existing executable.

```js
test('setup preserves an unowned skill collision', async () => {
  const env = await makeInstallFixture({ unownedSkill: 'story-writing' });
  const before = env.readUserSkill('story-writing');
  const result = await setupInstallation(env.request);
  expect(result.diagnostics.map(d => d.code)).toContain('INSTALL_UNOWNED_COLLISION');
  expect(env.readUserSkill('story-writing')).toBe(before);
});
```

**Verify:** `bun test test/install.test.js test/install-hosts.test.js test/install-path.test.js`. Run real fresh-shell probes in available supported environments. Include user and project scopes together; removing one must leave the other usable. If Android/proot is unavailable, record that gap and use the explicit Task 21 phone smoke protocol; do not claim mocked paths prove device support. Commit `feat: install and diagnose an owned OpenCode toolkit`.

## Task 19 — Implement coherent updates, removal and release artifacts

**Files:** Create `src/install/{update,remove,release}.js`, `test/install-lifecycle.test.js`, `test/package-smoke.test.js`. Modify `scripts/release.js`, `test/release.test.js`, `package.json`, `.github/workflows/ci.yml`; add `.github/workflows/release.yml` if no suitable release workflow exists.

**Depends on:** Task 18.

- [ ] Build one release containing CLI, skills, agents, schemas and notices from one commit. Produce npm-installable GitHub tarball and a checksummed release manifest. Record source repository and commit in `story --version`/installation metadata.
- [ ] `installation update --release` stages the selected fork release, verifies artifact hashes and compatibility, checks collisions/drift, then switches owned links and manifest with recoverable steps. Hashes detect corruption; do not present a manifest fetched from the same channel as independent signature verification.
- [ ] A failed update leaves the prior working installation selected or reports a recoverable interrupted switch with exact state. Test failure before and after link switching, including multiple managed scopes. Never mix the new CLI with old skill resources silently. Stage all scope changes before activation and report inaccessible project registrations as blockers to a coherent update.
- [ ] Removal enumerates managed user/project scopes, validates ownership, removes host registrations/files, then uninstalls the recorded npm package from the recorded prefix only when no remaining managed scope depends on that executable. Scope-specific removal preserves the CLI while other registered scopes remain; `--scope all` performs full owned removal. Preload helper code if needed so deleting the executable package does not break the remaining cleanup. Do not claim completion if modified owned files blocked removal.
- [ ] Preserve unrelated files, other npm packages, generic PATH entries, manuscripts and passive checkouts. Explicitly authorized conflict handling names exact modified paths; no broad force sweep.
- [ ] Test tarball installation with Node only, no Git checkout, no Bun, and network disabled for ordinary story commands. Release publication remains a separate explicit action after acceptance.

```js
test('failed update keeps the previous complete release active', async () => {
  const env = await makeInstallFixture({ installedRelease: '1.0.0-rc.1' });
  await expect(updateInstallation(env.request, { failAt: 'before-switch' })).rejects.toThrow();
  const status = await installationStatus(env.request);
  expect(status.release).toBe('1.0.0-rc.1');
  expect(status.diagnostics.filter(d => d.severity === 'error')).toEqual([]);
});
```

Fault injection is dependency-injected in tests, not a public production CLI option.

**Verify:** `bun test test/install-lifecycle.test.js test/package-smoke.test.js test/release.test.js`; `npm pack --dry-run` after build; install the actual produced tarball into an isolated prefix and run help, init, check, setup, update and remove. Commit `feat: manage coherent toolkit releases updates and removal`.

## Task 20 — Add deterministic scenarios and meaningful writing evaluations

**Files:** Extend `evals/`, `scripts/check-evals.js`, `test/workflow-eval.test.js`; create `evals/scenarios/toolkit/`, `evals/rubrics/writing.md`, `evals/runners/opencode.js`, `evals/README.md`, `test/eval-contract.test.js`.

**Depends on:** Tasks 7–19.

- [ ] Port existing evaluation fixtures through the capability ledger. Keep deterministic contracts separate from model-dependent judgments; ordinary CI must not require paid model calls.
- [ ] Add scenarios for direct chat drafting, outlined drafting, discovery writing, restricted dialogue editing, alternate exploration/adoption, explicit retcon, source-aware review, feedback triage, flashbacks, same-scene learning, false belief, research and linked books. Include one integrated visual prompt scenario proportionate to the stack.
- [ ] Run each writing scenario at least three times for new toolkit, baseline skills and no-skill controls using the same selected model/runtime settings. Pin the baseline skill snapshot, input hashes and prompts. Baseline controls live only in isolated evaluation environments, never as competing normal installed skills.
- [ ] Record model/provider/version, settings, loaded resources, prompts, outputs, context size, tokens/time and deterministic violations. If the provider exposes no stable model revision, record that limitation.
- [ ] Blind human review covers intended voice, dialogue, tone, coherence, factual fidelity, scope preservation and useful completion. Preserve disagreements and raw examples. Do not rely on self-grading or a single aggregate score to establish improvement.
- [ ] Define release-blocking regressions: unauthorized canon change, leaked future knowledge, overwritten user work, missing requested prose, broken installation, dropped supported format or systematic extra process/approval loops. Fix and rerun affected scenarios; stylistic disagreements are assessed with examples rather than hidden by averages.

**Verify:** `bun test test/eval-contract.test.js test/workflow-eval.test.js`; `bun run check:evals`. Run live evaluations only through an explicitly configured authorized model environment; report unavailable runs as unverified rather than fabricating results. Commit `test: evaluate complete writing workflows and installation behavior`.

## Task 21 — Finish examples, documentation, integration and acceptance

**Files:** Update `README.md`, `AGENTS.md`, `docs/`, `examples/`, `templates/github/`, `.github/workflows/ci.yml`, `scripts/check-{examples,schema,coverage,metadata}.js`, `package.json`, `docs/architecture/capability-ledger.md`. Create `docs/{installation,project-format,cli,workflows,troubleshooting}.md`, `docs/acceptance/1.0.0.md`, `test/end-to-end.test.js`.

**Depends on:** All previous tasks.

- [ ] Provide two useful sample projects: a small story with minimal records and a richer project demonstrating chronology, revision, research and series links. Include visual records as one example, not the organizing structure of the documentation.
- [ ] Document direct chat use, discovery, drafting, restricted revision, review, retcons, research, series and publishing. Show complete working command examples validated against the registry and fixtures.
- [ ] Document bootstrap, new-shell PATH diagnosis, native Termux vs proot, duplicate sources, modified owned files, update and uninstall. No instruction repeats the user's completed cleanup or requires a workaround involving copied skill-local CLIs.
- [ ] Update optional GitHub templates to current commands and safe mutation scope. Do not ship automated creative edits that assume model access or repository write authorization.
- [ ] Finish the capability ledger: every preserved baseline behavior has a replacement test/example; each removed item has an intentional reason. Remove dead fallback code, old duplicate skills/agents, stale docs and unsupported metadata references.
- [ ] Run integrated project tests, package smoke, schema/resource checks and the repository-wide suite. Check generated examples and exports. Resolve regressions before release.
- [ ] Complete the acceptance matrix below, recording environment, exact command/scenario, result and evidence. Mark unavailable live-model/device checks unverified and complete them in the actual target environment before making support claims.
- [ ] Self-review the implementation against both design documents, with special attention to the five review risks. Prepare a release candidate and concrete reviewable PR. Merge/publication follows the user's applicable authorization; neither is implied by writing this plan.

**Verify:** `bun test`; `bun run check`; `bun run build`; `bun run check:package`. Define the aggregate `check` and `check:package` scripts during Tasks 17–19 to run schema/metadata/resource/example/eval validation and the actual tarball smoke test. Run each supported Node version in CI, with Node 22 as the minimum. Commit `docs: complete toolkit workflows and acceptance evidence`.

## Integrated acceptance matrix

| Scenario | Required observable result |
|---|---|
| Fresh bootstrap and new shell | `story` resolves to the fork package; all ten skills and intended agents load once. |
| Native Termux and Debian/proot | Real Node/npm/OpenCode environment identified; package, PATH and host discovery work inside that environment. |
| Draft from an adequate brief | Requested prose delivered without mandatory new outline/approval; contract and POV respected. |
| Discovery writing | Draft can proceed with sparse records; adopted consequential details reconcile without inventing a prior outline. |
| Dialogue-only edit | Allowed dialogue changes; narration/tags/beats outside authorized ranges remain byte-identical. |
| Alternate take | Experiment remains outside established state; explicit adoption updates prose and sourced records. |
| Retcon | Changed premise/fact applies with provenance; explicit/transitive/candidate downstream effects are distinguished. |
| Chronology and knowledge | Flashbacks, same-scene learning and false beliefs resolve correctly; unknown order stays unresolved. |
| Review and feedback | Findings cite sources and prioritize concerns; review does not overwrite prose. |
| Research and readiness | Citations/status retained; critical unresolved details surface at relevant scenes and publication checks. |
| Series | Explicit identities link books; prequels do not inherit future knowledge; other books are not silently mutated. |
| Visual request | Scene-appropriate prompt and ordered references generated; changed dependencies flag affected packages only. |
| Publishing | All five build kinds plus Markdown export and synopsis work; metadata/work/markers stay out of prose. |
| Manual edit and stale cache | Subsequent context/check sees actual file edits; stale proposals fail before new writes. |
| Interrupted mutation | Finish/rollback yields the requested state or exact unresolved conflicts; no false success. |
| Update | One coherent release selected; failure preserves the prior usable installation. |
| Removal | Owned CLI/skills/agents removed for requested scopes; modified/unowned files and manuscripts preserved/reported. |
| Offline project use | Init, context, checks, revision, assets and publishing need no model service or network. |

### Target-device smoke protocol

Use a disposable test project and release-candidate package in the environment where OpenCode runs. Record `node --version`, `npm --version`, `opencode --version`, `command -v story`, `story --version` and `story doctor --installation --format json`. Open a new shell and a new OpenCode session. Confirm exactly one copy of each skill and only the intended agents. Exercise a draft/context/check/export cycle, update the test release, then remove its managed installation. Do not touch the user's manuscript or unrelated custom instructions. Save the transcript with the acceptance record and redact secrets before committing it.

## Completion definition

The work is complete when all ten skills, both agent roles, the entire CLI command matrix, all preserved baseline capabilities and the owned installation lifecycle operate together; deterministic gates pass; target-environment and live-writing evidence is recorded honestly; and documentation matches the shipped artifacts. No intermediate task is a substitute release scope. Image prompting is included as one connected capability within the broader writing system.
