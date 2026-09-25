import { isTruthy } from "../../options.js";
import { addEntity, removeEntity, renameEntity, showEntity } from "../../project/entities.js";
import { present } from "../result.js";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

export function addEntityCommand(ctx) {
  return present(ctx, addEntity(ctx.root(), {
    type: ctx.parsed.positionals[2],
    name: ctx.parsed.positionals.slice(3).join(" "),
    chapterId: optionValue(ctx.parsed.options.chapter),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}

export function renameEntityCommand(ctx) {
  return present(ctx, renameEntity(
    ctx.root(),
    ctx.parsed.positionals[2],
    ctx.parsed.positionals.slice(3).join(" "),
    { dryRun: isTruthy(ctx.parsed.options["dry-run"]) }
  ));
}

export function removeEntityCommand(ctx) {
  return present(ctx, removeEntity(ctx.root(), ctx.parsed.positionals[2], {
    policy: optionValue(ctx.parsed.options.policy),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}

export function showEntityCommand(ctx) {
  return present(ctx, showEntity(ctx.root(), ctx.parsed.positionals[2]));
}
