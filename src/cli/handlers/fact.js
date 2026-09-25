import { isTruthy } from "../../options.js";
import { addFact, listFacts, retractFact } from "../../memory/facts.js";
import { present } from "../result.js";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

/** A cursor from --scene, --beat, and --side; undefined without --scene. */
export function cursorOption(options) {
  const sceneId = optionValue(options.scene);
  if (sceneId === undefined) return undefined;
  const cursor = { sceneId: String(sceneId), side: optionValue(options.side) ?? "before" };
  const beatId = optionValue(options.beat);
  if (beatId !== undefined) cursor.beatId = String(beatId);
  return cursor;
}

export function addFactCommand(ctx) {
  return present(ctx, addFact(ctx.root(), {
    cwd: ctx.cwd,
    dataPath: optionValue(ctx.parsed.options.data),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}

export function listFactsCommand(ctx) {
  const options = ctx.parsed.options;
  return present(ctx, listFacts(ctx.root(), {
    cursor: cursorOption(options),
    beatId: optionValue(options.beat),
    side: optionValue(options.side),
    includeInactive: isTruthy(options["include-inactive"]),
    includeWork: isTruthy(options["include-work"])
  }));
}

export function retractFactCommand(ctx) {
  return present(ctx, retractFact(ctx.root(), ctx.parsed.positionals[2], {
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}
