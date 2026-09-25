import { describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { makeTempDir, memoryIo } from "./helpers.js";
import { makeProject } from "./support/project.js";

function invoke(cwd, argv) {
  const io = memoryIo(cwd);
  const code = runCli(argv, io);
  return { code, out: io.output(), err: io.error() };
}

function envelope(result) {
  expect(result.out.includes("\n")).toBe(false);
  return JSON.parse(result.out);
}

describe("exit codes", () => {
  test("exit 0 is a completed command with no error findings in text and json", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    const text = invoke(p.root, ["entity", "show", "chr_ada"]);
    const json = invoke(p.root, ["entity", "show", "chr_ada", "--json"]);
    expect(text.code).toBe(0);
    expect(json.code).toBe(0);
    expect(envelope(json).ok).toBe(true);
    expect(envelope(json).diagnostics).toEqual([]);
  });

  test("exit 1 is a completed command with an error finding in text and json", () => {
    const cwd = makeTempDir();
    expect(invoke(cwd, ["init", "Exit One"]).code).toBe(0);
    const text = invoke(cwd, ["init", "Exit One"]);
    const json = invoke(cwd, ["init", "Exit One", "--json"]);
    expect(text.code).toBe(1);
    expect(json.code).toBe(1);
    expect(text.err).toContain("already exists");
    const parsed = envelope(json);
    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics[0].code).toBe("COMMAND_FAILED");
    expect(parsed.diagnostics[0].code).not.toBe("INVALID_INVOCATION");
  });

  test("a blocked removal is exit 1 in text and json for refuse and for detach", async () => {
    const refused = await makeProject();
    await refused.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await refused.addScene({ id: "scn_door", title: "Door", cast: ["chr_ada"] });
    const refuseText = invoke(refused.root, ["entity", "remove", "chr_ada", "--policy", "refuse"]);
    const refuseJson = invoke(refused.root, ["entity", "remove", "chr_ada", "--policy", "refuse", "--json"]);
    expect(refuseText.code).toBe(1);
    expect(refuseJson.code).toBe(1);
    expect(envelope(refuseJson).diagnostics[0].code).toBe("REFERENCE_PRESENT");
    expect(fs.existsSync(path.join(refused.root, "characters", "chr_ada.md"))).toBe(true);

    const detached = await makeProject();
    await detached.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await detached.addFact({ id: "fact_home", subject: "chr_ada", predicate: "location", value: "the pier" });
    const detachText = invoke(detached.root, ["entity", "remove", "chr_ada", "--policy", "detach"]);
    const detachJson = invoke(detached.root, ["entity", "remove", "chr_ada", "--policy", "detach", "--json"]);
    expect(detachText.code).toBe(1);
    expect(detachJson.code).toBe(1);
    expect(detachText.code).toBe(refuseText.code);
    expect(envelope(detachJson).diagnostics[0].code).toBe("REQUIRED_REFERENCE");
    expect(envelope(detachJson).writes).toEqual([]);
    expect(fs.existsSync(path.join(detached.root, "characters", "chr_ada.md"))).toBe(true);
  });

  test("exit 2 is an invalid invocation in text and json", () => {
    const cwd = makeTempDir();
    const unknownText = invoke(cwd, ["nope"]);
    const unknownJson = invoke(cwd, ["nope", "--json"]);
    expect(unknownText.code).toBe(2);
    expect(unknownJson.code).toBe(2);
    expect(envelope(unknownJson).diagnostics[0].code).toBe("INVALID_INVOCATION");

    const missingText = invoke(cwd, ["add", "chapter", "Foo", "--number"]);
    const missingJson = invoke(cwd, ["add", "chapter", "Foo", "--number", "--json"]);
    expect(missingText.code).toBe(2);
    expect(missingJson.code).toBe(2);
    expect(missingText.err).toContain("Missing value for --number");
    expect(envelope(missingJson).diagnostics[0].message).toContain("Missing value for --number");

    const initText = invoke(cwd, ["init", "Nope", "--path", "somewhere"]);
    const initJson = invoke(cwd, ["init", "Nope", "--path", "somewhere", "--json"]);
    expect(initText.code).toBe(2);
    expect(initJson.code).toBe(2);
    expect(initText.err).toContain("init uses --dir");
    expect(envelope(initJson).diagnostics[0].code).toBe("INVALID_INVOCATION");
  });

  test("exit 3 is a stale write in text and json", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addScene({ id: "scn_door", title: "Door", cast: ["chr_ada"] });
    const scenePath = path.join(p.root, "scenes", "scn_door.md");
    const real = fs.readFileSync;
    let reads = 0;
    const spy = spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
      if (String(filePath) === scenePath) {
        reads += 1;
        if (reads >= 3) return Buffer.from(`${real(filePath, ...args).toString("utf8")}\n<!-- stale -->\n`);
      }
      return real(filePath, ...args);
    });
    try {
      const text = invoke(p.root, ["entity", "remove", "chr_ada", "--policy", "detach"]);
      expect(text.code).toBe(3);
      expect(text.err).toContain("changed since");
    } finally {
      spy.mockRestore();
    }

    reads = 0;
    const again = spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
      if (String(filePath) === scenePath) {
        reads += 1;
        if (reads >= 3) return Buffer.from(`${real(filePath, ...args).toString("utf8")}\n<!-- stale -->\n`);
      }
      return real(filePath, ...args);
    });
    try {
      const json = invoke(p.root, ["entity", "remove", "chr_ada", "--policy", "detach", "--json"]);
      expect(json.code).toBe(3);
      expect(envelope(json).diagnostics[0].code).toBe("STALE_SOURCE");
    } finally {
      again.mockRestore();
    }
    expect(fs.existsSync(path.join(p.root, "characters", "chr_ada.md"))).toBe(true);
  });

  test("exit 4 is an operational failure in text and json", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addScene({ id: "scn_door", title: "Door", cast: ["chr_ada"] });
    const scenePath = path.join(p.root, "scenes", "scn_door.md");
    const real = fs.readFileSync;
    const install = () => {
      let reads = 0;
      return spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
        if (String(filePath) === scenePath) {
          reads += 1;
          if (reads >= 2) {
            const error = new Error(`EACCES: permission denied, open '${scenePath}'`);
            error.code = "EACCES";
            throw error;
          }
        }
        return real(filePath, ...args);
      });
    };
    const textSpy = install();
    try {
      const text = invoke(p.root, ["entity", "remove", "chr_ada", "--policy", "detach"]);
      expect(text.code).toBe(4);
      expect(text.err).toContain("EACCES");
    } finally {
      textSpy.mockRestore();
    }
    const jsonSpy = install();
    try {
      const json = invoke(p.root, ["entity", "remove", "chr_ada", "--policy", "detach", "--json"]);
      expect(json.code).toBe(4);
      const parsed = envelope(json);
      expect(parsed.diagnostics[0].code).toBe("OPERATION_FAILED");
      expect(parsed.diagnostics[0].code).not.toBe("INVALID_INVOCATION");
    } finally {
      jsonSpy.mockRestore();
    }
    expect(fs.existsSync(path.join(p.root, "characters", "chr_ada.md"))).toBe(true);
  });

  test("json mode keeps detached-reference warnings on stderr", async () => {
    const p = await makeProject();
    await p.addEntity({ id: "chr_ada", type: "character", name: "Ada" });
    await p.addEntity({ id: "chr_bee", type: "character", name: "Bee" });
    await p.addScene({ id: "scn_door", title: "Door", cast: ["chr_ada", "chr_bee"] });
    const result = invoke(p.root, ["entity", "remove", "chr_ada", "--policy", "detach", "--json"]);
    expect(result.code).toBe(0);
    expect(envelope(result).diagnostics[0].code).toBe("REFERENCE_DETACHED");
    expect(result.err).toContain("Detached");
    expect(result.err).toContain("story: entity remove\n");
  });
});
