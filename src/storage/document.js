import { parseDocument, stringify as yamlStringify } from "yaml";
import { StorageError } from "../contracts.js";

export const FRONTMATTER_PATTERN = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;

// Same shape as FRONTMATTER_PATTERN, split into the opening delimiter line,
// the YAML source, and the closing delimiter (with its surrounding newlines).
const FRONTMATTER_PARTS_PATTERN = /^((?:\uFEFF)?---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n)?)/;

/**
 * Parses a markdown document with YAML frontmatter. Values are parsed with
 * the full YAML document API (nested mappings and sequences, block scalars,
 * quoted strings), so record frontmatter is not limited to flat key/value
 * lines. Duplicate mapping keys and invalid YAML are rejected. The returned
 * `body` is the exact text after the closing delimiter.
 */
export function parseFrontmatter(markdown, filePath = "markdown") {
  const match = FRONTMATTER_PATTERN.exec(markdown);
  if (!match) {
    throw new StorageError("MISSING_FRONTMATTER", `${filePath} is missing YAML frontmatter`);
  }

  return {
    data: parseFrontmatterData(match[1], filePath),
    body: markdown.slice(match[0].length),
    raw: match[1]
  };
}

/**
 * Builds a frontmatter block (with delimiters and the conventional trailing
 * blank line) for a new record file.
 */
export function stringifyFrontmatter(data) {
  return `---\n${yamlStringify(data, { lineWidth: 0 })}---\n\n`;
}

/**
 * Rewrites only the frontmatter entries whose parsed values changed. Unchanged
 * entries, comment lines, blank lines, and collection items that are still
 * present keep their original source bytes, so a rewrite does not reformat
 * numbers, drop comments, or disturb nested layout. The body after the closing
 * delimiter is preserved byte for byte unless bodyOverride replaces it, and
 * the file's original LF/CRLF convention is kept for the frontmatter.
 *
 * Semantics: keys omitted from `data` are removed; a value of `undefined` also
 * removes its key; `null` serializes as `null`. Invalid YAML, duplicate
 * mapping keys, and non-mapping frontmatter are rejected before any edit.
 *
 * Layout model: frontmatter is scanned as line blocks — top-level `key:` lines
 * (plus their more-indented continuation lines) and free-floating comment or
 * blank lines. Comments and blanks stay anchored where they sit, so editing
 * one key cannot move a comment belonging to another. Exotic YAML whose layout
 * this scanner cannot anchor (for example top-level flow collections) parses
 * fine but refuses in-place editing with INVALID_FRONTMATTER.
 */
export function replaceFrontmatter(markdown, data, bodyOverride) {
  const match = FRONTMATTER_PARTS_PATTERN.exec(markdown);
  if (!match) {
    throw new StorageError("MISSING_FRONTMATTER", "Cannot replace missing YAML frontmatter");
  }

  const [whole, opening, raw, closing] = match;
  const eol = opening.endsWith("\r\n") ? "\r\n" : "\n";
  const current = parseFrontmatterData(raw, "markdown");
  const blocks = scanBlocks(raw);
  const lines = [];
  const written = new Set();

  for (const block of blocks) {
    if (block.key === undefined) {
      lines.push(block.line);
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(data, block.key) || data[block.key] === undefined) {
      continue;
    }
    written.add(block.key);
    const value = data[block.key];
    if (isDeepEqual(current[block.key], value)) {
      lines.push(...block.lines);
    } else {
      lines.push(...serializeEntry(block.key, value, block));
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (!written.has(key) && value !== undefined) {
      lines.push(...serializeEntry(key, value));
    }
  }

  const body = lines.length > 0 ? lines.join(eol) : "";
  const rest = bodyOverride === undefined ? markdown.slice(whole.length) : String(bodyOverride);
  return `${opening}${body}${closing}${rest}`;
}

function parseFrontmatterData(raw, filePath) {
  // The delimiter regex retains the final YAML newline in the closing
  // delimiter. Restore it for block-scalar chomping semantics.
  const document = parseDocument(`${raw}\n`);
  if (document.errors.length > 0) {
    const error = document.errors[0];
    const code = /must be unique/.test(error.message) ? "DUPLICATE_KEY" : "INVALID_YAML";
    throw new StorageError(code, describeYamlError(error, raw), { filePath });
  }
  const data = document.toJS();
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new StorageError(
      "INVALID_FRONTMATTER",
      `${filePath} frontmatter must be a YAML mapping of keys to values`
    );
  }
  return data;
}

// Error messages intentionally omit the file path: callers add it, matching
// the surface the old frontmatter layer established.
function describeYamlError(error, raw) {
  if (/must be unique/.test(error.message)) {
    const line = error.linePos ? raw.split(/\r?\n/)[error.linePos[0].line - 1] ?? "" : "";
    const key = /^([A-Za-z0-9_-]+):/.exec(line.trim())?.[1];
    return key ? `Duplicate frontmatter key: ${key}` : "Duplicate mapping key in frontmatter";
  }
  const where = error.linePos ? ` (line ${error.linePos[0].line}, column ${error.linePos[0].col})` : "";
  return `${error.message}${where}`;
}

// Groups frontmatter source lines into entries (a top-level key plus its
// indented continuation lines) and free blocks (comments and blank lines) so
// unchanged regions can be re-emitted verbatim.
function scanBlocks(raw) {
  const lines = raw === "" ? [] : raw.split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (isFree(line)) {
      blocks.push({ line });
      index += 1;
      continue;
    }

    const pair = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (!pair) {
      throw new StorageError(
        "INVALID_FRONTMATTER",
        `Cannot edit frontmatter with unsupported line layout: ${line}`
      );
    }

    const [, key] = pair;
    const blockLines = [line];
    index += 1;
    // YAML also permits folded scalars, indentation indicators, anchors,
    // inline comments and multiline quoted/flow values. Their indented lines
    // belong to the current entry regardless of the first line's value.
    index = absorbIndented(lines, index, blockLines);
    blocks.push({ key, lines: blockLines, items: splitSequenceItems(blockLines) });
  }

  return blocks;
}

// Absorbs the indented continuation lines of a block collection (or block
// scalar) into `out`. Blank lines stay inside the block when more indented
// content follows; otherwise they are left for the next free block.
function absorbIndented(lines, start, out) {
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (/^[ \t]/.test(line)) {
      out.push(line);
      index += 1;
      continue;
    }
    if (line.trim() === "") {
      let lookahead = index;
      while (lookahead < lines.length && lines[lookahead].trim() === "") {
        lookahead += 1;
      }
      if (lookahead < lines.length && /^[ \t]/.test(lines[lookahead])) {
        out.push(...lines.slice(index, lookahead));
        index = lookahead;
        continue;
      }
    }
    break;
  }
  return index;
}

function isFree(line) {
  return line.trim() === "" || line.trimStart().startsWith("#");
}

function serializeEntry(key, value, block) {
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${key}: []`];
    }
    if (block?.items?.length) {
      return spliceSequence(key, value, block.items);
    }
  }
  // Serialize the complete mapping so YAML owns scalar indentation and
  // chomping. Remove only the document terminator, not meaningful blank lines.
  return yamlStringify({ [key]: value }, { lineWidth: 0 }).replace(/\n$/, "").split("\n");
}

// Re-emits a changed sequence by keeping the source lines of items whose
// parsed values are unchanged (so formatting like `weight: 2.50` or `- []`
// survives), replacing items that changed, and appending new items.
function spliceSequence(key, value, originalItems) {
  const lines = [`${key}:`];
  const unused = originalItems.filter((item) => item.value !== undefined);
  for (const item of value) {
    const reuse = unused.findIndex((candidate) => isDeepEqual(candidate.value, item));
    if (reuse !== -1) {
      lines.push(...unused[reuse].source);
      unused.splice(reuse, 1);
    } else {
      lines.push(...serializeItem(item));
    }
  }
  return lines;
}

function serializeItem(item) {
  const rendered = yamlStringify(item, { lineWidth: 0 }).replace(/\n$/, "");
  return rendered.split("\n").map((line, index) => (index === 0 ? `  - ${line}` : `    ${line}`));
}

// Splits an entry's source lines into sequence items with their parsed values
// (`lines`, dedented, for parsing) and original source lines (`source`), so an
// edited list can reuse the original bytes of unchanged items. Returns [] for
// anything that is not a plain two-space block sequence.
function splitSequenceItems(blockLines) {
  const items = [];
  for (const line of blockLines.slice(1)) {
    if (/^ {2}-(?: .*)?$/.test(line)) {
      items.push({ lines: [line.replace(/^ {2}- ?/, "")], source: [line], value: undefined });
    } else if (items.length > 0 && /^ {4}/.test(line)) {
      items[items.length - 1].lines.push(line.slice(4));
      items[items.length - 1].source.push(line);
    } else {
      return [];
    }
  }
  for (const item of items) {
    const parsed = parseDocument(`${item.lines.join("\n")}\n`);
    item.value = parsed.errors.length === 0 ? parsed.toJS() : undefined;
  }
  return items;
}

function isDeepEqual(left, right) {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((entry, index) => isDeepEqual(entry, right[index]));
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index] && isDeepEqual(left[key], right[key]));
  }
  return false;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
