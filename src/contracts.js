// Shared contracts for the Story Toolkit. This module documents the cross-task
// interfaces (as JSDoc typedefs) and owns the small runtime pieces every task
// shares: the format discriminator constants and the coded error type used by
// the storage layer. Functions listed here are exported from their owning
// modules; later tasks implement the ones this task only declares.

export const FORMAT = "story-toolkit";
export const SCHEMA_VERSION = 1;

/**
 * A coded, actionable failure. The `code` is stable across releases and is
 * what callers match on; `message` is for display, `details` carries
 * structured extras (paths, ids) when available.
 */
export class StorageError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/**
 * A reference to evidence: exact source bytes selected from a project file.
 * Hashes always cover actual selected UTF-8 bytes, never parsed prose.
 * Persisted frontmatter uses kebab-case keys (`scene`, `beat`); the in-memory
 * form uses `sceneId`/`beatId`, and adapters translate deliberately.
 *
 * @typedef {object} SourceRef
 * @property {string} path Project-relative path of the source file.
 * @property {string} [sceneId] Scene the evidence was selected within.
 * @property {string} [beatId] Beat the evidence was selected within.
 * @property {string} hash SHA-256 hex of the selected source bytes.
 * @property {("manuscript"|"author-decision"|"research"|"asset")} kind Evidence kind.
 */

/**
 * A position in story time. `side` distinguishes the moment before a marker
 * from the moment after it; scene entry is before all beats, scene exit is
 * after all beats.
 *
 * @typedef {object} Cursor
 * @property {string} sceneId
 * @property {string} [beatId]
 * @property {("before"|"after")} side
 */

/**
 * A stable, actionable finding. `evidence` declares how the finding was
 * derived: `structural` (files/schema), `declared` (record contents), or
 * `candidate` (search heuristics that need human confirmation).
 *
 * @typedef {object} Diagnostic
 * @property {string} code Stable diagnostic code.
 * @property {("error"|"warning"|"info")} severity
 * @property {string} message
 * @property {string[]} recordIds
 * @property {SourceRef[]} sources
 * @property {("structural"|"declared"|"candidate")} evidence
 * @property {string} action Suggested next step for the caller.
 */

/**
 * A single intended file change in a transaction. `expectedHash: null`
 * asserts that the target does not exist; it never means "skip validation".
 *
 * @typedef {object} Write
 * @property {string} path Project-relative target path.
 * @property {("create"|"replace"|"remove")} action
 * @property {string|null} expectedHash SHA-256 hex of the current target bytes, or null for absence.
 * @property {Uint8Array|string} [content] New bytes for create/replace.
 */

/**
 * The shared CLI result envelope (design §9). Both text and JSON output are
 * rendered from this one object.
 *
 * @typedef {object} Result
 * @property {1} apiVersion
 * @property {string} command
 * @property {boolean} ok
 * @property {unknown} data
 * @property {Diagnostic[]} diagnostics
 * @property {Write[]} writes
 */

/**
 * Outcome of a validated multi-file write.
 *
 * @typedef {object} MutationResult
 * @property {boolean} ok
 * @property {Diagnostic[]} diagnostics
 * @property {{ path: string, action: Write["action"] }[]} writes
 * @property {string} [transactionId]
 * @property {boolean} [dryRun] True when nothing was written.
 */

/**
 * A loaded project snapshot: root, records indexed by ID, and the diagnostics
 * found while loading. It is a snapshot of read files, not authority to
 * overwrite later edits. Later tasks extend it with manuscript spans, source
 * hashes per record, and derived indexes.
 *
 * @typedef {object} Project
 * @property {string} root
 * @property {Map<string, { id: string, type: string, path: string, hash: string, record: object }>} records
 * @property {Diagnostic[]} diagnostics
 */

/**
 * Comparison outcome for two scenes in story time. Unknown ordering is
 * `unordered`, never silently `equal`.
 *
 * @typedef {("before"|"equal"|"after"|"unordered")} ChronologyOrder
 * @typedef {object} Chronology
 * @property {(a: object, b: object) => ChronologyOrder} compare
 */

/**
 * A context request (Task 7, `src/context/build.js`). Scene tasks (`draft`,
 * `revise`, `review`, `image`) need `target`; the other tasks work at project
 * level and take an optional target. `audience: "reader"` is a reader
 * simulation: task `review`, `target` is the reading boundary, and no
 * `include` ids.
 *
 * @typedef {object} ContextRequest
 * @property {("plan"|"draft"|"revise"|"review"|"world"|"memory"|"research"|"series"|"image"|"publish")} task
 * @property {Cursor} [target] `{ sceneId, beatId?, side }`.
 * @property {("writer"|"reader")} [audience] Defaults to `writer`.
 * @property {string[]} [constraints] Caller constraints, always required.
 * @property {string[]} [include] Record ids to retrieve as required material.
 * @property {number} [maxBytes] UTF-8 byte budget for the serialized packet; default 48,000.
 */

/**
 * A context packet: selected source material, never a CLI-written summary.
 * Every item carries `{ id, kind, reason, required, sources, content }`.
 * `impact` holds later material for revision checks, apart from the writer's
 * in-scene knowledge. `required` is filled only when required material cannot
 * fit, together with a `CONTEXT_BUDGET_EXCEEDED` diagnostic.
 *
 * @typedef {object} ContextPacket
 * @property {string|null} operation
 * @property {("writer"|"reader")} audience
 * @property {Cursor|null} target
 * @property {number} maxBytes
 * @property {number} bytes UTF-8 bytes of the whole serialized packet.
 * @property {object[]} items
 * @property {object[]} impact
 * @property {{ id: string, kind: string, reason: string, retrieval: string, bytes: number }[]} omissions
 * @property {object[]} required
 * @property {Diagnostic[]} diagnostics
 */

/**
 * A comparison of the working project with a resolved baseline
 * (src/changes/compare.js). Records and scenes match by stable id; add,
 * remove, content change and move are classified independently, so a
 * renamed file is a move and a scene moved with identical bytes is not a
 * rewrite. `baseline` stores the resolution: a Git ref with the commit it
 * named, or a snapshot with its manifest hash.
 *
 * @typedef {object} ChangeReport
 * @property {{ kind: "git", ref: string, commit: string } | { kind: "snapshot", name: string, hash: string }} baseline
 * @property {{ added: string[], removed: string[], changed: { path: string, from: string, to: string }[] }} files
 * @property {{ id: string, type: string, path: string }[]} added
 * @property {{ id: string, type: string, path: string }[]} removed
 * @property {{ id: string, type: string, path: string, fields: string[], body: boolean }[]} changed
 * @property {{ id: string, type: string, from: string, to: string }[]} moved
 * @property {{ added: object[], removed: object[], changed: object[], moved: object[] }} scenes
 * @property {{ added: string[], removed: string[], changed: { id: string, fields: string[], from: object, to: object }[] }} facts
 * @property {{ recordId: string, field: string, ref: object, recorded: string|null, baseline: string|null, current: string|null, status: ("removed"|"changed") }[]} sources
 * @property {{ ok: boolean, files: object[] } | null} scope
 * @property {Diagnostic[]} diagnostics
 */

/**
 * @typedef {object} ImpactReport
 * @property {string[]} explicit
 * @property {string[]} transitive
 * @property {string[]} candidates
 */

/**
 * An agent-extracted change proposal (design §8). Carries expected hashes for
 * every evidence/precondition dependency, a complete write set, affected ids,
 * and a rationale/source mapping per factual change. A proposal cannot weaken
 * or redefine its own caller-supplied scope restrictions.
 *
 * @typedef {object} Proposal
 * @property {string} id
 * @property {("working-edit"|"adoption"|"retcon")} operation
 * @property {Record<string, string>} expectedHashes
 * @property {Write[]} writes
 * @property {string[]} affectedIds
 * @property {{ id: string, rationale: string, sources: SourceRef[] }} changes
 */

/**
 * Exact allowed source ranges against a baseline hash (design §8,
 * schemas/scope.schema.json). Ranges are half-open UTF-8 byte ranges of the
 * baseline file; each owns both boundaries, so insertion at `start` or `end`
 * is allowed and an empty range is one insertion point. A file without
 * `ranges` may change freely; changed files the scope does not list are out
 * of scope. Checked by checkScope / checkScopeSpec (src/changes/scope.js).
 *
 * @typedef {object} ScopeSpec
 * @property {{ path: string, "baseline-hash": string, ranges?: { start: number, end: number }[], markers?: ("locked"|"editable"), restriction?: ("dialogue"|"dialogue-and-tags") }[]} files
 */

// Shared function contracts. Owning module per function; implementations land
// with the task that owns the behavior. Documented here so every task builds
// against the same surface.
//
// loadProject(root);                         // Promise<Project>            — src/project/load.js
// writeTransaction(root, writes, options);   // Promise<MutationResult>     — src/storage/transaction.js
// buildChronology(project);                  // Chronology with compare(a,b) — src/state/chronology.js
// resolveState(project, cursor);             // { facts, conflicts, unresolved } — src/state/facts.js
// buildContext(project, request);            // ContextPacket               — src/context/build.js
// resolveBaseline(root, since);             // { baseline, files, current } — src/changes/baseline.js
// compareRevision(project, baseline, { scope }); // ChangeReport          — src/changes/compare.js
// analyzeImpact(project, change);            // ImpactReport                — Task 9
// validateProposal(project, proposal);       // { ok, diagnostics, writes } — Task 9
// applyProposal(root, proposal, options);    // Promise<MutationResult>     — Task 9
// runChecks(project, options);               // Diagnostic[]                — Task 10
