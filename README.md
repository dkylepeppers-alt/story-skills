<div align="center">

# Story Toolkit

**Agent skills and a companion CLI for planning, tracking, and drafting fiction in markdown.**

Story Toolkit gives agents a shared project format for fiction: a story bible, characters, worldbuilding, factions, artifacts, plot arcs, scenes, continuity state, promises and payoffs, timelines, and chapter drafts. Everything is plain markdown with YAML frontmatter, and a deterministic `story` CLI keeps the story bible a checkable contract.

This is the `@dkylepeppers-alt/story-toolkit` fork, in active development toward its first release candidate. The fork owns its project format and its distribution: one release will own the CLI, generated skill bundles, and agent definitions for one owned installation. See [`docs/architecture/capability-ledger.md`](docs/architecture/capability-ledger.md) for how existing capabilities are carried over, and [`docs/superpowers/specs/2026-09-24-story-toolkit-design.md`](docs/superpowers/specs/2026-09-24-story-toolkit-design.md) for the design being implemented.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Status and running it today

There is no published package yet. Run the CLI from a checkout (Node 22 or newer):

```shell
bun install
bun run story -- --help
```

Installation as an owned package (release tarball plus `story setup` for your agent host) lands with the release candidate. Until then, this README describes the current toolkit; install instructions will return with the first release.

## The continuity engine

Long-range consistency is what language models are worst at, and prompting can't fix it. Story Toolkit makes it deterministic: character deaths, promises and payoffs, open questions, scene casts, and durable knowledge and object state live in frontmatter, and `story continuity` treats contradictions the way a compiler treats type errors.

[`examples/the-unraveled-thread/`](examples/the-unraveled-thread/) is a deliberately broken mystery. Every file is well-formed, so it passes `story validate` and `story links` cleanly, but the story itself doesn't hold together:

```text
$ story continuity examples/the-unraveled-thread
Continuity check failed: 4 errors, 3 warnings, 0 dismissed
error: chapters/chapter-04.md lists edran-vale, who died in chapter-02; move posthumous appearances to mentions
error: continuity/promises/the-broken-compass.md pays off in chapter-02 before it is planted in chapter-03
error: continuity/questions/who-burned-the-mill.md resolves in chapter-02 before it is introduced in chapter-03
error: continuity/state.md knowledge-state[0] references missing chapter chapter-05
warning: chapters/chapter-03.md POV character nessa-thorn is not listed in characters
warning: continuity/promises/the-sealed-letter.md was planted in chapter-01, 3 chapters ago, and has no payoff yet
warning: continuity/state.md object-state[0] status active conflicts with worldbuilding/artifacts/vales-compass.md status destroyed
```

Every finding is exact, file-addressed, and reproducible, and CI asserts this output on every commit. Intentional flashbacks and posthumous appearances stay legal through the chapter `mentions` field, and findings listed in `continuity/exemptions.md` are reported as dismissed. `story doctor` and `story next` fold the same checks into prioritized repair actions.

## Skills

| Skill | What it does | Try saying |
|-------|-------------|------------|
| **story-init** | Scaffolds the story bible, folders, and registries | *"Start a new story"* |
| **character-management** | Creates character profiles with relationships, traits, arcs, and family trees | *"Create a character"* |
| **worldbuilding** | Builds locations and systems: magic, politics, technology, religion, and more | *"Design a magic system"* |
| **plot-structure** | Plans arcs with structures like three-act, hero's journey, Save the Cat, and kishotenketsu | *"Create a plot arc"* |
| **theme-craft** | Builds the controlling idea (value + cause premise), the moral argument, lie/truth arc types, antagonist design, and motif/symbolism audits | *"What's my story really about?"* |
| **genre-craft** | Genre packs with checkable conventions: mystery fair-play, romance beats, thriller, horror, MG/YA, sci-fi, and serial/episodic structure | *"Plan a fair-play mystery"* |
| **research** | Records the real-world facts a story relies on, with sources and the chapters that use them, and flags final chapters resting on unverified research | *"Fact-check the sailing in chapter 4"* |
| **chapter-writing** | Drafts chapters through an outline-first workflow that pulls from story context | *"Write the next chapter"* |
| **discovery-drafting** | Pantsing mode: draft from a story kernel, keep post-hoc chapter notes, and reconcile the bible after each discovery-drafted chapter | *"I want to discovery-write"* |
| **scene-craft** | Plans and checks the scene unit: Scene/Sequel structure, try/fail cycles, scene cards, dialogue subtext and voice differentiation, deep POV, exposition, flashbacks, and openings | *"Does this chapter breathe?"* |
| **voice-style** | Keeps a copyeditor's style sheet (dialect, house spellings, dialogue punctuation, character voices, watch words) and acts on `story prose` lint findings | *"Set up a style sheet for this book"* |
| **revision-continuity** | Revises drafts, audits continuity, and keeps character state, timeline, and arc changes consistent | *"Continuity-check chapter 3"* |
| **feedback-triage** | Collects alpha/beta reader feedback per round, synthesizes convergent and divergent notes, and hands a revision plan to revision-continuity | *"Triage the beta feedback"* |
| **series-continuity** | Starts sequels and prequels as linked projects, carries characters and world forward, and checks shared canon across books | *"Start a prequel to The Last Ember"* |
| **submission** | Checks submission readiness, drafts the query letter, pitch, comp titles, synopsis, and blurb, builds the Shunn manuscript, and tracks queries and responses | *"Help me query agents"* |
| **story-maintenance** | Runs deterministic CLI checks for validation, continuity, reports, indexing, links, word counts, import, and export | *"Validate my story project"* |

These workflows consolidate into ten core skills (`story-workflow`, `story-planning`, `story-writing`, `story-review`, `story-world`, `story-memory`, `story-research`, `story-series`, `story-image-prompts`, `story-publishing`) as the toolkit build proceeds; the capability ledger maps every existing method to its new home.

## Companion CLI

The `story` CLI handles deterministic project maintenance while the skills handle the creative work. It needs Node 22 or newer; install the declared `yaml` and `ajv` runtime dependencies before running the source checkout. From a checkout, use `bun install` and then `bun run story --help` (or `node bin/story.js`).

The CLI is for maintenance only. Agents write story content directly to markdown files and never create project-local build or generator scripts to emit the story.

**Create and restructure**

| Command | Purpose |
|---------|---------|
| `story init "The Last Ember"` | Scaffold a story project with the standard markdown layout |
| `story init "Book Two" --follows the-last-ember` | Scaffold a sequel (or a prequel with `--precedes`) linked to an existing book, writing the backlink |
| `story import draft.md --title "The Lost Coast"` | Split an existing manuscript into a new story project and suggest entity candidates |
| `story add character "Sera Voss"` | Create entity files for characters, locations, systems, factions, artifacts, arcs, chapters, scenes, questions, promises, clues, terms, research notes, and matter pages |
| `story add matter "Dedication"` | Add a front (default) or `--placement back` matter page such as a dedication, epigraph, or acknowledgments |
| `story rename character sera-voss "Sera Vale"` | Rename an entity and update kebab-case references |
| `story remove promise old-setup` | Remove an entity and scrub metadata references |
| `story migrate [path]` | Upgrade a project to the current schema |

**Check and repair**

| Command | Purpose |
|---------|---------|
| `story validate [path]` | Check required files, schema version, YAML frontmatter, registries, and word-count warnings |
| `story links [path]` | Check character, location, chapter, and arc cross-references and backlinks |
| `story continuity [path]` | Check deterministic continuity contracts: deaths, promises and payoffs, questions, casts, and durable state |
| `story series [path]` | Order linked sequels and prequels by chronology and check shared canon: deaths, casts, knowledge fact ids, names, and destroyed artifacts |
| `story reindex [path]` | Rebuild registry tables from the current markdown files |
| `story wordcount [path] --write` | Count chapter prose and update chapter frontmatter plus the chapter registry |
| `story doctor [path]` | Show health checks with actionable repair steps |
| `story next [path]` | Recommend the next deterministic writing or maintenance actions |
| `story report [path] --actionable` | Summarize inventory and optionally include next actions |

**Analyze**

| Command | Purpose |
|---------|---------|
| `story knowledge sera-voss --at chapter-03` | Show what a character knew at a chapter, from timeline-scoped knowledge state |
| `story timeline [path]` | Show scenes in story-time order from their `date`/`time` (marking scenes told out of order), POV balance by words, and each character's presence and longest absence |
| `story prose [path]` | Lint chapter prose: filter words, -ly adverbs, said-bookisms, echoes, sentence rhythm, repeated phrases, similar names, and `style-sheet.md` spellings and watch words |
| `story progress [path] --log` | Report words against `target-words`, the `deadline`, and chapter targets; `--log` records the day's count in `progress.md` for pace and a projected finish |
| `story compare [path] --ref draft-1` | Compare chapters with an earlier draft (a git ref, or `--against` a copied project folder): word changes, added and removed chapters, and unchanged paragraphs |

**Publish**

| Command | Purpose |
|---------|---------|
| `story synopsis [--pages 1\|3] [--out file]` | Compress arcs into a mechanical 1- or 3-page synopsis |
| `story export [path] --out manuscript.md` | Combine front matter, chapters, and back matter into a single manuscript markdown file |
| `story build [path] --format epub` | Build disposable markdown, EPUB, DOCX, or Shunn manuscript artifacts in `dist/`; EPUB builds embed the `story.md` `cover` image and `author` |

Behavior notes:

- **Matter pages** from `matter/` appear in the export and in every build format except Shunn, which is a submission format.
- **EPUB and DOCX** builds target plain prose: `*italic*` and `**bold**` become italic and bold runs, scene-break lines (`***`, `---`) become a `* * *` separator, and other markdown structure such as blockquotes, lists, and tables is flattened to text. The markdown export keeps chapter text as-is.
- **`story rename` and `story remove`** update entity ids in frontmatter reference fields and markdown link targets. They never edit prose, so a character called "Port" can be renamed without touching the word "port" in chapter text.
- A command that changes a frontmatter value regenerates that file's **frontmatter** from the parsed values, which drops any YAML comments in it. Files whose values don't change are left untouched.

For a complete starter transcript, read [`docs/first-20-minutes.md`](docs/first-20-minutes.md). For the project contract, read [`docs/schema-v2.md`](docs/schema-v2.md) and [`schemas/story.schema.json`](schemas/story.schema.json).

## Optional automation templates

[`templates/github/`](templates/github/) contains optional GitHub Actions workflows users can copy into a story repository: one runs the deterministic checks on every push and pull request, and one drafts a chapter on a schedule and opens a pull request for review. Both are being updated for the toolkit release; until then they pin the upstream package and may not match this fork's identity.

## Import an existing manuscript

Most writers don't start from a blank page. `story import` builds a story project from work in progress:

```shell
story import draft.md --title "The Lost Coast" --genre mystery
```

It splits the manuscript on chapter headings (or imports a directory of chapter files in natural name order, so `chapter-2` comes before `chapter-10`), creates the full project layout with accurate word counts and registries, and prints recurring proper-name candidates so an agent can follow up with `story add character` and `story add location` to build out the bible.

`--force` lets an import reuse an existing directory. It replaces every `chapter-NN.md` file in `chapters/`, so stale chapters from an earlier import are removed.

## Project structure

Running **story-init** creates this layout:

```
my-story/
├── story.md                  # Story bible: title, genre, themes, POV, tense
├── style-sheet.md            # Voice, house spellings, and watch words
├── characters/
│   └── _index.md             # Character registry
├── worldbuilding/
│   ├── _index.md             # World overview
│   ├── locations/
│   ├── systems/
│   ├── factions/
│   └── artifacts/
├── plot/
│   ├── _index.md             # Arc overview
│   ├── arcs/
│   └── timeline.md
├── scenes/
│   └── _index.md             # Machine-readable scene registry
├── continuity/
│   ├── state.md              # Character, object, and knowledge state
│   ├── questions/
│   │   └── _index.md
│   ├── promises/
│   │   └── _index.md
│   └── clues/
│       └── _index.md
├── glossary/
│   ├── _index.md
│   └── terms/
└── chapters/
    └── _index.md             # Chapter registry
```

Some files appear only once you need them: `matter/` for front and back matter, `research/` for research notes, `progress.md` for the session log written by `story progress --log`, and `continuity/exemptions.md` for dismissed continuity findings.

## How it works

Every story element is a markdown file with YAML frontmatter, and the skills cross-reference those files to keep the project consistent:

- **`story.md`** is the top-level bible that every skill reads. Its **`schema-version: 2`** field lets the CLI detect incompatible project formats.
- Every entity file is named by a **kebab-case identifier**, such as `sera-voss` or `chapter-01`.
- **`_index.md`** files are the registries for each domain.
- Relationships and references are kept **bidirectional**.
- Scene records and continuity state keep character knowledge, object ownership, and setups and payoffs in files, so they carry over between sessions.

The fork's project format (`format: story-toolkit`, `schema-version: 1`, with stable record IDs) replaces this schema as the storage tasks land; schema v2 remains valid in the meantime.

## Examples

Complete projects generated with these skills:

- [**The Cormorant Tide**](https://github.com/danjdewhurst/the-cormorant-tide)
- [**Pippa and the Borrowed Star**](https://github.com/danjdewhurst/christmas-childrens-story), a children's Christmas story (6 chapters, 2,183 words)

Examples in this repository:

- [`examples/the-last-ember/`](examples/the-last-ember/): a fantasy with three characters, two locations, a magic system, a plot arc with foreshadowing, and a drafted first chapter.
- [`examples/the-fall-of-the-citadel/`](examples/the-fall-of-the-citadel/): a prequel to The Last Ember, linked with `series`, `book-number`, and `precedes`, that shares characters and places with the first book. Run `story series examples/the-last-ember` to see the chronology.
- [`examples/harbor-of-second-light/`](examples/harbor-of-second-light/): a near-future coastal mystery with memory technology, a posthumous witness arc, populated continuity state, and a drafted first chapter.
- [`examples/the-unraveled-thread/`](examples/the-unraveled-thread/): a deliberately broken project that demonstrates every class of finding the continuity engine reports.

## Development and releasing

Development uses Bun (the pinned tool is `bun@1.3.14`; runtime code targets Node >=22):

```shell
bun install
bun run test
bun run test:coverage
bun run test:examples   # also validates every example against schemas/story.schema.json
bun run check:metadata
bun run check:evals
```

The `evals/` harness regression-tests the writing skills. Fixtures seed a drafting brief with known canon and known traps. A dependency-free checker verifies that drafts keep the canon and spring none of the traps, a model runner drafts through a real model and judges for invented canon, and a pairwise comparison measures the skill against a no-skill baseline. See [`evals/README.md`](evals/README.md).

```shell
bun run check:evals      # validate fixture schemas
bun run eval:selftest    # checker self-test against known-good drafts
node evals/run-skill.js  # full model run (needs model credentials)
```

Identity surfaces must stay aligned: `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, both `marketplace.json` files, `src/version.js` (printed by `story --version`), and the `STORY_REF` pins in `templates/github/*.yml`. `bun run check:metadata` enforces this.

The version is a `1.0.0` prerelease until the toolkit is accepted; product release `1.0.0` is reserved. During prereleases, bump all identity surfaces together by hand in one commit — the release script requires a plain `MAJOR.MINOR.PATCH` version and is not used on prereleases. The legacy bundled fallback in `skills/story-maintenance/scripts/story.js` must be rebuilt whenever `src/` changes (`bun run build:fallback`, `bun run check:fallback`); it is not a distribution path and is removed once the packaged CLI replaces it.

## License

[MIT](LICENSE) for this fork's code and instructions. This toolkit also adapts material from [Creative Writing Skills](https://github.com/haowjy/creative-writing-skills), licensed Apache-2.0; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), [`licenses/Apache-2.0.txt`](licenses/Apache-2.0.txt), and [`provenance/creative-sources.json`](provenance/creative-sources.json). The toolkit is based on the upstream [story-skills](https://github.com/danjdewhurst/story-skills) project by Dan Dewhurst (MIT).
