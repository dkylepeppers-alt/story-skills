import fs from "node:fs";
import { createHash } from "node:crypto";
import { readSourceSpan } from "./spans.js";

/** SHA-256 hex digest over exact bytes. */
export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** SHA-256 hex digest over the UTF-8 encoding of a string span. */
export function hashUtf8(text) {
  return sha256Hex(Buffer.from(text, "utf8"));
}

/** SHA-256 hex digest of a file's current bytes on disk. */
export function hashFile(absPath) {
  return sha256Hex(fs.readFileSync(absPath));
}

/** SHA-256 hex of the exact source bytes a SourceRef selects. */
export function sourceHash(root, ref) {
  return sha256Hex(readSourceSpan(root, ref).bytes);
}
