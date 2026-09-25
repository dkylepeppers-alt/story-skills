// The frontmatter document layer now lives in src/storage/document.js, adapted
// to the full YAML document API while keeping this module's established
// surface for existing consumers. This re-export stays until the CLI wiring
// task retires it.
export {
  FRONTMATTER_PATTERN,
  parseFrontmatter,
  replaceFrontmatter,
  stringifyFrontmatter
} from "./storage/document.js";
