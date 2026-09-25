import { describe, expect, test } from "bun:test";
import path from "node:path";
import { HELP, resolveRoot, runCli } from "../src/cli.js";
import { COMMANDS } from "../src/commands.js";
import { OPTIONS, parseArgs } from "../src/options.js";
import { makeTempDir, memoryIo } from "./helpers.js";

describe("command registry", () => {
  test("every command is well formed and unique", () => {
    const paths = COMMANDS.map((command) => command.path.join(" "));
    expect(new Set(paths).size).toBe(paths.length);
    for (const command of COMMANDS) {
      expect(command.path[0]).toBe(command.name);
      expect(command.usage.split(" ")[0]).toBe(command.name);
      expect(["positional", "flag", "discover", "none"]).toContain(command.project);
      expect(command.summary.length).toBeGreaterThan(0);
      expect(typeof command.run).toBe("function");
      expect(command.handler).toBe(command.run);
      expect(typeof command.mutates).toBe("boolean");
      expect(Array.isArray(command.args)).toBe(true);
      expect(Array.isArray(command.optionSchema)).toBe(true);
      expect(Array.isArray(command.examples)).toBe(true);
    }
  });

  test("help lists every command and every documented option", () => {
    for (const command of COMMANDS) {
      expect(HELP).toContain(`  ${command.usage}`);
    }
    for (const option of OPTIONS.filter((entry) => entry.help)) {
      expect(HELP).toContain(`--${option.name}${option.value ? ` ${option.value}` : ""}`);
    }
    for (const line of HELP.split("\n")) {
      expect(line.length).toBeLessThanOrEqual(80);
    }
  });

  test("options are unique and every hidden alias is repeatable", () => {
    const names = OPTIONS.map((option) => option.name);
    expect(new Set(names).size).toBe(names.length);
    for (const option of OPTIONS.filter((entry) => !entry.help)) {
      expect(option.repeatable).toBe(true);
    }
  });

  test("positional commands take their first argument as the project path", () => {
    const cwd = makeTempDir();
    for (const command of COMMANDS) {
      const parsed = parseArgs([...command.path, "book"]);
      const expected = command.project === "positional" ? path.join(cwd, "book") : cwd;
      expect(resolveRoot(cwd, parsed, command.path[0])).toBe(expected);
    }
  });

  test("commands that create projects refuse --path", () => {
    const cwd = makeTempDir();
    for (const command of COMMANDS.filter((entry) => entry.project === "none")) {
      for (const flag of ["path", "project"]) {
        const io = memoryIo(cwd);
        expect(runCli([command.name, "x", `--${flag}`, "."], io)).toBe(1);
        expect(io.error()).toBe(`${command.name} uses --dir for the target directory. --${flag} is the project root for other commands.\n`);
      }
    }
  });
});
