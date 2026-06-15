import { createTeardownRegistry } from "./teardown-registry.mjs";
import {
  observePageChanges,
  getPageBody,
  getReferencesAnchor,
  getCurrentPageTitle,
  isDailyNotePage,
} from "./page-context.js";
import { createFinderButton } from "./button.js";
import { collectAliasSeeds, findUnlinkedCandidates } from "./roam-data.js";
import { renderResults, renderSearching } from "./results-panel.js";
import { linkMatch } from "./link-action.js";

const CONTAINER_CLASS = "alias-finder-container";
const RESULTS_CLASS = "alias-finder-results";

let teardown = null;

function onload({ extensionAPI }) {
  teardown = createTeardownRegistry();
  teardown.register(clearButton);
  teardown.register(observePageChanges(mountButton));
  mountButton();
  console.log("[alias-finder] initialized");
}

function onunload() {
  teardown.runAll();
  console.log("[alias-finder] destroyed");
}

function mountButton() {
  clearButton();
  const title = getCurrentPageTitle();
  if (!title || isDailyNotePage(title)) return;
  const anchor = getResultsAnchor();
  if (!anchor) return;
  anchor.appendChild(buildButtonContainer());
}

function getResultsAnchor() {
  return getReferencesAnchor() || getPageBody();
}

function buildButtonContainer() {
  const container = document.createElement("div");
  container.className = `${CONTAINER_CLASS} rm-ref-page-view`;
  const results = buildResultsContainer();
  container.appendChild(
    createFinderButton("Find unlinked aliases", (event) =>
      onFindClick(event.currentTarget, results),
    ),
  );
  container.appendChild(results);
  return container;
}

function buildResultsContainer() {
  const results = document.createElement("div");
  results.className = RESULTS_CLASS;
  return results;
}

function clearButton() {
  document
    .querySelectorAll(`.${CONTAINER_CLASS}`)
    .forEach((el) => el.remove());
}

async function onFindClick(button, resultsEl) {
  const title = getCurrentPageTitle();
  if (!title) return;
  button.disabled = true;
  await runFind(title, resultsEl);
  button.disabled = false;
}

async function runFind(title, resultsEl) {
  renderSearching(resultsEl);
  const seeds = await collectAliasSeeds(title);
  const candidates = await findUnlinkedCandidates(seeds, title);
  renderResults(
    resultsEl,
    candidates,
    (candidate) => onLink(candidate, title, resultsEl),
    seeds.length,
  );
}

async function onLink(candidate, title, resultsEl) {
  await linkMatch({ ...candidate, pageTitle: title });
  await runFind(title, resultsEl);
}

export default { onload, onunload };
