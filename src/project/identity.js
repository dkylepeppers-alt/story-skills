import { randomBytes } from "node:crypto";
import { StorageError } from "../contracts.js";

export const ENTITY_TYPES = [
  "character", "location", "system", "faction", "object", "arc", "chapter",
  "scene", "question", "promise", "clue", "term", "research", "matter"
];

export const ID_PREFIX = {
  project: "prj",
  character: "chr",
  location: "loc",
  system: "sys",
  faction: "fac",
  object: "obj",
  arc: "arc",
  chapter: "chp",
  scene: "scn",
  question: "que",
  promise: "prm",
  clue: "clu",
  term: "trm",
  research: "rsc",
  matter: "mtr",
  fact: "fact"
};

export const ENTITY_DIRECTORY = {
  character: "characters",
  location: "worldbuilding",
  system: "worldbuilding",
  faction: "worldbuilding",
  object: "worldbuilding",
  arc: "plot",
  question: "plot",
  promise: "plot",
  clue: "plot",
  term: "glossary",
  chapter: "chapters",
  scene: "scenes",
  research: "research",
  matter: "matter"
};

export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function slugify(name) {
  const stripped = String(name ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return stripped.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function uniqueFilename(slug, id, taken) {
  const base = slug || id;
  if (!taken.has(`${base}.md`)) return `${base}.md`;
  if (!taken.has(`${base}-${id}.md`)) return `${base}-${id}.md`;
  let suffix = 2;
  while (taken.has(`${base}-${id}-${suffix}.md`)) suffix += 1;
  return `${base}-${id}-${suffix}.md`;
}

export function allocateId(type, used, nextSuffix = () => randomBytes(4).toString("hex")) {
  const prefix = ID_PREFIX[type];
  if (!prefix) {
    throw new StorageError("UNKNOWN_ENTITY_TYPE", `Unsupported entity type: ${type}`);
  }
  const taken = used instanceof Set ? used : new Set(used);
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const id = `${prefix}_${nextSuffix()}`;
    if (!taken.has(id)) return id;
  }
  throw new StorageError("ID_EXHAUSTED", `Could not allocate a unique id for ${type}`);
}

export function duplicateIds(ids) {
  const seen = new Set();
  const duplicates = [];
  for (const id of ids) {
    if (seen.has(id)) {
      if (!duplicates.includes(id)) duplicates.push(id);
    } else {
      seen.add(id);
    }
  }
  return duplicates;
}
