import { isTruthy } from "../../options.js";
import { importMarkdown } from "../../project/import.js";
import { initProject } from "../../project/init.js";
import { present } from "../result.js";

function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

export function initToolkitCommand(ctx) {
  return present(ctx, initProject({
    title: ctx.parsed.positionals.slice(1).join(" "),
    cwd: ctx.cwd,
    dir: optionValue(ctx.parsed.options.dir),
    genre: optionValue(ctx.parsed.options.genre),
    subGenre: optionValue(ctx.parsed.options["sub-genre"]),
    settingEra: optionValue(ctx.parsed.options["setting-era"]),
    pov: optionValue(ctx.parsed.options.pov),
    tense: optionValue(ctx.parsed.options.tense),
    synopsis: optionValue(ctx.parsed.options.synopsis),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}

export function importToolkitCommand(ctx) {
  return present(ctx, importMarkdown({
    source: ctx.parsed.positionals[1],
    cwd: ctx.cwd,
    out: optionValue(ctx.parsed.options.out),
    title: optionValue(ctx.parsed.options.title),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}
