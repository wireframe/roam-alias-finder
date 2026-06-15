import { parseAliasTextsForPage } from "./alias-parser.js";
import { findMatches } from "./text-matcher.js";

const REFERRING_BLOCKS_QUERY =
  "[:find ?s :in $ ?title :where [?p :node/title ?title] [?b :block/refs ?p] [?b :block/string ?s]]";

const ALL_BLOCKS_QUERY =
  "[:find ?uid ?s :where [?b :block/uid ?uid] [?b :block/string ?s]]";

export async function collectAliasSeeds(pageTitle) {
  const blockStrings = await queryReferringBlockStrings(pageTitle);
  const aliasTexts = blockStrings.flatMap((string) =>
    parseAliasTextsForPage(string, pageTitle),
  );
  return distinctUsableSeeds(aliasTexts);
}

export async function findUnlinkedCandidates(seeds, pageTitle) {
  if (seeds.length === 0) return [];
  const blocks = await queryAllBlocks();
  return blocks
    .filter((block) => !isPageDefinition(block, pageTitle))
    .flatMap((block) => candidatesForBlock(block, seeds));
}

// Recompute candidates for a single block (e.g. after linking changes its
// string), avoiding a full-graph rescan. Other blocks' candidates stay valid.
export function findBlockCandidates(blockUid, string, seeds) {
  return candidatesForBlock([blockUid, string], seeds);
}

async function queryReferringBlockStrings(pageTitle) {
  const results = await window.roamAlphaAPI.q(REFERRING_BLOCKS_QUERY, pageTitle);
  return results.map(([string]) => string);
}

async function queryAllBlocks() {
  return window.roamAlphaAPI.q(ALL_BLOCKS_QUERY);
}

function distinctUsableSeeds(aliasTexts) {
  const seen = new Set();
  return aliasTexts.filter((text) => isFreshUsableSeed(text, seen));
}

function isFreshUsableSeed(text, seen) {
  const seed = text.trim();
  // Dedupe case-insensitively: matching is case-insensitive, so "She" and
  // "she" would otherwise yield duplicate groups with identical results.
  const key = seed.toLowerCase();
  if (isUnusableSeed(seed) || seen.has(key)) return false;
  seen.add(key);
  return true;
}

function isUnusableSeed(seed) {
  return seed.length <= 1 || /^\d+$/.test(seed);
}

function isPageDefinition([, string], pageTitle) {
  return string.trim() === pageTitle;
}

function candidatesForBlock([uid, string], seeds) {
  return seeds.flatMap((seed) =>
    findMatches(string, seed).map((range) => ({
      blockUid: uid,
      string,
      aliasText: seed,
      range,
    })),
  );
}
