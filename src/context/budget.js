/**
 * The context byte budget (design §7). The budget is measured over the whole
 * serialized packet — JSON syntax, keys, reasons, sources and diagnostics
 * included — in UTF-8 bytes. It is a byte budget, not a token estimate.
 */

const OVER_BUDGET = "over the byte budget";

/** UTF-8 bytes of the packet as serialized with JSON.stringify. */
export function packetBytes(packet) {
  return Buffer.byteLength(JSON.stringify(packet), "utf8");
}

function itemBytes(item) {
  return Buffer.byteLength(JSON.stringify(item), "utf8");
}

function omission(candidate) {
  const { item } = candidate;
  return { id: item.id, kind: item.kind, reason: OVER_BUDGET, retrieval: candidate.retrieval, bytes: itemBytes(item) };
}

function compose(header, accepted, omitted, required, diagnostics) {
  return {
    ...header,
    bytes: 0,
    items: accepted.filter((candidate) => candidate.section === "items").map((candidate) => candidate.item),
    impact: accepted.filter((candidate) => candidate.section === "impact").map((candidate) => candidate.item),
    omissions: omitted.map(omission),
    required,
    diagnostics
  };
}

// The byte count is part of the packet it counts. Settle it: the digit count
// can only grow while the count itself grows, so this converges quickly.
function settle(packet) {
  let bytes = packetBytes(packet);
  while (packet.bytes !== bytes) {
    packet.bytes = bytes;
    bytes = packetBytes(packet);
  }
  return packet;
}

/**
 * Fits prioritized candidates into `maxBytes`. Required candidates are never
 * dropped: when they cannot fit, the packet carries no content, a
 * `CONTEXT_BUDGET_EXCEEDED` error and the required source list. Optional
 * candidates are taken greedily in priority order; each one that does not fit
 * is listed in `omissions` with its reason and retrieval id, and later,
 * smaller candidates may still fill the remaining budget.
 *
 * @param {object} header operation, audience, target, maxBytes.
 * @param {{ item: object, section: "items"|"impact", priority: number, required: boolean, retrieval: string }[]} candidates
 */
export function fitBudget(header, candidates, maxBytes, diagnostics) {
  const ordered = candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((left, right) => left.candidate.priority - right.candidate.priority || left.index - right.index)
    .map(({ candidate }) => candidate);
  const required = ordered.filter((candidate) => candidate.required);
  const optional = ordered.filter((candidate) => !candidate.required);

  // Sizes are exact arithmetic over the serialization: a JSON array of k
  // elements adds the elements' bytes plus k - 1 commas to an empty "[]".
  // The byte field is measured at the budget's width; a packet that fits
  // then settles to a count no wider than that.
  const base = packetBytes({ ...compose(header, [], [], [], diagnostics), bytes: maxBytes });
  const sizes = new Map(ordered.map((candidate) => [candidate, {
    item: itemBytes(candidate.item),
    omission: itemBytes(omission(candidate))
  }]));
  const totals = { items: [0, 0], impact: [0, 0], omissions: [0, 0] };
  const add = (key, bytes, sign) => {
    totals[key][0] += sign * bytes;
    totals[key][1] += sign;
  };
  const measure = () => Object.values(totals)
    .reduce((total, [bytes, count]) => total + bytes + Math.max(count - 1, 0), base);
  for (const candidate of required) add(candidate.section, sizes.get(candidate).item, 1);
  for (const candidate of optional) add("omissions", sizes.get(candidate).omission, 1);

  if (measure() > maxBytes) {
    const list = required.map(({ item }) => ({ id: item.id, kind: item.kind, reason: item.reason, sources: item.sources, bytes: itemBytes(item) }));
    const needed = list.reduce((total, item) => total + item.bytes, 0);
    const exceeded = {
      code: "CONTEXT_BUDGET_EXCEEDED",
      severity: "error",
      message: `Required context needs ${needed} bytes of items, which with packet overhead exceeds maxBytes ${maxBytes}`,
      recordIds: list.map((item) => item.id),
      sources: list.flatMap((item) => item.sources),
      evidence: "structural",
      action: "Raise maxBytes, shorten the required constraints or instructions, or narrow the target."
    };
    return settle(compose(header, [], optional, list, [...diagnostics, exceeded]));
  }

  const accepted = new Set(required);
  for (const candidate of optional) {
    const size = sizes.get(candidate);
    add("omissions", size.omission, -1);
    add(candidate.section, size.item, 1);
    if (measure() <= maxBytes) {
      accepted.add(candidate);
    } else {
      add(candidate.section, size.item, -1);
      add("omissions", size.omission, 1);
    }
  }
  return settle(compose(
    header,
    ordered.filter((candidate) => accepted.has(candidate)),
    optional.filter((candidate) => !accepted.has(candidate)),
    [],
    diagnostics
  ));
}
