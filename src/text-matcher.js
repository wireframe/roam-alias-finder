const EXCLUDED_SPAN_PATTERNS = [
  /\bhttps?:\/\/[^\s)]+/g, // URL with scheme (https?://...)
  /\bwww\.[^\s)]+/g, // bare www. URL (no scheme)
  /\[\[[^\]]+\]\]/g, // page link [[...]]
  /\(\([^)]+\)\)/g, // block ref ((...)) — intentionally any ((...)), lenient to err toward safe over-exclusion since the tool writes to the user's graph
  /\[[^\]]+\]\([^)]+\)/g, // any markdown link [label](target) — Roam aliases and external links alike; never match inside the label or wrapping would corrupt the link
  /#\[\[[^\]]+\]\]/g, // tag form #[[Multi Word]]
  /#[\w-]+/g, // bare tag #Word
];

export function findMatches(blockString, aliasText) {
  return matchSeed(blockString, aliasText.trim(), findExcludedSpans(blockString));
}

// Match one already-trimmed seed against a block, given its excluded spans.
// Callers scanning many seeds over one block compute the spans once and reuse.
export function matchSeed(blockString, seed, excludedSpans) {
  if (isUnmatchableSeed(seed)) return [];
  return rawMatches(blockString, seed).filter(
    (match) => !overlapsAnySpan(match, excludedSpans),
  );
}

export function isUnmatchableSeed(seed) {
  return seed.length <= 1 || /^\d+$/.test(seed);
}

function rawMatches(blockString, seed) {
  const pattern = wholeWordPattern(seed);
  return [...blockString.matchAll(pattern)].map(toRange);
}

function wholeWordPattern(seed) {
  return new RegExp(`(?<!\\w)${escapeRegex(seed)}(?!\\w)`, "gi");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRange(match) {
  return { start: match.index, end: match.index + match[0].length };
}

export function findExcludedSpans(blockString) {
  return EXCLUDED_SPAN_PATTERNS.flatMap((pattern) =>
    [...blockString.matchAll(pattern)].map(toRange),
  );
}

function overlapsAnySpan(match, spans) {
  return spans.some((span) => overlaps(match, span));
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}
