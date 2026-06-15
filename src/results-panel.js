export function renderSearching(container) {
  container.replaceChildren();
  container.appendChild(statusMessage());
}

export function renderResults(
  container,
  { candidates, onLink, seedCount, collapsed = new Set() },
) {
  container.replaceChildren();
  if (candidates.length === 0) {
    container.appendChild(emptyMessage(seedCount));
    return;
  }
  sortedGroups(candidates).forEach(([aliasText, group]) => {
    container.appendChild(buildSection(aliasText, group, onLink, collapsed));
  });
}

function statusMessage() {
  const status = document.createElement("div");
  status.className = "alias-finder-status";
  status.textContent = "Searching…";
  return status;
}

function emptyMessage(seedCount) {
  const message = document.createElement("div");
  message.className = "alias-finder-empty";
  message.textContent = `No unlinked matches found${seedSuffix(seedCount)}`;
  return message;
}

function seedSuffix(seedCount) {
  if (!seedCount) return "";
  const noun = seedCount === 1 ? "alias" : "aliases";
  return ` (${seedCount} ${noun} checked)`;
}

function sortedGroups(candidates) {
  const groups = new Map();
  candidates.forEach((candidate) => {
    const group = groups.get(candidate.aliasText) || [];
    group.push(candidate);
    groups.set(candidate.aliasText, group);
  });
  return [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function buildSection(aliasText, group, onLink, collapsed) {
  const section = document.createElement("div");
  section.className = "alias-finder-section";
  if (collapsed.has(aliasText)) section.classList.add("collapsed");
  section.appendChild(sectionHeader(aliasText, group.length, section, collapsed));
  section.appendChild(sectionBody(group, onLink));
  return section;
}

function sectionHeader(aliasText, count, section, collapsed) {
  const header = document.createElement("div");
  header.className = "alias-finder-section-header";
  header.appendChild(caretIcon());
  header.appendChild(sectionTitle(aliasText));
  header.appendChild(countBadge(count));
  header.addEventListener("click", () =>
    toggleCollapse(section, aliasText, collapsed),
  );
  return header;
}

// Toggle the DOM class and mirror it into the shared collapsed set, so the
// state survives a full re-render (e.g. after linking a match).
function toggleCollapse(section, aliasText, collapsed) {
  if (section.classList.toggle("collapsed")) collapsed.add(aliasText);
  else collapsed.delete(aliasText);
}

function caretIcon() {
  const caret = document.createElement("span");
  caret.className = "alias-finder-caret";
  return caret;
}

function sectionTitle(aliasText) {
  const title = document.createElement("strong");
  title.className = "alias-finder-section-title";
  title.textContent = aliasText;
  return title;
}

function countBadge(count) {
  const badge = document.createElement("span");
  badge.className = "alias-finder-count";
  badge.textContent = String(count);
  return badge;
}

function sectionBody(group, onLink) {
  const body = document.createElement("div");
  body.className = "alias-finder-section-body";
  group.forEach((candidate) => body.appendChild(buildRow(candidate, onLink)));
  return body;
}

function buildRow(candidate, onLink) {
  const row = document.createElement("div");
  row.className = "alias-finder-row";
  row.appendChild(contextSnippet(candidate));
  row.appendChild(linkButton(candidate, onLink));
  return row;
}

function contextSnippet(candidate) {
  const snippet = document.createElement("span");
  snippet.className = "alias-finder-snippet";
  const { string, range } = candidate;
  snippet.appendChild(textNode(string.slice(0, range.start)));
  snippet.appendChild(highlight(string.slice(range.start, range.end)));
  snippet.appendChild(textNode(string.slice(range.end)));
  return snippet;
}

function textNode(text) {
  return document.createTextNode(text);
}

function highlight(text) {
  const mark = document.createElement("span");
  mark.className = "unlink-word";
  mark.textContent = text;
  return mark;
}

function linkButton(candidate, onLink) {
  const button = document.createElement("button");
  button.className = "alias-finder-link-btn";
  button.textContent = "Link";
  button.addEventListener("click", () => {
    button.disabled = true;
    onLink(candidate);
  });
  return button;
}
