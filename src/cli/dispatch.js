import path from "node:path";
import { COMMANDS } from "../commands.js";
import { StorageError } from "../contracts.js";
import { formatOptionsHelp, isTruthy, parseArgs } from "../options.js";
import { discoverProject } from "../project/discover.js";
import { VERSION } from "../version.js";
import { matchCommand, validateInvocation } from "./registry.js";
import { argvRequestsJson, envelope, finding, invocationEnvelope } from "./result.js";

const INVOCATION_PREFIXES = [
  "Missing value",
  "Unknown option",
  "Unknown value",
  "Conflicting project paths",
  "A story title is required",
  "Cannot derive"
];

const COMMAND_COLUMN = 21;

export const HELP = [
  "Usage: story <command> [options]",
  "",
  "Commands:",
  ...formatCommandsHelp(),
  "",
  "Options:",
  ...formatOptionsHelp(),
  ...formatExamples(),
  "",
  "Values beginning with a dash may also use the --option=value form.",
  ""
].join("\n");

function formatCommandsHelp() {
  const lines = [];
  for (const command of COMMANDS) {
    const head = `  ${command.usage}`;
    const [first, ...rest] = command.summary;
    if (head.length < COMMAND_COLUMN - 1) {
      lines.push(`${head.padEnd(COMMAND_COLUMN)}${first}`);
    } else {
      lines.push(head, `${" ".repeat(COMMAND_COLUMN)}${first}`);
    }
    for (const line of rest) {
      lines.push(`${" ".repeat(COMMAND_COLUMN)}${line}`);
    }
  }
  return lines;
}

function formatExamples() {
  const examples = COMMANDS.flatMap((command) => command.examples);
  if (examples.length === 0) return [];
  return ["", "Examples:", ...examples.map((example) => `  ${example}`)];
}

function lastOptionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function commandFor(parsed, name) {
  return matchCommand(COMMANDS, parsed.positionals)
    ?? COMMANDS.find((command) => command.name === name && command.path.length === 1)
    ?? COMMANDS.find((command) => command.path[0] === name);
}

export function resolveRoot(cwd, parsed, name) {
  const command = commandFor(parsed, name);
  const projectFlag = lastOptionValue(parsed.options.project);
  const pathFlag = lastOptionValue(parsed.options.path);
  if (projectFlag !== undefined && pathFlag !== undefined && path.resolve(cwd, String(projectFlag)) !== path.resolve(cwd, String(pathFlag))) {
    throw new Error(`Conflicting project paths: --project ${projectFlag} and --path ${pathFlag}. Use one of --project or --path.`);
  }
  const flagPath = projectFlag ?? pathFlag;
  const flagLabel = projectFlag !== undefined ? "--project" : "--path";
  if (command?.project === "discover") {
    if (flagPath !== undefined) return path.resolve(cwd, String(flagPath));
    return discoverProject(cwd) ?? path.resolve(cwd, ".");
  }
  if (command?.project !== "positional") {
    if (flagPath !== undefined) return path.resolve(cwd, String(flagPath));
    return path.resolve(cwd, ".");
  }
  const positionalPath = command.path.length === 1 ? parsed.positionals[1] : undefined;
  if (positionalPath !== undefined && flagPath !== undefined) {
    const resolvedPositional = path.resolve(cwd, positionalPath);
    const resolvedFlag = path.resolve(cwd, String(flagPath));
    if (resolvedPositional !== resolvedFlag) {
      throw new Error(`Conflicting project paths: ${positionalPath} and ${flagLabel} ${flagPath}. Use either a positional path or ${flagLabel}, not both.`);
    }
    return resolvedFlag;
  }
  if (flagPath !== undefined || positionalPath !== undefined) {
    return path.resolve(cwd, String(flagPath ?? positionalPath));
  }
  return path.resolve(cwd, ".");
}

function captureIo(cwd) {
  const out = [];
  const err = [];
  return {
    cwd,
    stdout: { write(value) { out.push(String(value)); } },
    stderr: { write(value) { err.push(String(value)); } },
    output() { return out.join(""); },
    error() { return err.join(""); }
  };
}

function commandToken(argv) {
  for (const arg of argv) {
    if (!arg.startsWith("-")) return arg;
  }
  return "";
}

function rejectProjectFlag(io, json, name, flag) {
  const message = `${name} uses --dir for the target directory. --${flag} is the project root for other commands.`;
  if (json) {
    io.stdout.write(JSON.stringify(invocationEnvelope(name, message)));
    io.stderr.write(`${message}\n`);
  } else {
    io.stderr.write(`${message}\n`);
  }
  return 2;
}

function rejectInvocation(io, json, command, message, code = 2) {
  if (json) {
    io.stdout.write(JSON.stringify(invocationEnvelope(command, message)));
    io.stderr.write(`${message}\n`);
    return code;
  }
  io.stderr.write(message.endsWith("\n") ? message : `${message}\n`);
  return code;
}

export function runCli(argv, io) {
  let json = false;
  let commandName = "";
  try {
    const parsed = parseArgs(argv);
    json = lastOptionValue(parsed.options.format) === "json";
    const cwd = io.cwd ?? process.cwd();
    commandName = parsed.positionals[0] ?? "";

    if (parsed.options.version) {
      io.stdout.write(`${VERSION}\n`);
      return 0;
    }

    if (!commandName || commandName === "help" || parsed.options.help) {
      io.stdout.write(HELP);
      return 0;
    }

    const command = matchCommand(COMMANDS, parsed.positionals);
    if (!command) {
      const group = COMMANDS.filter((entry) => entry.path[0] === commandName && entry.path.length > 1);
      if (group.length > 0) {
        const message = `Usage:\n${group.map((entry) => `  story ${entry.usage}`).join("\n")}`;
        return rejectInvocation(io, json, commandName, message, 2);
      }
      if (json) {
        io.stdout.write(JSON.stringify(invocationEnvelope(commandName, `Unknown command: ${commandName}`)));
        io.stderr.write(`Unknown command: ${commandName}\n`);
        return 2;
      }
      io.stderr.write(`Unknown command: ${commandName}\n\n${HELP}`);
      return 2;
    }

    if (command.project === "none" && parsed.options.path !== undefined) {
      return rejectProjectFlag(io, json, command.name, "path");
    }
    if (command.project === "none" && parsed.options.project !== undefined) {
      return rejectProjectFlag(io, json, command.name, "project");
    }

    const problem = validateInvocation(command, parsed);
    if (problem) return rejectInvocation(io, json, command.path.join(" "), problem, 2);

    const useToolkit = isTruthy(parsed.options.toolkit) && typeof command.toolkit === "function";
    const invoke = useToolkit ? command.toolkit : command.run;
    const returnsResult = useToolkit || command.returnsResult === true;
    const sink = json && !returnsResult ? captureIo(cwd) : io;
    const outcome = invoke({
      parsed,
      io: sink,
      cwd,
      json,
      root: () => resolveRoot(cwd, parsed, commandName)
    });

    if (outcome && typeof outcome === "object" && outcome.envelope?.apiVersion === 1) {
      if (json) io.stdout.write(JSON.stringify(outcome.envelope));
      return outcome.exitCode;
    }

    if (json && sink !== io) {
      const code = outcome;
      const stderr = sink.error();
      const wrapped = envelope({
        command: command.path.join(" "),
        ok: code === 0,
        data: { stdout: sink.output(), stderr },
        diagnostics: code === 0 ? [] : [finding({
          code: "COMMAND_FAILED",
          message: stderr.trim() || "Command failed",
          action: "Fix the reported error and run the command again."
        })],
        writes: []
      });
      io.stdout.write(JSON.stringify(wrapped));
      if (stderr) io.stderr.write(stderr);
      return code;
    }

    return outcome;
  } catch (error) {
    const classified = classifyThrown(error);
    if (!json) json = argvRequestsJson(argv);
    if (!commandName) commandName = commandToken(argv);
    if (json) {
      io.stdout.write(JSON.stringify(envelope({
        command: commandName,
        ok: false,
        diagnostics: [finding({
          code: classified.code,
          message: classified.message,
          action: classified.code === "INVALID_INVOCATION"
            ? "Fix the command arguments and try again."
            : "Fix the reported error and run the command again."
        })]
      })));
    }
    io.stderr.write(`${classified.message}\n`);
    return classified.exitCode;
  }
}

function classifyThrown(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof StorageError) {
    if (error.code === "STALE_SOURCE" || error.code === "LOCKED") {
      return { exitCode: 3, code: error.code, message };
    }
    return { exitCode: 4, code: error.code || "OPERATION_FAILED", message };
  }
  if (error && (error.code === "EACCES" || error.code === "EPERM")) {
    return { exitCode: 4, code: "OPERATION_FAILED", message };
  }
  if (INVOCATION_PREFIXES.some((prefix) => message.startsWith(prefix))) {
    return { exitCode: 2, code: "INVALID_INVOCATION", message };
  }
  return { exitCode: 1, code: "COMMAND_FAILED", message };
}
