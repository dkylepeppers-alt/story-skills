/**
 * Token-level diff over UTF-8 buffers, used to locate changes for evidence.
 * Tokens are runs of letters/digits, runs of whitespace, or single other
 * characters, carrying their byte offsets. Hunks are byte spans in both
 * versions. Beyond `maxEdits` token edits (or with `coarse`) the changed
 * middle is reported as one hunk.
 */

const TOKEN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;

function tokenize(buffer) {
  const tokens = [];
  let offset = 0;
  for (const match of buffer.toString("utf8").matchAll(TOKEN)) {
    const bytes = Buffer.byteLength(match[0], "utf8");
    tokens.push({ text: match[0], start: offset, end: offset + bytes });
    offset += bytes;
  }
  return tokens;
}

// Myers' O(ND) shortest edit script; returns [aIndex, bIndex] pairs of equal
// tokens, or null past the edit limit.
function commonPairs(a, b, maxEdits) {
  const n = a.length;
  const m = b.length;
  const offset = n + m;
  const v = new Int32Array(2 * offset + 2);
  const trace = [];
  for (let d = 0; d <= Math.min(n + m, maxEdits); d += 1) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x].text === b[y].text) {
        x += 1;
        y += 1;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, offset, n, m, d);
    }
  }
  return null;
}

function backtrack(trace, offset, n, m, depth) {
  const pairs = [];
  let x = n;
  let y = m;
  for (let d = depth; d > 0; d -= 1) {
    const v = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? k + 1 : k - 1;
    const prevX = v[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x -= 1;
      y -= 1;
      pairs.push([x, y]);
    }
    x = prevX;
    y = prevY;
  }
  // No d = 0 snake remains: diffHunks trims the common prefix, so the first
  // tokens of the two inputs always differ.
  return pairs.reverse();
}

function span(tokens, from, to, fallback) {
  if (from >= to) return { start: fallback, end: fallback };
  return { start: tokens[from].start, end: tokens[to - 1].end };
}

/**
 * @returns {{ before: { start: number, end: number }, after: { start: number, end: number } }[]}
 */
export function diffHunks(before, after, options = {}) {
  const a = tokenize(before);
  const b = tokenize(after);
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix].text === b[prefix].text) prefix += 1;
  let suffix = 0;
  while (suffix < a.length - prefix && suffix < b.length - prefix
    && a[a.length - 1 - suffix].text === b[b.length - 1 - suffix].text) suffix += 1;
  const midA = a.slice(prefix, a.length - suffix);
  const midB = b.slice(prefix, b.length - suffix);
  const startA = prefix < a.length ? a[prefix].start : before.length;
  const startB = prefix < b.length ? b[prefix].start : after.length;
  if (midA.length === 0 && midB.length === 0) return [];
  const pairs = options.coarse ? null : commonPairs(midA, midB, options.maxEdits ?? 2000);
  if (pairs === null) {
    return [{ before: span(midA, 0, midA.length, startA), after: span(midB, 0, midB.length, startB) }];
  }
  const hunks = [];
  let i = 0;
  let j = 0;
  for (const [x, y] of [...pairs, [midA.length, midB.length]]) {
    if (x > i || y > j) {
      const beforeAt = i < midA.length ? midA[i].start : (midA.length ? midA[midA.length - 1].end : startA);
      const afterAt = j < midB.length ? midB[j].start : (midB.length ? midB[midB.length - 1].end : startB);
      hunks.push({ before: span(midA, i, x, beforeAt), after: span(midB, j, y, afterAt) });
    }
    i = x + 1;
    j = y + 1;
  }
  return hunks;
}
