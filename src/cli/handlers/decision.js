import { isTruthy } from "../../options.js";
import { addDecision, listDecisions, supersedeDecision } from "../../memory/decisions.js";
import { present } from "../result.js";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

export function addDecisionCommand(ctx) {
  return present(ctx, addDecision(ctx.root(), {
    cwd: ctx.cwd,
    dataPath: optionValue(ctx.parsed.options.data),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}

export function listDecisionsCommand(ctx) {
  const record = optionValue(ctx.parsed.options.record);
  return present(ctx, listDecisions(ctx.root(), {
    includeInactive: isTruthy(ctx.parsed.options["include-inactive"]),
    record: record === undefined ? undefined : String(record)
  }));
}

export function supersedeDecisionCommand(ctx) {
  return present(ctx, supersedeDecision(ctx.root(), ctx.parsed.positionals[2], {
    cwd: ctx.cwd,
    dataPath: optionValue(ctx.parsed.options.data),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}
