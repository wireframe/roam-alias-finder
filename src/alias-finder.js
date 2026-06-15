import { createTeardownRegistry } from "./teardown-registry.mjs";
import {
  observePageChanges,
  getPageBody,
  getReferencesAnchor,
  getCurrentPageTitle,
  isDailyNotePage,
} from "./page-context.js";
import { createFinderButton } from "./button.js";
import {
  collectAliasSeeds,
  findUnlinkedCandidates,
  findBlockCandidates,
} from "./roam-data.js";
import { renderResults, renderSearching } from "./results-panel.js";
import { linkMatch } from "./link-action.js";

const CONTAINER_CLASS = "alias-finder-container";
const RESULTS_CLASS = "alias-finder-results";

let teardown = null;
let session = null;

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
  session = null;
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
  // Let the browser paint the "Searching…" state before the synchronous
  // full-graph scan blocks the main thread.
  await nextPaint();
  const seeds = await collectAliasSeeds(title);
  const candidates = await findUnlinkedCandidates(seeds, title);
  session = { title, seeds, candidates, resultsEl, collapsed: new Set() };
  renderSession();
}

function renderSession() {
  const { resultsEl, candidates, seeds, collapsed } = session;
  renderResults(resultsEl, {
    candidates,
    onLink,
    seedCount: seeds.length,
    collapsed,
  });
}

// Linking only changes one block, so recompute just that block's candidates
// locally and re-render — no full-graph rescan.
async function onLink(candidate) {
  const nextString = await linkMatch({
    ...candidate,
    pageTitle: session.title,
  });
  session.candidates = refreshedCandidates(candidate.blockUid, nextString);
  renderSession();
}

function refreshedCandidates(blockUid, nextString) {
  const unaffected = session.candidates.filter((c) => c.blockUid !== blockUid);
  const fresh = findBlockCandidates(blockUid, nextString, session.seeds);
  return [...unaffected, ...fresh];
}

function nextPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export default { onload, onunload };
