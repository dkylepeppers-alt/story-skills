# Agent Instructions

These instructions apply to the entire `story-skills` repository. `CLAUDE.md` is a symlink to this file so Claude Code reads the same instructions. Edit this file and leave the symlink in place.

## Project Overview

Story Toolkit (`@dkylepeppers-alt/story-toolkit`) is a fork-owned writing toolkit: Agent Skills for fiction workflows plus a deterministic `story` CLI, sharing one project model of editable markdown with YAML frontmatter. Skills guide creative workflows; the CLI performs storage, validation, comparison, checks, exports, and other deterministic maintenance. Runtime is Node.js 22 or newer (JavaScript ESM); Bun 1.3.14 is the pinned development/test/build tool, not an end-user runtime requirement. The product release `1.0.0` is reserved; development runs on `1.0.0-rc.*` prereleases until acceptance.

The fork owns its project format (`format: story-toolkit`, `schema-version: 1`, with stable record IDs) and consolidates distribution into one release that owns the CLI, generated skill bundles, and agent definitions. Until the storage and packaging tasks land, existing schema-v2 examples and the legacy skill-local fallback still work; do not extend them.

Primary paths:

- `skills/` - current `SKILL.md` workflows and their reference files (consolidated into ten core skills by the skill tasks)
- `src/` - source modules for the `story` CLI. `src/commands.js` and `src/options.js` are the command and option registries: add a command or flag there, and `story --help`, argument parsing, and project-path handling follow from the entry
- `bin/story.js` - package binary entrypoint
- `docs/architecture/capability-ledger.md` - register of baseline capabilities and their disposition (retained/adapted/intentionally removed); update it in the same commit as any removal or replacement
- `provenance/creative-sources.json` - per-file provenance for third-party creative material; `THIRD_PARTY_NOTICES.md` and `licenses/` carry the required attribution
- `test/` - Bun tests; `examples/` - sample projects
- `scripts/` - CI check scripts and the release script
- `docs/` - user-facing guides, including the schema v2 reference (superseded by the fork format guide when the storage tasks land)
- `schemas/story.schema.json` - JSON schema for story project frontmatter; `test:examples` validates every example against it, so update both together
- `templates/github/` - GitHub Actions workflow templates users copy into a story repository
- `.codex-plugin/`, `.claude-plugin/`, `.agents/` - plugin and marketplace metadata (identity fields only; distribution restructuring is a later task)
- `skills/story-maintenance/scripts/story.js` - legacy bundled fallback CLI kept green until its replacement ships; do not extend it or treat it as a distribution path

## Development Commands

Use Bun for local development:

```shell
bun install
bun run story -- --help
bun run test
bun run test:coverage
bun run test:examples
bun run check:metadata
bun run check:evals
bun run build:fallback
bun run check:fallback
```

CI runs `check:metadata`, `test`, `test:coverage`, `test:examples`, `check:evals`, and the legacy fallback under Node in that order, plus a Node matrix that includes 22 (the minimum supported version). Use `bun run test` for normal verification. Because the legacy fallback bundles `src/`, run `bun run build:fallback` and `bun run check:fallback` after changing anything in `src/` so the generated file stays current. Use `bun run test:coverage` when changes affect CLI behavior, parsing, project scanning, validation, or release readiness.

## Implementation Rules

- Keep runtime code compatible with Node >=22 and the package's ESM style.
- Prefer standard `node:` imports and synchronous filesystem APIs where existing CLI code already uses them.
- Preserve the markdown-first project model. Do not add project-local generator scripts or build scripts that emit story content.
- When modifying anything in `src/`, run `bun run build:fallback` and `bun run check:fallback` to keep the legacy bundled fallback current; it is not a distribution channel and must not be extended.
- Register new CLI commands in `src/commands.js` (with `project: "positional"` when they take `[path]`) and new flags in `src/options.js`; never hand-edit help text or add a separate dispatch branch.
- Add or update focused Bun tests for behavior changes.
- Keep examples realistic and valid; if you change the story project format, update examples and tests together.
- When instructions add, remove, rename, or revise story entities, run the appropriate maintenance commands: `story reindex`, `story wordcount --write`, `story links`, and/or `story validate`.
- When a change removes or replaces a baseline capability, update `docs/architecture/capability-ledger.md` in the same commit.
- When a change imports or adapts third-party material, update `provenance/creative-sources.json` and `THIRD_PARTY_NOTICES.md` in the same commit.

## Skill Authoring

- Every skill lives in `skills/<skill-name>/SKILL.md` with YAML frontmatter containing `name` and `description`.
- Keep skill instructions operational and agent-facing: what to read, what to edit, what checks to run, and when to ask the user.
- Reference files belong under the relevant skill's `references/` directory. Material adapted from Creative Writing Skills must be recorded in `provenance/creative-sources.json` and attributed in `THIRD_PARTY_NOTICES.md`.
- Story entities should use kebab-case identifiers and maintain bidirectional links where the domain requires them.

## Git And Commits

- Use Conventional Commits for commit messages, such as `feat: add chapter export option`, `fix: repair registry validation`, or `docs: update skill instructions`.
- Keep commits focused on one logical change.
- Update branches by rebasing onto `main`, not by merging `main` in; keep PR history linear.
- Force-push rebased branches only with `--force-with-lease`.

## Release Metadata

During development prereleases, keep the identity surfaces aligned in one commit; `bun run check:metadata` enforces this:

- `package.json`
- `.codex-plugin/plugin.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`
- `src/version.js` (printed by `story --version`, bundled into the legacy fallback)
- `templates/github/*.yml` `STORY_REF`, which equals `v{version}`

The version must be a `1.0.0` prerelease until toolkit acceptance. Do not bump these by hand into a plain release: `bun run release <patch|minor|major|X.Y.Z>` requires a plain `MAJOR.MINOR.PATCH` version, bumps all surfaces, rebuilds the fallback, runs the CI checks, commits, tags, pushes, and creates the GitHub release. It is not to be run while on prereleases.

## Generated And Local Artifacts

Do not commit:

- `node_modules/`
- `coverage/`
- generated story build output under example `dist/` directories unless explicitly requested
- editor or OS swap files

## Review Checklist

Before finishing code or skill changes, check:

- The CI checks pass locally: `bun run check:metadata`, `bun run test`, `bun run test:coverage`, `bun run test:examples`, `bun run check:evals`.
- CLI help and skill docs still agree on command names and options.
- The legacy bundled fallback is current: `bun run check:fallback`, and it still runs with `node skills/story-maintenance/scripts/story.js --help`.
- Registries, backlinks, and word counts remain deterministic for story projects.
- The capability ledger and provenance records still match reality.
