export function envelope({ command, ok, data = null, diagnostics = [], writes = [] }) {
  return { apiVersion: 1, command, ok, data, diagnostics, writes };
}

export function finding({ code, severity = "error", message, recordIds = [], sources = [], evidence = "structural", action }) {
  return { code, severity, message, recordIds, sources, evidence, action };
}

const ACTIONS = {
  INVALID_INVOCATION: "Fix the command arguments and try again.",
  PROJECT_NOT_FOUND: "Run story init --toolkit, or pass --project with a story-toolkit project.",
  PROJECT_EXISTS: "Choose a new directory. Existing projects are never overwritten.",
  OUTPUT_EXISTS: "Pass --out pointing at a directory that does not exist yet.",
  UNKNOWN_ENTITY_TYPE: "Use one of the entity types listed in story entity add.",
  DUPLICATE_RECORD_ID: "Ids are immutable and unique. Choose a different explicit id or omit it.",
  ENTITY_NOT_FOUND: "Check the id with story entity show, or add the entity first.",
  REQUIRED_REFERENCE: "Resolve the fact with an explicit reconciliation proposal before removing this entity.",
  REFERENCE_PRESENT: "Use --policy detach for optional structural references, or reconcile required references first.",
  STALE_SOURCE: "Reload the project and retry the command.",
  PROJECT_FORMAT: "This command reads format story-toolkit projects. Schema v2 projects stay on the existing commands.",
  COMMAND_FAILED: "Fix the reported error and run the command again."
};

export function failure(command, message, code, exitCode, recordIds = [], evidence = "structural") {
  return {
    envelope: envelope({
      command,
      ok: false,
      diagnostics: [finding({
        code,
        message,
        recordIds,
        evidence,
        action: ACTIONS[code] ?? "See the diagnostic and correct the project or the command."
      })]
    }),
    exitCode,
    text: `${message}\n`
  };
}

export function present(ctx, finished) {
  if (ctx.json) {
    if (finished.log) ctx.io.stderr.write(finished.log);
    ctx.io.stderr.write(`story: ${finished.envelope.command}\n`);
  } else {
    if (finished.log) ctx.io.stderr.write(finished.log);
    if (finished.exitCode === 0) {
      if (finished.text) ctx.io.stdout.write(finished.text);
    } else if (finished.text) {
      ctx.io.stderr.write(finished.text.endsWith("\n") ? finished.text : `${finished.text}\n`);
    }
  }
  return finished;
}

export function argvRequestsJson(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format" && argv[index + 1] === "json") return true;
    if (arg === "--format=json") return true;
  }
  return false;
}

export function invocationEnvelope(command, message) {
  return envelope({
    command,
    ok: false,
    diagnostics: [finding({
      code: "INVALID_INVOCATION",
      message,
      action: ACTIONS.INVALID_INVOCATION
    })]
  });
}

export function publicWrite(write) {
  return {
    path: write.path,
    action: write.action,
    expectedHash: write.expectedHash ?? null
  };
}
