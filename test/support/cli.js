import fs from "node:fs";
import path from "node:path";
import { expect } from "bun:test";
import { runCli } from "../../src/cli.js";
import { memoryIo } from "../helpers.js";

export function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

// One JSON result object on stdout, parsed.
export function json(cwd, argv) {
  const result = invoke(cwd, [...argv, "--format", "json"]);
  expect(result.out.includes("\n")).toBe(false);
  return { ...result, parsed: JSON.parse(result.out) };
}

// A --data file beside the project, so it is never part of the project.
export function writeData(p, name, data) {
  const file = path.join(p.root, "..", `${path.basename(p.root)}-${name}.json`);
  fs.writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data));
  return file;
}

// Project file contents outside .story/, for asserting that nothing changed.
export function files(root) {
  const found = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".story") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else found[path.relative(root, full)] = fs.readFileSync(full, "utf8");
    }
  };
  walk(root);
  return found;
}
