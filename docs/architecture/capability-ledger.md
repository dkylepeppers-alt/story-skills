# Capability ledger

**Purpose:** every capability of the verified fork baseline has a declared
disposition in the Story Toolkit build. A capability is **retained** (ships
as-is), **adapted** (rebuilt under the new contracts; the behavior must have a
replacement regression), or **intentionally removed** (dropped with a reason
and, where behavior is worth keeping, a named replacement). Silently dropping a
capability is not acceptable; this ledger is the register that prevents it.

**Verified baseline:** `fcdb4314b9d8221fab1a65292ca2bb5b43a67098`, package
`story-skills@0.7.0`. Task numbers refer to
[`docs/superpowers/plans/2026-09-24-story-toolkit.md`](../superpowers/plans/2026-09-24-story-toolkit.md).
Regression files are the tests that must keep covering the behavior after each
task lands; until a task runs, the current file remains the covering regression.

**Scope note:** this ledger inventories the baseline as of Task 1. It does not
change runtime behavior; tasks 2–21 execute the dispositions recorded here.
Task 21 finishes the ledger: every preserved behavior must then have a
replacement test/example in the new tree, and each removed item an intentional
reason.

## 1. CLI commands

Baseline source of truth: `src/commands.js` (23 commands, help order).

| Command | Baseline behavior | Status | Task | Replacement regression |
|---|---|---|---|---|
| `init` | Scaffold a story project (`--dir --genre --sub-genre --setting-era --theme(s) --pov --tense --synopsis --series --book-number --follows --precedes --force`) | Adapted | 3 | `test/project.test.js`, `test/init-add-safety.test.js`, `test/command-contract.test.js` |
| `import` | Split an existing manuscript into a new project, natural chapter ordering, entity candidates | Adapted | 3 | `test/import.test.js`, `test/command-contract.test.js` |
| `validate` | Check required files, frontmatter, registries, word-count warnings | Retained (through new checks) | 10 | `test/diagnostics.test.js`, `test/story.test.js` |
| `reindex` | Rebuild registry tables from markdown | Retained (derived indexes, `--write` semantics per design) | 10 | `test/diagnostics.test.js`, `test/story.test.js` |
| `wordcount` | Count chapter prose words; `--write` updates frontmatter | Retained | 10 | `test/story.test.js`, `test/cli.test.js` |
| `links` | Cross-reference and backlink checks | Retained | 10 | `test/diagnostics.test.js` |
| `continuity` | Deaths, promises/payoffs, questions, casts, durable state; exemptions | Retained | 10 | `test/continuity.test.js`, `test/custody-time.test.js`, `test/clue.test.js`, `test/exemptions.test.js` |
| `knowledge` | What a character knew at a chapter (`--at`) | Adapted (scene/beat cursors replace chapter granularity) | 5 | `test/knowledge.test.js`, `test/knowledge-errors.test.js` |
| `compare` | Compare with an earlier draft: word changes, added/removed chapters, unchanged paragraphs | Adapted (stable-ID matching, scopes, snapshots; `--against` folder baseline intentionally removed, see §7) | 8 | `test/compare.test.js`, `test/changes.test.js`, `test/scope.test.js` |
| `progress` | Words vs targets/deadline; `--log` records the session | Retained | 10 | `test/progress.test.js` |
| `timeline` | Story-time order, POV balance, character presence | Adapted (partial-order chronology; `unordered` is explicit) | 4 | `test/timeline.test.js`, `test/custody-time.test.js`, `test/chronology.test.js` |
| `prose` | Prose lint: filter words, adverbs, echoes, rhythm, similar names, style sheet | Retained (advisory and configurable, never a quality score) | 10 | `test/prose.test.js` |
| `series` | Order linked books, check shared canon | Adapted (explicit series identities) | 11 | `test/series.test.js`, `test/series-backlink.test.js`, `test/series-state.test.js` |
| `report` | Inventory + progress + checks summary | Retained (shares the check diagnostics) | 10 | `test/diagnostics.test.js` |
| `next` | Recommend next actions | Retained (never starts a chapter) | 10 | `test/diagnostics.test.js` |
| `doctor` | Health checks with repair steps | Retained; gains `--installation` mode | 10, 18 | `test/diagnostics.test.js`, `test/install.test.js` |
| `migrate` | Upgrade a project to the current schema | Adapted (fork format `story-toolkit` v1; upstream v2 conversion is an explicit adapter, not a prerequisite). Task 3 did not replace the schema v2 `migrate` command and did not add that adapter | 3 | `test/project-schema.test.js` |
| `add` | Create entity files (14 kinds) and reindex | Adapted (explicit immutable IDs) | 3 | `test/project.test.js`, `test/init-add-safety.test.js`, `test/command-contract.test.js` |
| `rename` | Rename entity, update id references, never prose | Adapted | 3 | `test/rename-remove.test.js`, `test/project.test.js` |
| `remove` | Remove entity, scrub references | Adapted (`--policy refuse\|detach`; required semantic references block) | 3 | `test/rename-remove.test.js`, `test/project.test.js` |
| `export` | Assemble front matter + chapters + back matter markdown | Retained | 12 | `test/publishing.test.js`, `test/matter.test.js` |
| `build` | Disposable artifacts in `dist/`: markdown, EPUB, DOCX, Shunn | Retained (`--format shunn` + `--shunn` become `--kind shunn-md\|shunn-docx`; see §7) | 12 | `test/publishing.test.js`, `test/shunn.test.js`, `test/shunn-docx.test.js` |
| `synopsis` | Deterministic 1- or 3-page synopsis | Retained (labeled scaffold) | 12 | `test/synopsis.test.js`, `test/synopsis-pages.test.js` |

Planned new commands with no baseline equivalent (`setup`, `installation
status|update|remove`, `context`, `entity …`, `check --only`, `snapshot`,
`changes`, `impact`, `reconcile`, `repair`, `decision|issue|fact add|list|…`,
`series link|check|timeline`, `assets`, `shots`, `publish check`) are specified
by the design's command matrix; they are additions, not ledger dispositions.
Task 3 registers `entity add|rename|remove|show` and Task 5 registers
`fact add|list|retract`. The other names above are not registered and fail as
unknown commands (`test/command-contract.test.js`).

Task 3 adds the `format: story-toolkit` layer beside schema v2. Default
`init`, `import`, `add`, `rename`, and `remove` still scaffold and edit schema
v2 projects. `--toolkit` selects fork init and import. Fork lifecycle commands
are `entity add|rename|remove|show`. `--format text|json` selects the result
envelope. The same flag still selects a build kind when the value is
`markdown`, `epub`, `docx`, or `shunn`; `text` and `json` are not build kinds.
Moving build kinds to `--kind` remains the publishing task. Rename keeps the
entity id, updates exact frontmatter path strings, and does not rewrite prose
or retarget facts. A prose link that would go stale is reported and left in
place. `remove --policy detach` clears optional scene `cast` and
`chronology.after` entries and records `REFERENCE_DETACHED`; required schema
references, including fact cursors and manuscript scene markers, block removal
with no writes. `remove --policy refuse` reports dependencies and writes nothing.
Both blocked removals exit 1.

Task 4 models story-toolkit scene and beat chronology apart from reading
order. Chapter markers supply each scene's single span and its beat order.
`story timeline` on a `format: story-toolkit` project returns `readingOrder`
and a partial `storyOrder` (constraints, cycles, and scenes that are not
placed). It does not print ambiguous branches or cycles as a linear sequence.
Comparison results are `before`, `equal`, `after`, or `unordered`. Schema v2
`story timeline` still prints the dated scene report, POV balance, and
character presence from `src/timeline.js`. Custody and clock checks in
`src/continuity.js` are unchanged. Scene `chronology.after` and fact
`valid-from`/`valid-until` cursors are the references the shared index in
`src/project/references.js` checks. A cursor beat resolves only inside its
cursor's scene span, the same boundary chronology uses, so `loadProject`
reports `DANGLING_REFERENCE` for a beat declared only in another scene.

Task 5 adds sourced facts. `fact add --data <json-file>` validates the record
against the fact schema and the predicate catalog in `src/state/predicates.js`,
checks references through the shared index, and hashes each named source span.
A supplied hash that no longer matches its evidence is `STALE_SOURCE` (exit 3).
`fact retract <id>` is a hash-checked status replacement. `fact list` shows
established facts; `--include-inactive` adds proposed, retracted, and
superseded records and `--include-work` adds `work/` records. With `--scene`
(and optional `--beat` and `--side before|after`), each listed fact reports
whether it applies at that cursor. Inactive and `work/` records never apply.
Facts without provenance, with stale or unreadable evidence, or with an
unordered start are returned as unresolved rather than applied.

## 2. CLI options

Baseline source of truth: `src/options.js` (68 registered options: 60 with
help, 8 undocumented aliases, plus the Task 3 and Task 5 flags below). The new option set
is specified by the design (`--format text|json`, `--project`, `--dry-run`,
structured `--data`); this section records where each baseline option's
behavior lands. `--format text|json` selects the result envelope. Build kinds
remain `markdown|epub|docx|shunn` on `--format` until the publishing task moves
them to `--kind`.

| Option group | Options | Status | Task | Replacement regression |
|---|---|---|---|---|
| Project selection | `--path` | Retained. `--project` is a new alias. Only `project: discover` commands walk parents for `story.md`; legacy commands stay on the flag, positional path, or cwd | 3 | `test/command-contract.test.js`, `test/registry.test.js` |
| Creation | `--title --dir --genre --sub-genre --setting-era --theme --themes --pov --tense --synopsis --series --book-number --follows --precedes --force` | Adapted | 3 | `test/project.test.js`, `test/init-add-safety.test.js` |
| Maintenance | `--write --log --date` | Retained | 10 | `test/progress.test.js`, `test/story.test.js` |
| Comparison | `--ref --against` | Adapted (git refs retained; `--against` removed, see §7) | 8 | `test/compare.test.js`, `test/changes.test.js` |
| Output | `--out --format --shunn --pages --actionable` | Adapted. `--format text\|json` selects the result envelope; `markdown\|epub\|docx\|shunn` stay build kinds until Task 12 `--kind` | 3, 10, 12 | `test/publishing.test.js`, `test/command-contract.test.js` |
| Knowledge | `--at` | Adapted (chapter id → scene/beat cursor) | 5 | `test/knowledge.test.js` |
| Entity fields | `--number --chapter --scene --type --role --status --mode --date --time --travel-hours --dilemma --sequel --location(s) --character(s) --mention(s) --member(s) --owner --arc(s) --introduced --resolved --planted --payoff --significance-delayed --category --alias(es) --region --population --controlled-by --prevalence --acts --placement --order --source(s) --used-in` | Adapted (schema-validated `--data <json-file>` mutations become the primary contract; per-design §9) | 3, 5, 6, 13 | `test/project.test.js`, `test/state.test.js`, `test/memory.test.js`, `test/assets.test.js` |
| Undocumented aliases | `--locations --characters --mentions --members --arcs --aliases --act --sources` | Intentionally removed once schema v2 `add` is replaced (undocumented convenience aliases; behavior replaced by repeatable documented forms and `--data`). Task 3 still accepts them because v2 `add` and `test/cli.test.js` use them | 3 | `test/cli.test.js` |
| Global (new) | `--help/-h --version/-v` | Retained. `--help` and `--version` stay plain text even when `--format json` is present | 3 | `test/registry.test.js`, `test/command-contract.test.js` |
| Result envelope (new) | `--format text\|json` | Stdout is one JSON result object when the value is `json`; logs stay on stderr. `text` is the plain result | 3 | `test/command-contract.test.js` |
| Mutation preview (new) | `--dry-run` | Added in Task 3 for fork init, import, and entity mutations; Task 5 adds `fact add` and `fact retract` | 3, 5 | `test/project.test.js`, `test/state.test.js` |
| Removal policy (new) | `--policy refuse\|detach` | Added in Task 3 for `entity remove` | 3 | `test/rename-remove.test.js` |
| Structured data (new) | `--data <json-file>` | Added in Task 5 for `fact add` | 5 | `test/state.test.js` |
| Story cursor (new) | `--scene <n\|id> --beat <id> --side before\|after` | Task 5 `fact list` cursor. `--scene` still takes a scene number for schema v2 `add`; `--side` defaults to `before` | 5 | `test/state.test.js` |
| Inactive records (new) | `--include-inactive --include-work` | Added in Task 5 for `fact list`. Listing never makes an inactive or `work/` record apply at a cursor | 5 | `test/state.test.js` |
| Fork selector (new) | `--toolkit` | Added in Task 3. Selects story-toolkit `init` and `import` | 3 | `test/project.test.js`, `test/command-contract.test.js` |

## 3. Skills

Baseline: 16 skills under `skills/`. Target: ten core skills (`story-workflow`,
`story-planning`, `story-writing`, `story-review`, `story-world`,
`story-memory`, `story-research`, `story-series`, `story-image-prompts`,
`story-publishing`) plus shared `resources/`. No skill is silently dropped;
every baseline skill's substantive references must appear in the target map.

| Baseline skill | Status | Target owner(s) | Task | Replacement regression |
|---|---|---|---|---|
| `story-init` | Adapted | `story-workflow`, `story-planning` | 14 | `test/skill-contract.test.js` |
| `plot-structure` | Adapted | `story-planning` | 14 | `test/skill-contract.test.js` |
| `theme-craft` | Adapted | `story-planning` | 14 | `test/skill-contract.test.js` |
| `scene-craft` | Adapted | `story-planning`, `resources/scene-craft.md` | 14 | `test/skill-contract.test.js` |
| `chapter-writing` | Adapted | `story-writing` | 14 | `test/skill-contract.test.js` |
| `discovery-drafting` | Adapted | `story-writing` | 14 | `test/skill-contract.test.js` |
| `voice-style` | Adapted | `story-writing` (style resources), `story-review` | 14, 15 | `test/skill-contract.test.js`, `test/prose.test.js` |
| `revision-continuity` | Adapted | `story-writing` (revision), `story-memory` | 14, 15 | `test/skill-contract.test.js`, `test/continuity.test.js` |
| `character-management` | Adapted | `story-world` | 15 | `test/skill-contract.test.js` |
| `worldbuilding` | Adapted | `story-world` | 15 | `test/skill-contract.test.js` |
| `feedback-triage` | Adapted | `story-review` | 15 | `test/skill-contract.test.js` |
| `research` | Adapted | `story-research` | 15 | `test/skill-contract.test.js`, `test/research.test.js` |
| `series-continuity` | Adapted | `story-series` | 16 | `test/skill-contract.test.js`, `test/series.test.js` |
| `submission` | Adapted | `story-publishing` | 16 | `test/skill-contract.test.js`, `test/publishing.test.js` |
| `story-maintenance` | Intentionally removed as a skill; its CLI checks are retained | `story-workflow` routing + the CLI itself | 10, 16 | `test/skill-contract.test.js`, `test/diagnostics.test.js` |
| Sixteen superseded entry points as shipped IDs | Intentionally removed after the ten-skill map above is complete | Ten new skill IDs | 16 | `test/skill-contract.test.js` (exactly ten shipped core skills) |

External pairing (README suggested installing the separate `better-writing`
skill) is intentionally removed from distribution guidance; voice/anti-generic
craft guidance is folded into the retained prose/style resources.

## 4. Exporters and publishing

| Capability | Baseline | Status | Task | Replacement regression |
|---|---|---|---|---|
| Manuscript export | `export --out`, front/back matter, chapter ordering | Retained | 12 | `test/publishing.test.js`, `test/matter.test.js` |
| Markdown build | `build --format markdown` | Retained | 12 | `test/publishing.test.js` |
| EPUB build | `build --format epub`, cover image, author | Retained | 12 | `test/publishing.test.js` |
| DOCX build | `build --format docx` | Retained | 12 | `test/publishing.test.js` |
| Shunn markdown | `build --format shunn` | Retained (as `--kind shunn-md`) | 12 | `test/shunn.test.js` |
| Shunn DOCX | `build --format docx --shunn` | Retained (as `--kind shunn-docx`) | 12 | `test/shunn-docx.test.js` |
| Synopsis | 1/3-page deterministic scaffold | Retained | 12 | `test/synopsis.test.js`, `test/synopsis-pages.test.js` |
| Word-count conventions | Documented counting used by export/build | Retained | 10, 12 | `test/story.test.js`, `test/publishing.test.js` |
| Submission/query material | Submission skill + CLI | Adapted | 12, 16 | `test/publishing.test.js`, `test/skill-contract.test.js` |

## 5. Templates, metadata and release machinery

| Capability | Baseline | Status | Task | Replacement regression |
|---|---|---|---|---|
| `templates/github/story-checks.yml` | PR checks via npx GitHub package | Adapted (routed through fork releases and current commands) | 21 | `test/check-scripts.test.js` workflow checks |
| `templates/github/draft-next-chapter.yml` | Scheduled drafting workflow | Adapted (same) | 21 | `test/check-scripts.test.js` workflow checks |
| `scripts/check-metadata.js` | Name/version alignment across package, plugin manifests, marketplaces, version module, template refs | Retained (plus the 1.0.0-prerelease guard added in Task 1) | 1, 17, 21 | `test/check-scripts.test.js`, `test/identity.test.js` |
| `scripts/check-fallback.js` + `build:fallback` | Verify the copied skill-local CLI fallback | Intentionally removed; replacement: one bundled CLI (`dist/story.js`, `node dist/story.js --help`) | 17 | `test/skill-build.test.js`, `test/package-smoke.test.js` |
| `skills/story-maintenance/scripts/story.js` | Bundled fallback binary shipped inside a skill | Intentionally removed; replacement: the packaged CLI (installation owns the executable, no skill-local copy) | 17 | `test/package-smoke.test.js` |
| `scripts/release.js`, `test/release.test.js` | Version bump across 4 surfaces + tag + GitHub release | Adapted (bump across all identity surfaces, dist/ artifacts, install manifest; prerelease-aware) | 19 | `test/release.test.js` |
| `plugins/story-skills` symlink + `.codex-plugin/`, `.claude-plugin/`, `.agents/` marketplace distribution | Multi-marketplace plugin distribution | Intentionally removed as distribution channels (identity fields aligned in Task 1); replacement: one release owning CLI + skill bundles + agents | 17 | `test/skill-build.test.js`, `test/identity.test.js` |
| `evals/` harness (fixtures, checker, model runner, comparisons) | Claude-CLI-centric evaluation | Adapted (fixtures retained; runner is host-neutral; CI stays model-free) | 20 | `test/workflow-eval.test.js`, `test/eval-contract.test.js`, `bun run check:evals` |

## 6. Tests (baseline regression inventory)

Baseline: 30 test files in `test/`. Dispositions below are the mapping that
Task 21 must be able to audit; every retirement requires evidence the behavior
is superseded or intentionally removed.

| Test file | Covers | Status | Task | Successor |
|---|---|---|---|---|
| `identity.test.js` | Package/runtime identity (added in Task 1) | New | 1 | — |
| `registry.test.js` | Command/option registry, help coherence | Adapted | 3 | same file |
| `cli.test.js` | CLI dispatch, version output, project resolution | Adapted | 3 | same file |
| `frontmatter.test.js` | Frontmatter parsing edge cases | Adapted | 2 | same file |
| `markdown.test.js` | Body/marker parsing | Adapted | 2 | same file |
| `schema.test.js` | Schema-version handling | Adapted | 2 | same file |
| `story.test.js` | Project scanning, validate/reindex/wordcount, export cases | Split | 3, 10, 12 | `test/project.test.js`, `test/diagnostics.test.js`, `test/publishing.test.js` |
| `init-add-safety.test.js` | Init/add refusal semantics | Adapted | 3 | same file + `test/project.test.js` |
| `import.test.js` | Manuscript import | Adapted | 3 | same file |
| `rename-remove.test.js` | Rename/remove reference handling | Adapted | 3 | same file |
| `timeline.test.js` | Timeline ordering/POV/presence | Adapted | 4 | `test/chronology.test.js` + same file |
| `custody-time.test.js` | Travel/custody time semantics | Adapted | 4 | same file + `test/chronology.test.js` |
| `knowledge.test.js` | Knowledge-at-chapter resolution | Adapted | 5 | same file + `test/state.test.js` |
| `knowledge-errors.test.js` | Knowledge failure modes | Adapted | 5 | same file + `test/state.test.js` |
| `continuity.test.js` | Continuity engine contracts | Adapted | 5, 10 | same file + `test/state.test.js` |
| `clue.test.js` | Setup/payoff ordering | Retained | 10 | same file |
| `exemptions.test.js` | Continuity exemptions | Adapted | 6 | `test/memory.test.js` + same file |
| `compare.test.js` | Draft comparison | Adapted | 8 | same file + `test/changes.test.js` |
| `prose.test.js` | Prose lint | Adapted | 10 | same file |
| `progress.test.js` | Progress tracking/logging | Adapted | 10 | same file |
| `research.test.js` | Research records | Retained | 10 | same file |
| `series.test.js` | Series chronology/canon | Adapted | 11 | same file + `test/series-state.test.js` |
| `series-backlink.test.js` | Series backlinks | Adapted | 11 | same file |
| `matter.test.js` | Matter pages in exports | Ported | 12 | `test/publishing.test.js` |
| `shunn.test.js` | Shunn markdown | Ported | 12 | `test/publishing.test.js` |
| `shunn-docx.test.js` | Shunn DOCX | Ported | 12 | `test/publishing.test.js` |
| `synopsis.test.js` | Synopsis generation | Ported | 12 | `test/publishing.test.js` |
| `synopsis-pages.test.js` | Synopsis page counts | Ported | 12 | `test/publishing.test.js` |
| `check-scripts.test.js` | Check scripts, workflow structure | Retained | 1, 17, 21 | same file |
| `release.test.js` | Release script unit behavior | Adapted | 19 | same file |
| `workflow-eval.test.js` | Eval checker contracts | Adapted | 20 | same file + `test/eval-contract.test.js` |
| `helpers.js` | Test temp-dir/I-O helpers | Adapted (superseded by `test/support/project.js` builders) | 2 | `test/support/project.js` |

## 7. Intentional removals

| Removed | Why | Behavior replacement |
|---|---|---|
| Copied fallback binary `skills/story-maintenance/scripts/story.js` (+ `build:fallback`, `check:fallback`, `check:node-help`) | Shipping a second executable inside a skill duplicates the CLI and drifts from the package; the toolkit ships one CLI | Packaged CLI (`dist/story.js` + `bin/story.js` entrypoint) installed from the fork release; Task 17 tests: `test/skill-build.test.js`, `test/package-smoke.test.js` |
| Marketplace plugin distribution (`.claude-plugin/`, `.codex-plugin/`, `.agents/` as install channels; `plugins/story-skills` symlink) | One owned distribution replaces multi-marketplace installs | `story setup` / release tarball installation (Tasks 17–19); identity fields remain aligned in the interim (`test/identity.test.js`) |
| Hidden undocumented option aliases (`--characters`, `--locations`, `--mentions`, `--members`, `--aliases`, `--arcs`, `--act`, `--sources`) | Undocumented convenience aliases; the new contract prefers documented repeatable forms and schema-validated `--data` | Documented repeatable options and `--data <json-file>` mutations (Task 3 onward); `test/command-contract.test.js` |
| `compare --against <folder>` baseline | Copied-project-folder baselines are not immutable; snapshots are explicit and hashed | `story snapshot` + `.story/revisions/` baselines (Task 8); `test/changes.test.js` |
| `build --format shunn` + separate `--shunn` flag | Overloaded option; kind is one concept | `build --kind shunn-md\|shunn-docx` (Task 12); `test/shunn.test.js`, `test/shunn-docx.test.js` |
| `story-maintenance` as a standalone skill | Its deterministic checks are CLI capabilities, not a creative skill | `story-workflow` routes to the CLI; all checks retained (Task 10); `test/diagnostics.test.js` |
| Sixteen baseline skill IDs as shipped entry points | Consolidated into ten skills; duplicate triggers must not ship | Ten-skill map in §3 (Task 16); `test/skill-contract.test.js` |
| README pairing instructions for the external `better-writing` skill | Fork distribution does not advertise a third-party install as its prose layer | Retained craft/style resources in `resources/` (Task 14) |
| `bun run release` during development prereleases | The release script requires plain `MAJOR.MINOR.PATCH`; product 1.0.0 is reserved | Prerelease version bumps are made by hand across all identity surfaces, guarded by `bun run check:metadata` and `test/identity.test.js` |

## 8. Maintenance of this ledger

- A task that removes or replaces behavior must update the relevant row in the
  same commit as the change.
- A row may only move to "done" when its replacement regression file exists and
  passes; Task 21 closes out the ledger and records the final mapping.
- Provenance for imported third-party material lives in
  [`provenance/creative-sources.json`](../../provenance/creative-sources.json)
  and [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).
