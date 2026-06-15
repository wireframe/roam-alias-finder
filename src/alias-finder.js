import { createTeardownRegistry } from "./teardown-registry.mjs";
import {
  observePageChanges,
  getPageBody,
  getCurrentPageTitle,
  isDailyNotePage,
} from "./page-context.js";
import { createFinderButton } from "./button.js";
import { collectAliasSeeds, findUnlinkedCandidates } from "./roam-data.js";
import { renderResults } from "./results-panel.js";
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
  const pageBody = getPageBody();
  if (!pageBody) return;
  pageBody.appendChild(buildButtonContainer());
}

function buildButtonContainer() {
  const container = document.createElement("div");
  container.className = CONTAINER_CLASS;
  const results = buildResultsContainer();
  container.appendChild(
    createFinderButton("Find aliases", () => onFindClick(results)),
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

async function onFindClick(resultsEl) {
  const title = getCurrentPageTitle();
  if (!title) return;
  await runFind(title, resultsEl);
}

async function runFind(title, resultsEl) {
  const seeds = await collectAliasSeeds(title);
  const candidates = await findUnlinkedCandidates(seeds, title);
  renderResults(resultsEl, candidates, (candidate) =>
    onLink(candidate, title, resultsEl),
  );
}

async function onLink(candidate, title, resultsEl) {
  await linkMatch({ ...candidate, pageTitle: title });
  await runFind(title, resultsEl);
}

export default { onload, onunload };
