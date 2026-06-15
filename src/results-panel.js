export function renderResults(container, candidates, onLink) {
  container.replaceChildren();
  if (candidates.length === 0) {
    container.appendChild(noMatchesMessage());
    return;
  }
  candidates.forEach((candidate) => {
    container.appendChild(buildRow(candidate, onLink));
  });
}

function noMatchesMessage() {
  const message = document.createElement("div");
  message.className = "alias-finder-empty";
  message.textContent = "No unlinked matches found";
  return message;
}

function buildRow(candidate, onLink) {
  const row = document.createElement("div");
  row.className = "alias-finder-row";
  row.appendChild(aliasLabel(candidate.aliasText));
  row.appendChild(contextSnippet(candidate.string));
  row.appendChild(linkButton(candidate, onLink));
  return row;
}

function aliasLabel(aliasText) {
  const label = document.createElement("span");
  label.className = "alias-finder-alias";
  label.textContent = aliasText;
  return label;
}

function contextSnippet(string) {
  const snippet = document.createElement("span");
  snippet.className = "alias-finder-snippet";
  snippet.textContent = string;
  return snippet;
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
