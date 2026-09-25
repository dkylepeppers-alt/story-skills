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
 * @typedef {object} ContextRequest
 * @property {("plan"|"draft"|"revise"|"review"|"world"|"memory"|"research"|"series"|"image"|"publish")} task
 * @property {string} [sceneId]
 * @property {string} [beatId]
 * @property {Cursor} [cursor]
 * @property {("reader"|string)} [audience]
 * @property {object} [readerBoundary]
 * @property {string[]} [constraints]
 * @property {string[]} [ids]
 * @property {number} [maxBytes]
 */

/**
 * @typedef {object} ContextPacket
 * @property {string[]} constraints
 * @property {{ item: object, reason: string }[]} selected
 * @property {object} state
 * @property {Diagnostic[]} diagnostics
 * @property {{ description: string }[]} omissions
 */

/**
 * @typedef {object} ChangeReport
 * @property {{ id: string, path: string }[]} added
 * @property {{ id: string }[]} removed
 * @property {{ id: string, from: object, to: object }[]} changed
 * @property {{ id: string, from: string, to: string }[]} moved
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
 * Exact allowed source ranges against a baseline hash (design §8).
 *
 * @typedef {object} ScopeSpec
 * @property {{ path: string, baselineHash: string, ranges: { start: number, end: number }[] }[]} files
 */

// Shared function contracts. Owning module per function; implementations land
// with the task that owns the behavior. Documented here so every task builds
// against the same surface.
//
// loadProject(root);                         // Promise<Project>            — src/project/load.js
// writeTransaction(root, writes, options);   // Promise<MutationResult>     — src/storage/transaction.js
// buildChronology(project);                  // Chronology with compare(a,b) — src/state/chronology.js
// resolveState(project, cursor);             // { facts, conflicts, unresolved } — src/state/facts.js
// buildContext(project, request);            // ContextPacket               — Task 7
// compareRevision(project, baseline, scope); // ChangeReport                — Task 8
// analyzeImpact(project, change);            // ImpactReport                — Task 8
// validateProposal(project, proposal);       // { ok, diagnostics, writes } — Task 8
// applyProposal(root, proposal, options);    // Promise<MutationResult>     — Task 8
// runChecks(project, options);               // Diagnostic[]                — Task 10
