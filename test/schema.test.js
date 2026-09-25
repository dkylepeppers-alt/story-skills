import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020";
import { FORMAT, SCHEMA_VERSION } from "../src/contracts.js";
import { resolveRecordSchema, validateDocument, validateRecord } from "../src/project/schema.js";

const schemasDir = path.resolve(import.meta.dir, "..", "schemas");
const SCHEMA_NAMES = [
  "project", "entity", "scene", "fact", "decision", "issue",
  "research", "series", "asset", "shot", "proposal", "scope"
];

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(schemasDir, `${name}.schema.json`), "utf8"));
}

describe("fork record schemas", () => {
  test("all twelve record schemas exist and compile under draft 2020-12", () => {
    const ajv = new Ajv2020({ allErrors: true });
    for (const name of SCHEMA_NAMES) {
      const schema = loadSchema(name);
      expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
      expect(schema.$id).toContain(`${name}.schema.json`);
      expect(ajv.compile(schema), name).toBeTypeOf("function");
    }
  });

  test("every schema carries the format discriminator, version, strictness and extensions", () => {
    for (const name of SCHEMA_NAMES) {
      const schema = loadSchema(name);
      expect(schema.properties.format.const, name).toBe(FORMAT);
      expect(schema.properties["schema-version"].const, name).toBe(SCHEMA_VERSION);
      expect(schema.additionalProperties, name).toBe(false);
      expect(schema.properties.extensions, name).toEqual({ type: "object" });
    }
  });

  test("the type discriminator routes records to their schema", () => {
    expect(resolveRecordSchema({ type: "fact" })).toBe("fact");
    expect(resolveRecordSchema({ type: "scene" })).toBe("scene");
    expect(resolveRecordSchema({ type: "character" })).toBe("entity");
    expect(resolveRecordSchema({ type: "chapter" })).toBe("entity");
    expect(resolveRecordSchema({ type: "creature" })).toBe(null);
    expect(resolveRecordSchema("not a record")).toBe(null);
  });

  test("proposal and scope schemas gate their write ranges", () => {
    const scope = loadSchema("scope");
    expect(scope.properties.files.items.required).toContain("baseline-hash");
    expect(scope.properties.files.items.properties["baseline-hash"].pattern).toBe("^[0-9a-f]{64}$");

    const write = loadSchema("proposal").properties.writes.items;
    expect(write.properties.action.enum).toEqual(["create", "replace", "remove"]);
    expect(write.properties["expected-hash"].type).toEqual(["string", "null"]);
  });

  test("schema findings keep the ajv instance path so records point at the field", () => {
    const diagnostics = validateRecord({
      format: FORMAT,
      "schema-version": SCHEMA_VERSION,
      id: "iss_x",
      type: "issue",
      category: "continuity",
      severity: "fatal",
      status: "open"
    });
    expect(diagnostics[0].message).toContain("$.severity");
    expect(validateDocument({ format: FORMAT, "schema-version": SCHEMA_VERSION, files: [] }, "scope")).toEqual([]);
  });
});
