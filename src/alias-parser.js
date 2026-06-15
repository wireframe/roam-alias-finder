const ALIAS_PATTERN = /\[([^\]]+)\]\(\[\[([^\]]+)\]\]\)/g;

export function parseAliasTextsForPage(blockString, pageTitle) {
  const matches = blockString.matchAll(ALIAS_PATTERN);
  return [...matches]
    .filter((match) => targetsPage(match, pageTitle))
    .map((match) => aliasText(match));
}

function targetsPage(match, pageTitle) {
  return match[2] === pageTitle;
}

function aliasText(match) {
  return match[1];
}
