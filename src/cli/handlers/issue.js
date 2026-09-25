import { isTruthy } from "../../options.js";
import { addIssue, dismissIssue, listIssues, resolveIssue } from "../../memory/issues.js";
import { present } from "../result.js";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function mutation(ctx) {
  return {
    cwd: ctx.cwd,
    dataPath: optionValue(ctx.parsed.options.data),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  };
}

export function addIssueCommand(ctx) {
  return present(ctx, addIssue(ctx.root(), mutation(ctx)));
}

export function listIssuesCommand(ctx) {
  const record = optionValue(ctx.parsed.options.record);
  return present(ctx, listIssues(ctx.root(), {
    includeInactive: isTruthy(ctx.parsed.options["include-inactive"]),
    record: record === undefined ? undefined : String(record)
  }));
}

export function resolveIssueCommand(ctx) {
  return present(ctx, resolveIssue(ctx.root(), ctx.parsed.positionals[2], mutation(ctx)));
}

export function dismissIssueCommand(ctx) {
  return present(ctx, dismissIssue(ctx.root(), ctx.parsed.positionals[2], mutation(ctx)));
}
