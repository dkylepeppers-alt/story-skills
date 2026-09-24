# Unified Story Toolkit — design specification

**Status:** Complete design proposal for implementation review; no product implementation is represented as finished.
**Date:** 2026-09-24
**Workspace:** [dkylepeppers-alt/story-skills](https://github.com/dkylepeppers-alt/story-skills)
**Verified base:** `fcdb4314b9d8221fab1a65292ca2bb5b43a67098`, package version `0.7.0`.
**Implementation plan:** [Task-by-task plan](../plans/2026-09-24-story-toolkit.md).

## 1. Product goal and settled scope

Build a complete writing toolkit from the fork's working code and selected Creative Writing Skills methods. It must support planning, discovery writing, drafting, revision, critique, worldbuilding, research, continuity, series, story image prompts, and publishing. The CLI, ten skills, and agent definitions form one owned installation and share one project model.

The user explicitly requested a fresh design, freedom from upstream compatibility, the full feature set rather than a small first release, and inclusion of story image prompts with proportionate emphasis. Implementation phases below are dependency order within this full scope. None defines a reduced product to substitute for the requested system.

The user reports the old Termux/OpenCode installations have been removed. Do not repeat that cleanup or reconstruct the deleted skill and agent stack. The existing SIREN manuscript and custom prose contract are user content; this repository must support project-specific instructions without embedding SIREN rules into generic product code.

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

### Explicit exclusions

A web editor, hosted database, image-generation provider service, and autonomous model runtime are not needed for this toolkit. Image prompting and asset management are included; sending prompts to external generation services is a separate user-authorized action. There is no obligation to emulate upstream command aliases or automatically migrate an old project in place.

## 2. Verified starting point and reuse map

The fork contains sixteen core skills, a Node-compatible `story` CLI, tests, examples, publishing code, evaluation fixtures, and a Bun release tool. `src/story.js` concentrates many responsibilities; existing modules already separate continuity, chronology, comparison, import, prose diagnostics, series, and progress. Reuse behavior and fixtures before rewriting algorithms.

| Existing code/material | Target ownership | Treatment |
|---|---|---|
| `src/cli.js`, `commands.js`, `options.js`, `bin/story.js` | CLI registry and output layer | Extend registry to command paths and structured results; preserve one parser/help source. |
| Project scanning and entity helpers in `src/story.js` | `src/project/` | Extract and adapt to explicit IDs and format version. |
| `src/frontmatter.js`, `markdown.js` | `src/storage/` | Retain body-preservation cases; use full YAML document parsing for nested records. |
| `src/continuity.js` | `src/checks/` and `src/state/` | Retain death/cast, setup/payoff, research, travel and custody checks; correct time semantics. |
| `src/timeline.js`, chapter-level knowledge query | `src/state/` and `src/context/` | Build scene/beat chronology and before/after state queries. |
| `src/compare.js` | `src/changes/` | Retain manuscript comparison; add stable-ID matching, allowed-range checks and impact. |
| `src/series.js` | `src/series/` | Retain linked-book checks with explicit shared identities and chronology. |
| `src/prose.js`, `progress.js` | `src/reports/` | Preserve useful reports; stylistic counts remain advisory and configurable. |
| `src/import.js` | `src/project/import.js` | Preserve Markdown import and natural ordering; isolate optional v2 conversion. |
| Export/build/synopsis logic and tests | `src/publishing/` | Preserve Markdown, EPUB, DOCX, Shunn, matter pages, cover, and synopsis scaffold. |
| Sixteen `skills/` workflows and references | Ten core skills plus reusable resources | Consolidate ownership while retaining depth. |
| `evals/` | Expanded deterministic and live-model evaluation | Reuse fixtures; remove assumptions that only Claude can run evaluations. |
| `scripts/release.js`, metadata checks, CI | Packaging/ownership/release checks | Replace copied fallback distribution with one CLI and generated skill bundles. |
| `templates/github/` | Updated optional automation templates | Route checks and drafting through the new contracts; never call metadata success proof of prose consistency. |

### Capability preservation

Retain project creation, Markdown import, entity add/rename/remove, structural validation, references, generated indexes, word counts, prose diagnostics, chronology, knowledge queries, progress logging, comparison, continuity, linked books, reports, next actions, research notes, front/back matter, synopsis, and all existing export formats. Syntax may change; silently dropping a capability is not acceptable.

## 3. Creative material selection and licensing

Source: [haowjy/creative-writing-skills](https://github.com/haowjy/creative-writing-skills), inspected local snapshot `0d5bf7fd987554e05db7e05d569736e648297722`. Record the exact imported revision per file in `provenance/creative-sources.json`; if refreshed during implementation, review the differences before incorporation.

| Material | Integration |
|---|---|
| `creative-writing-modes` and `resources/prose-modes.md` | Rewrite as the production modes of `story-writing`. |
| `creative-writing-craft` prose, scene and style resources | Incorporate as focused craft references shared by writing and review. |
| `story-review` resources | Incorporate distinct editorial/developmental/line/copy/proof methods. |
| `story-planning` | Merge with the fork's plot, theme, discovery, and scene resources. |
| `story-memory` | Adopt evidence-based context selection, factual changes, reference writing and issue methods; use the new schema. |
| `creative-research` | Merge usable-detail research with the fork's sourced research records. |
| `writing-principles` | Select diagnostic guidance; remove mandatory punctuation preferences and universal economy rules. |
| `character-sim`, `reader-sim` | Optional references in planning/review; never mandatory on every passage. |
| `llm-writing` | Select intentional language and scope-preservation guidance; omit disk-first and unrelated dependency requirements. |
| `creative-writing-muse`, `writing-staffing`, setup/KB orchestration | Replace with this toolkit's own workflow and project model. |

Do not recreate the prior `ss-*` integration layer or import its patch installer. Change source instructions that leave character state untouched for every contradictory request: an explicit retcon authorizes reconciliation; an experiment does not. Remove mandatory multi-critic loops, framework-specific spawning commands, and external-skill installation prompts.

Preserve upstream MIT attribution. Imported Apache-2.0 material retains its license, attribution and modification notices; use `THIRD_PARTY_NOTICES.md` and `licenses/` to identify which material is adapted. Do not label all copied creative content as solely MIT.

## 4. Skill and agent contracts

Every skill declares its trigger, inputs, relevant reference resources, allowed outputs, write scope, CLI operations, and finish conditions. A skill receives the task context once and reuses it; it must not recursively restart planning or workflow selection. A brief request should receive the requested writing, not a long process report.

| Core skill | Responsibilities | Required handoff |
|---|---|---|
| `story-workflow` | Classify operation/destination, apply current instructions, route work, complete verification | Operation brief with scope and context requirements. |
| `story-planning` | Brainstorming, discovery preparation, outlines, arcs, theme, scene intent, genre promises | Proposed options or adopted decisions and plans. |
| `story-writing` | Fresh draft, revision, dialogue edit, bridge, alternate take, polish | Complete requested prose plus consequential changes when applicable. |
| `story-review` | Editorial/developmental/line/copy/proof passes and feedback synthesis | Prioritized, source-anchored findings; no unrequested rewrite. |
| `story-world` | Characters, relationships, locations, artifacts, factions, systems, vocabulary | Entity records and sourced facts; stable profile separated from temporal change. |
| `story-memory` | Context, chronology, fact reconciliation, decisions and issues | Proposed or applied record delta and dependency findings. |
| `story-research` | Concrete technical, cultural, historical and local detail | Sourced notes, uncertainty and manuscript dependencies. |
| `story-series` | Shared identities, chronology, sequels/prequels, inter-book impact | Explicit series links and cross-book findings. |
| `story-image-prompts` | Reference assets and cinematic prompts from story moments | Prompt package with ordered references and provenance. |
| `story-publishing` | Assembly, synopsis, submission material, readiness, export | Requested artifact and factual readiness findings. |

Source craft files live once under `resources/`. `skill-resources.json` maps consumers to resources. `scripts/build-skills.js` produces self-contained `dist/skills/<name>/references/` trees and checks every reference. Generated resource copies are distribution output, not independent editable sources. No runtime dependency on another plugin's slash command is allowed.

Agents: `agents/story.md` is the primary writing partner. `agents/story-reviewer.md` is opt-in and read-only over manuscript/canon; it returns findings. OpenCode adapters render version-appropriate frontmatter. Model choice comes from host/user settings; hardcoded model aliases are prohibited. One writer owns a target passage at a time. A first-reader simulation requires a fresh limited context for a clean boundary; a model that already saw the reveal must disclose that limitation.

### Operation classes

| Class | Writes and behavior |
|---|---|
| Chat draft | Return full prose; no project initialization or files unless requested. |
| Exploration | Candidate in chat or `work/` if requested; no established fact changes. |
| Working draft/revision | Authorized prose plus necessary record reconciliation. |
| Adoption/retcon | Change established working material and trace its consequences. |
| Review | Findings only, unless the request also authorizes editing. |

No mandatory outline approval when a clear brief or approved outline is already supplied. Discovery writing is supported directly. Routine reconciliation implied by an authorized edit requires no additional approval cycle. Unknown consequential canon remains an explicit uncertainty; incidental invention within the brief is allowed.

## 5. Project format

Use a fork-owned format discriminator, `format: story-toolkit`, and `schema-version: 1`. Upstream schema v2 is not accepted as this format. Keep chapters as prose files; scenes have stable IDs and explicit anchors within those files. Do not maintain a second editable copy of the prose in scene records.

| Path | Ownership |
|---|---|
| `story.md` | Project identity, premise, tense/POV, configured instructions and style sources. |
| `chapters/*.md` | Authoritative manuscript with chapter IDs and scene/optional beat markers. |
| `scenes/*.md` | Stable IDs, chapter IDs, reading order, chronology, cast, moment IDs, linked sources. |
| `characters/`, `worldbuilding/`, `glossary/` | Stable profiles, world rules and terminology. |
| `plot/` | Arcs, plans, setups, questions, promises and clues. |
| `facts/` | Established facts, beliefs, knowledge and temporal changes. |
| `decisions/`, `issues/` | Durable author decisions and unresolved findings. |
| `styles/`, `research/`, `matter/`, `series.md` | Writing style, sources, front/back matter and linked books. |
| `assets/records/`, `assets/files/`, `shots/` | Visual metadata, local images and image-prompt packages. |
| `work/` | Experiments and unadopted candidates; excluded from established state and export. |
| `.story/cache/`, `.story/transactions/` | Rebuildable indexes and short-lived recovery state. |
| `.story/revisions/` | Explicitly requested local revision baselines, with hashes. |
| `dist/` | Disposable exports. |

Folders appear when needed; do not force a short story to populate empty encyclopedic records. Indexes are derived views, not required hand-maintained sources. Content in `work/` can be queried explicitly but cannot enter default canon scans through a linked filename.

### Identity and sources

IDs are explicit immutable strings, assigned with type prefixes and opaque suffixes (for example `scn_7f83d6a2`, `chr_43ad1f0c`), validated unique across the project. Human-readable filenames and names can change independently. Friendly aliases resolve only when unambiguous. Renaming metadata never does a blind prose string replacement. Entity removal can detach optional structural references; required semantic references block deletion until an explicit reconciliation resolves them.

Scene markers use `<!-- story-scene: scn_7f83d6a2 -->`; optional beat markers use `<!-- story-beat: beat_key_handoff -->`. A scene range ends at the next scene marker or chapter-body end. Beat IDs are unique within a scene. Markers are stripped during export and excluded from word counts. Import never guesses scene boundaries when explicit breaks are ambiguous.

`SourceRef` contains a project-relative path, optional scene/beat IDs, SHA-256 of the selected source bytes, and evidence kind (`manuscript`, `author-decision`, `research`, `asset`). Hashes are over exact UTF-8 source spans; stale references are refreshed only after the agent inspects the changed evidence. Line numbers are display aids, not permanent identity. Manually edited files are first-class inputs.

## 6. Facts, time and knowledge

Facts have independent lifecycle (`proposed`, `established`, `superseded`, `retracted`) and epistemic kind (`world`, `belief`, `knowledge`, `reader-reveal`). Beliefs can be wrong while valid as character beliefs. A character knowing a statement means knowing that statement, not an automatic assertion of its objective truth. Use explicit subject, predicate and value, with free-text explanation for nuance.

```yaml
---
id: fact_key_holder
type: fact
status: established
kind: world
subject: obj_brass_key
predicate: holder
value: chr_marin
valid-from:
  scene: scn_cellar
  beat: beat_handoff
  side: after
sources:
  - path: chapters/chapter-03.md
    scene: scn_cellar
    beat: beat_handoff
    hash: "<64-character SHA-256 computed from the actual source span>"
    kind: manuscript
---
Ada hands Marin the brass key.
```

The hash above illustrates its shape, not a literal fixture value. Tests compute real hashes. A `valid-until` cursor is exclusive; a `valid-from` cursor is inclusive. Baseline facts use `valid-from: baseline`. Superseded/retracted assertions leave an audit trail but do not apply to current queries; historical revision queries load that revision's record set, not the current status.

Scene chronology is an explicit partial order using `after` scene IDs and optional date/time constraints. Reading order uses chapter and scene ordering independently. Within a scene, declared beat order supplies before/after cursors. Scene entry is before all beats; scene exit is after all beats. If chronology does not establish whether a fact applies, return `unresolved` instead of ordering by filename. Detect cycles and contradictions between explicit order and timestamps. Support undated scenes without inventing a date or timezone.

Use structured predicates for consequential state: location, holder, availability, injury/status, affiliation/relationship assertions, knowledge and belief changes. Free-text claims remain retrievable and source-linked but are not automatically executable rules. Mutually exclusive predicates with overlapping established values produce conflicts; additive predicates support multiple values. The predicate catalog defines cardinality and valid value types.

Stable entity profiles should not contain unmarked future history. Separate temporal facts from profiles. Context includes stable profiles plus applicable temporal assertions. An imported unsplit biography is flagged for agent inspection before use as spoiler-safe character context.

## 7. Context selection

`buildContext(project, request)` returns an operation-specific packet, not a prose summary fabricated by the CLI. Required fields: operation, target, user constraints supplied by caller, applicable project instructions, style sources, scene entry, relevant entities, applicable assertions, selected prose spans, open decisions/issues, source references, omissions and diagnostics.

`request.task` is one of `plan`, `draft`, `revise`, `review`, `world`, `memory`, `research`, `series`, `image`, `publish`. A reader simulation additionally declares `audience: reader` and its reading boundary. Revision impact can inspect later passages, but those passages must be separated from the writer's in-scene knowledge packet.

Selection order: explicit user constraints and project contract; target prose and immediate context; scene participants and applicable state; directly linked plans/facts/decisions; task-specific style/research; optional related material. Default `maxBytes` is 48,000 UTF-8 bytes, configurable. Never silently drop required constraints: return `CONTEXT_BUDGET_EXCEEDED` and the required source list. Optional truncation is recorded in `omissions`. This is a byte budget, not a claim about model token counts.

Every item exposes why it was selected. Additional retrieval accepts entity/scene/record IDs, avoiding repeated whole-project scans. Cache keys include source content hashes, schema version and query options; rebuild if any dependency changes. No mandatory vector database or embeddings are required.

## 8. Revision, reconciliation and decisions

`story changes` compares the working project with a Git ref or explicit revision snapshot, matching records by stable ID. It reports added, removed, changed and moved scenes, changed facts, stale evidence and allowed-range violations. A `ScopeSpec` names files and exact allowed source ranges against a baseline hash. Dialogue-only edits use explicit permitted ranges selected by the agent; quote detection is advisory and never proof that all narrative remained unchanged. Tag/beat editing is a declared option.

`story impact` returns three separately labeled sets: explicit dependencies, transitive record dependencies, and candidate prose matches. Search candidates are not confirmed contradictions. A record not mentioning an entity is not proof of no semantic dependency.

The agent extracts a proposal with before/after hashes, record additions/changes/retractions and supporting sources. `story reconcile --proposal ...` validates and previews it. `--apply` checks all preconditions, writes through the transaction layer, updates derived views and reports what was applied. A user-directed retcon is an authorized working change; no confirmation loop per fact is imposed. Reconciliation cannot invent omitted events to satisfy a validator.

Transactions stage full write sets before replacement, use a project write lock and per-file atomic rename, and retain a short-lived journal for interrupted multi-file operations. Multi-file writes are not described as filesystem-atomic. Recovery is explicit: `story repair --transaction <id> --action finish|rollback`. A concurrent hash mismatch exits before applying a new transaction. Successful transactions remove their temporary preimages; no automatic permanent manuscript backups are created.

Decisions include status (`proposed`, `accepted`, `rejected`, `superseded`), scope IDs, source, rationale and supersedes IDs. Issues include category, severity, evidence, affected IDs and status (`open`, `resolved`, `dismissed`). Dismissals reference exact diagnostic codes/records and a reason, not broad substring exemptions. Changed evidence reopens an affected issue for review.

## 9. CLI contracts and complete command surface

Keep the executable `story`. The fork package identity is `@dkylepeppers-alt/story-toolkit`; this is an internal package identifier and does not assert ownership or availability on the npm registry. Distribute GitHub release tarballs from the fork. Normal users do not need Bun or source checkouts.

All commands accept `--project <path>` when a project is relevant, defaulting to discovery from the current directory. Format is `--format text|json` for command results; publishing uses `--kind md|epub|docx|shunn-md|shunn-docx` to avoid overloading `--format`. Mutation preview is `--dry-run`; project-changing commands state their write set. No undocumented alias is needed for upstream compatibility.

| Group | Commands and behavior |
|---|---|
| Installation | `setup --host opencode --scope user|project`, `installation status`, `installation update --release <tag>`, `installation remove --scope user|project|all`, `doctor --installation` |
| Projects | `init <title>`, `import <source> --out <new-directory>`, `report`, `doctor`, `next`, `index --write`, `wordcount [--write]` |
| Entities | `entity add <type> <name>`, `entity rename <id> <name>`, `entity remove <id> --policy refuse|detach`, `entity show <id>` |
| Context/time | `context --scene <id> --task <task> [--beat <id>] [--side before|after]`, `knowledge <character> --scene <id>`, `timeline` |
| Checks | `check [--only structure|links|continuity|sources|research|assets]`, `prose`, `progress [--log]` |
| Changes | `snapshot <name>`, `changes --since <git-ref-or-snapshot> [--scope <json-file>]`, `impact --scene <id>` or `--record <id>`, `reconcile --proposal <file> [--apply]`, `repair --transaction <id> --action finish|rollback` |
| Memory | `decision add|list|supersede`, `issue add|list|resolve|dismiss`, `fact add|list|retract`; mutations accept schema-validated `--data <json-file>` |
| Series | `series link --data <json-file>`, `series check`, `series timeline` |
| Visuals | `assets add --data <json-file>`, `assets list`, `assets check`, `shots add --data <json-file>`, `shots check [--scene <id>]` |
| Publishing | `export --out <file>`, `build --kind <kind>`, `synopsis --pages 1|3`, `publish check` |

`entity` types cover character, location, system, faction, object, arc, chapter, scene, question, promise, clue, term, research and matter. `fact`, `decision`, `issue`, asset and shot commands own their richer contracts. `report`, `next` and `doctor` use the same diagnostics as `check`; they do not implement parallel validators. `next` recommends actions but never silently starts a new chapter.

JSON responses have `{apiVersion:1, command, ok, data, diagnostics, writes}`. Each diagnostic has stable `code`, `severity`, message, record IDs, source spans, evidence class and suggested action. Stdout contains only the result; stderr contains operational logs. Exit codes: 0 completed without error-level findings; 1 completed with error-level findings; 2 invalid invocation/schema; 3 conflict/stale expected state; 4 operational failure. Warnings are explicit but do not become prose-quality scores. Both text and JSON share the same result object.

## 10. Installation and release ownership

Bootstrap is an explicit package installation from a fork release tarball, followed by `story setup --host opencode --scope user`. Provide a guided bootstrap script invoking those steps and checking PATH, rather than depending on npm postinstall hooks. From a checkout, developer installation uses `npm install --global <built-tarball>`; published packages contain the built CLI and skill resources.

The CLI bundle is `dist/story.js` with dependencies bundled for Node. `dist/skills/` and `dist/agents/` form one release. Install links on Unix and copy only when linking is unavailable. An ownership manifest records package ID, release, source commit, executable realpath, host version, scope, destinations, file hashes and link targets. Default manifest root is `$XDG_DATA_HOME/story-toolkit/installations` or `$HOME/.local/share/story-toolkit/installations`. Project manifests are additionally registered there so global removal can enumerate managed project installs.

OpenCode adapters probe the installed major version, then render supported v1/v2 skill and agent forms; unknown versions return an actionable compatibility finding. Do not infer schema from a filename. Detect competing IDs in user, project, compatibility and explicitly configured sources. Do not overwrite unowned files. Report an owned file edited after installation as a conflict rather than silently deleting the edit.

`installation update` stages one complete release, verifies content/version coherence, computes owned-file changes, and switches the manifest and links only after validation. It reports newly introduced ID collisions. Failed updates leave the prior working installation selected. New shells and new OpenCode sessions are tested; a successful command in the installer process alone is insufficient.

`installation remove` removes matching owned skill/agent files and registrations first, then invokes npm uninstall for the recorded package/prefix only after confirming ownership and that no remaining managed scope depends on the executable. Removing one scope preserves the CLI while other registered scopes remain; `--scope all` performs full owned removal. If host removal conflicts, return those paths and do not claim full removal. Explicit user authorization can replace/remove a listed modified owned file; unrelated files are never swept up. Keep generic PATH entries used by other tools. Report passive checkouts/downloads separately from active installations.

No separate CLI is bundled into a skill. `doctor --installation` can run without a story project and reports binary realpath, release, fork source, host version, active skill/agent sources, duplicate IDs and manifest drift. `setup --scope project` uses the already installed CLI; it does not create a second executable.

## 11. Image prompting as an integrated capability

The skill supports reference creation for characters, settings and objects, and cinematic framing of a specific visible scene moment. Both use the normal context service. An image request specifies scene/beat when relevant and references registered assets by stable ID.

Asset records include file path/hash, depicted entities, role (`identity`, `clothing`, `environment`, `pose`, `composition`, `style`), applicable state/period, source and selection status. A shot package includes complete positive prompt, ordered references with roles, scene/beat, source hashes, rendering options, unresolved visual facts and an optional provider profile. Inspect actual images when available; uninspected references are marked unverified. A reference identity is preserved rather than exhaustively redescribed. Text-only asset creation uses sourced appearance details.

A face reference does not silently specify clothing; pose and style references do not overwrite identity. Provider limits are optional versioned profiles with a verification date, not guessed universal constants. The CLI validates paths, unique role assignments where required, supported ordering/count against the selected profile, and source freshness. The agent judges visual suitability and writes the prompt. No generation API integration is required to complete this scope.

Changes flag only dependent prompts/assets. An outfit revision does not invalidate a face reference unless its applicability includes that outfit. Generated incidental details do not become canon automatically.

The earlier image skill's actual files are not present in this workspace; its inclusion and intended role are established by the user’s request. This does not block planning or implementation: implement this contract natively, and adapt useful source material if the user supplies the retained ZIP before that task. Never claim the absent source was inspected. Keep this work proportionate to the full writing system.

## 12. Research, series and publishing

Research notes preserve citations, verified/disputed/open status, uncertainty and `usedBy` IDs. Critical open research linked to final manuscript material is a readiness finding; the CLI does not perform web research itself. The skill supplies and evaluates evidence. Factual sources remain outside the fictional prose unless the requested form calls for citations.

Series share explicit identities scoped by series ID, not filename coincidences. Cross-book state uses story chronology and declared shared facts; reading order can differ. A series link writes the current book by default. An explicitly requested reciprocal link declares every affected root and write set, acquires locks in deterministic order and journals each root; recovery does not assume cross-filesystem atomicity. Prequels do not inherit future knowledge. Conflicting author facts remain conflicts rather than last-file-wins merges.

Publishing preserves all working exporters, front/back matter, covers, author/contact fields and word-count conventions. Exclude outlines, scene markers and `work/` from manuscript outputs. Mechanical synopsis remains labeled a scaffold, with the publishing skill responsible for prose refinement. Submission records and query/blurb guidance retain existing useful functionality. Readiness reports distinguish mechanical failures, unresolved semantic review, research gaps and stylistic advice; they cannot certify artistic quality.

## 13. Evaluation and completion

Automated fixtures must cover structure, IDs, manual edits, scene moves, chronological ambiguity, same-scene learning, false belief, source staleness, constrained edits, explicit retcons, adoption, concurrency, interrupted writes, series, visuals, exports and install lifecycle. Existing tests are retained or ported with an explicit mapping; retirement requires evidence that the behavior is superseded or intentionally removed.

Live-model evaluation uses fixed input projects and blind comparisons against the baseline skill set and no-skill runs, with at least three trials per writing scenario on the intended OpenCode model configuration. Record model/version, sampling settings, loaded resources, input hashes, tokens/time, scope violations and findings. Human judgments cover voice, dialogue, clarity, intended tone, factual fidelity and unnecessary edits. Report disagreements and raw examples; no single composite score proves improvement. Paid model runs are separate from ordinary CI.

The integrated acceptance suite includes a complete plan-to-draft-to-revision-to-publication project, discovery writing, a restricted dialogue edit, an adopted alternate take, a retcon with downstream impact, a flashback knowledge boundary, linked books, sourced research, an image prompt and dependent revision, and install/update/remove from a fresh environment. All must be implemented before the requested toolkit is considered complete.

## 14. Source references

- [Verified fork baseline](https://github.com/dkylepeppers-alt/story-skills/tree/fcdb4314b9d8221fab1a65292ca2bb5b43a67098)
- [Creative Writing Skills snapshot](https://github.com/haowjy/creative-writing-skills/tree/0d5bf7fd987554e05db7e05d569736e648297722)
- [YAML document API](https://eemeli.org/yaml/) — comment-aware YAML editing; retain exact manuscript body bytes separately.
- [Ajv JSON Schema validation](https://ajv.js.org/guide/getting-started.html) — compile schemas once and report structured failures.
- [OpenCode skills](https://opencode.ai/docs/skills/) and [agents](https://opencode.ai/docs/agents/)
- [OpenCode v2 skills](https://opencode.ai/v2/docs/skills) and [agents](https://opencode.ai/v2/docs/agents)

These references ground implementation choices. Their future evolution does not authorize silently changing this specification; record any necessary adjustment as an explicit design revision.
