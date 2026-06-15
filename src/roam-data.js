import { parseAliasTextsForPage } from "./alias-parser.js";
import {
  matchSeed,
  findExcludedSpans,
  isUnmatchableSeed,
} from "./text-matcher.js";

const REFERRING_BLOCKS_QUERY =
  "[:find ?s :in $ ?title :where [?p :node/title ?title] [?b :block/refs ?p] [?b :block/string ?s]]";

const ALL_BLOCKS_QUERY =
  "[:find ?uid ?s :where [?b :block/uid ?uid] [?b :block/string ?s]]";

const PAGE_TITLE_QUERY =
  "[:find ?uid :in $ ?title :where [?e :node/title ?title] [?e :block/uid ?uid]]";

// True only when a real page has this exact title. Lets the button distinguish
// a page view from a zoomed-in block (whose title text isn't a page title).
export function isExistingPage(title) {
  return window.roamAlphaAPI.q(PAGE_TITLE_QUERY, title).length > 0;
}

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
  if (isUnmatchableSeed(seed) || seen.has(key)) return false;
  seen.add(key);
  return true;
}

function isPageDefinition([, string], pageTitle) {
  return string.trim() === pageTitle;
}

function candidatesForBlock([uid, string], seeds) {
  const excludedSpans = findExcludedSpans(string);
  return seeds.flatMap((seed) =>
    matchSeed(string, seed, excludedSpans).map((range) => ({
      blockUid: uid,
      string,
      aliasText: seed,
      range,
    })),
  );
}
