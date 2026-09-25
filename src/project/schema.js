import Ajv2020 from "ajv/dist/2020.js";
import { FORMAT, SCHEMA_VERSION } from "../contracts.js";
// Static JSON imports, so bundlers embed the schemas: the bundled fallback
// CLI runs from an installed skill directory with no schemas/ beside it.
import projectSchema from "../../schemas/project.schema.json" with { type: "json" };
import entitySchema from "../../schemas/entity.schema.json" with { type: "json" };
import sceneSchema from "../../schemas/scene.schema.json" with { type: "json" };
import factSchema from "../../schemas/fact.schema.json" with { type: "json" };
import decisionSchema from "../../schemas/decision.schema.json" with { type: "json" };
import issueSchema from "../../schemas/issue.schema.json" with { type: "json" };
import researchSchema from "../../schemas/research.schema.json" with { type: "json" };
import seriesSchema from "../../schemas/series.schema.json" with { type: "json" };
import assetSchema from "../../schemas/asset.schema.json" with { type: "json" };
import shotSchema from "../../schemas/shot.schema.json" with { type: "json" };
import proposalSchema from "../../schemas/proposal.schema.json" with { type: "json" };
import scopeSchema from "../../schemas/scope.schema.json" with { type: "json" };

const SCHEMAS = {
  project: projectSchema,
  entity: entitySchema,
  scene: sceneSchema,
  fact: factSchema,
  decision: decisionSchema,
  issue: issueSchema,
  research: researchSchema,
  series: seriesSchema,
  asset: assetSchema,
  shot: shotSchema,
  proposal: proposalSchema,
  scope: scopeSchema
};

const SCHEMA_NAMES = Object.keys(SCHEMAS);

const ENTITY_TYPES = new Set([
  "character", "location", "system", "faction", "object", "arc", "chapter",
  "question", "promise", "clue", "term", "matter"
]);

const TYPE_SCHEMAS = {
  project: "project",
  scene: "scene",
  fact: "fact",
  decision: "decision",
  issue: "issue",
  research: "research",
  series: "series",
  asset: "asset",
  shot: "shot"
};

let compiled = null;

function validators() {
  if (compiled === null) {
    const ajv = new Ajv2020({ allErrors: true });
    const schemas = {};
    for (const name of SCHEMA_NAMES) {
      const schema = SCHEMAS[name];
      schemas[name] = schema;
      ajv.addSchema(schema, schema.$id);
    }
    compiled = { ajv, schemas, validate: {} };
    for (const name of SCHEMA_NAMES) {
      compiled.validate[name] = ajv.compile(schemas[name]);
    }
  }
  return compiled;
}

/**
 * Maps a record's `type` discriminator to the schema that governs it. Rich
 * records have dedicated schemas; stable-profile entities share the entity
 * schema. Returns null for unknown types.
 */
export function resolveRecordSchema(record) {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return null;
  }
  if (Object.hasOwn(TYPE_SCHEMAS, record.type)) {
    return TYPE_SCHEMAS[record.type];
  }
  return ENTITY_TYPES.has(record.type) ? "entity" : null;
}

/**
 * Validates a proposal or scope document by schema name. Returns the same
 * diagnostic shape as validateRecord.
 */
export function validateDocument(data, name) {
  return checkFormatAndSchema(data, name);
}

/**
 * Validates a parsed record against its class schema. Format findings come
 * first and are precise: upstream schema v2 is rejected explicitly instead of
 * being misread as a story-toolkit record. Unknown core fields are rejected
 * by name; project-specific metadata belongs in `extensions`.
 */
export function validateRecord(record) {
  if (record && record.format === undefined && record["schema-version"] === 2) {
    return checkFormatAndSchema(record, "project");
  }
  const name = resolveRecordSchema(record);
  if (name === null) {
    return [diagnostic("UNKNOWN_RECORD_TYPE",
      `Record type must be one of ${[...SCHEMA_NAMES.filter((n) => n !== "proposal" && n !== "scope")].join(", ")} or an entity kind, got: ${typeDescription(record?.type)}`,
      record?.id, "Set type to a known record kind.")];
  }
  return checkFormatAndSchema(record, name);
}

function checkFormatAndSchema(record, name) {
  const diagnostics = [];
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return [diagnostic("SCHEMA_VIOLATION", "Document must be an object", undefined, "Supply a record object.")];
  }
  if (!SCHEMA_NAMES.includes(name)) {
    return [diagnostic("SCHEMA_VIOLATION", `Unknown schema: ${String(name)}`, record.id, "Select a documented schema name.")];
  }
  if (record.format !== FORMAT) {
    if (record.format === undefined && record["schema-version"] === 2) {
      diagnostics.push(diagnostic("FORMAT_UPSTREAM_V2",
        "Upstream schema v2 is not accepted as format story-toolkit; migrate the project before use",
        record.id, "Run the v2 adapter or rewrite the record in format story-toolkit."));
      return diagnostics;
    }
    diagnostics.push(diagnostic("FORMAT_UNSUPPORTED",
      `Record format must be "${FORMAT}", got ${typeDescription(record.format)}`,
      record.id, `Set format: ${FORMAT} on the record.`));
    return diagnostics;
  }
  if (record["schema-version"] !== SCHEMA_VERSION) {
    diagnostics.push(diagnostic("SCHEMA_VERSION_UNSUPPORTED",
      `Record schema-version must be ${SCHEMA_VERSION}, got ${typeDescription(record["schema-version"])}`,
      record.id, `Set schema-version: ${SCHEMA_VERSION} on the record.`));
    return diagnostics;
  }

  const { validate } = validators();
  const isValid = validate[name](record);
  if (!isValid) {
    for (const error of validate[name].errors ?? []) {
      diagnostics.push(diagnostic("SCHEMA_VIOLATION",
        `${ajvPath(error)} ${error.message}`,
        record.id, ajvAction(error)));
    }
  }
  return diagnostics;
}

function diagnostic(code, message, recordId, action) {
  return {
    code,
    severity: "error",
    message,
    recordIds: recordId === undefined ? [] : [recordId],
    sources: [],
    evidence: "structural",
    action
  };
}

function ajvPath(error) {
  const base = error.instancePath === "" ? "$" : `$.${error.instancePath.slice(1).replaceAll("/", ".")}`;
  if (error.keyword === "required") {
    return `${base}.${error.params.missingProperty}`;
  }
  if (error.keyword === "additionalProperties") {
    return `${base}.${error.params.additionalProperty}`;
  }
  if (error.keyword === "enum") {
    return base;
  }
  return base;
}

function ajvAction(error) {
  if (error.keyword === "additionalProperties") {
    return `Remove the unknown field or move project-specific metadata into extensions.`;
  }
  return "Correct the field to satisfy the record schema.";
}

function typeDescription(value) {
  if (value === undefined) {
    return "nothing";
  }
  return typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value) ?? String(value);
}
