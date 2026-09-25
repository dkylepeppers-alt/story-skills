#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function parseLcov(source) {
  const records = new Map();
  let current = null;

  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith("SF:")) {
      current = {
        file: path.resolve(line.slice(3)),
        lines: { found: 0, hit: 0 },
        functions: { found: 0, hit: 0 },
        branches: { found: 0, hit: 0 },
        hasBranchData: false
      };
      records.set(current.file, current);
    } else if (!current) {
      continue;
    } else if (line.startsWith("LF:")) {
      current.lines.found = Number(line.slice(3));
    } else if (line.startsWith("LH:")) {
      current.lines.hit = Number(line.slice(3));
    } else if (line.startsWith("FNF:")) {
      current.functions.found = Number(line.slice(4));
    } else if (line.startsWith("FNH:")) {
      current.functions.hit = Number(line.slice(4));
    } else if (line.startsWith("BRDA:")) {
      // BRDA:<line>,<block>,<branch>,<taken> where <taken> is "-" when the
      // branch was never taken. Count branches directly so reports that omit
      // the BRF:/BRH: summaries are still gated.
      current.hasBranchData = true;
      current.branches.found += 1;
      const taken = line.slice(5).split(",")[3];
      if (taken !== undefined && taken !== "-" && Number(taken) > 0) {
        current.branches.hit += 1;
      }
    } else if (line.startsWith("BRF:")) {
      // Summary lines are authoritative when present and come after the BRDA
      // lines, so they overwrite the derived counts above.
      current.hasBranchData = true;
      current.branches.found = Number(line.slice(4));
    } else if (line.startsWith("BRH:")) {
      current.branches.hit = Number(line.slice(4));
    }
  }

  return records;
}

export function checkCoverage(lcovText, absoluteSourceFiles) {
  const records = parseLcov(lcovText);
  const failures = [];
  let filesWithBranches = 0;

  for (const filePath of absoluteSourceFiles) {
    const record = records.get(filePath);
    if (!record) {
      failures.push(`${filePath} has no coverage record`);
      continue;
    }

    if (record.lines.found !== record.lines.hit) {
      failures.push(`${filePath} line coverage ${record.lines.hit}/${record.lines.found}`);
    }

    if (record.functions.found !== record.functions.hit) {
      failures.push(`${filePath} function coverage ${record.functions.hit}/${record.functions.found}`);
    }

    if (record.hasBranchData) {
      filesWithBranches += 1;
      if (record.branches.found !== record.branches.hit) {
        failures.push(`${filePath} branch coverage ${record.branches.hit}/${record.branches.found}`);
      }
    }
  }

  return { failures, filesWithBranches, filesChecked: absoluteSourceFiles.length };
}

export function listSourceFiles(sourceDir) {
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path.resolve(full));
    }
  };
  walk(sourceDir);
  return files.sort();
}

export function directoryCoverage(records, sourceDir, files) {
  const groups = new Map();
  for (const filePath of files) {
    const relative = path.relative(sourceDir, path.resolve(filePath));
    const dir = path.dirname(relative);
    const key = dir === "." ? "." : dir.split(path.sep).join("/");
    if (!groups.has(key)) {
      groups.set(key, { lines: { hit: 0, found: 0 }, functions: { hit: 0, found: 0 } });
    }
    const group = groups.get(key);
    const record = records.get(path.resolve(filePath));
    if (!record) continue;
    group.lines.hit += record.lines.hit;
    group.lines.found += record.lines.found;
    group.functions.hit += record.functions.hit;
    group.functions.found += record.functions.found;
  }
  return [...groups.entries()].sort((left, right) => left[0].localeCompare(right[0]));
}

function main(argv) {
  const [lcovPath, sourceDir] = argv;
  if (!lcovPath || !sourceDir) {
    console.error("Usage: check-coverage <lcov.info> <source-dir>");
    process.exit(1);
  }

  const lcov = fs.readFileSync(lcovPath, "utf8");
  const requiredFiles = listSourceFiles(sourceDir);
  const records = parseLcov(lcov);
  for (const [dir, totals] of directoryCoverage(records, sourceDir, requiredFiles)) {
    console.log(`${dir} lines ${totals.lines.hit}/${totals.lines.found} functions ${totals.functions.hit}/${totals.functions.found}`);
  }
  const { failures, filesWithBranches } = checkCoverage(lcov, requiredFiles);

  if (failures.length > 0) {
    console.error(`Coverage is below 100%:\n${failures.join("\n")}`);
    process.exit(1);
  }

  if (filesWithBranches === 0) {
    console.error(
      `Note: ${lcovPath} contains no branch records, so the branch gate was skipped. ` +
      "Use a coverage reporter that emits BRDA/BRF/BRH records to enforce branch coverage."
    );
  }

  if (filesWithBranches > 0) {
    console.log("Coverage is 100% for src line, function, branch coverage.");
  } else {
    console.log("Coverage is 100% for src line and function coverage.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
