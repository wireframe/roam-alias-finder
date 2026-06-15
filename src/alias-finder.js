import { createTeardownRegistry } from "./teardown-registry.mjs";
import { observePageChanges, getPageBody } from "./page-context.js";
import { createFinderButton } from "./button.js";

const CONTAINER_CLASS = "alias-finder-container";

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
  const pageBody = getPageBody();
  if (!pageBody) return;
  pageBody.appendChild(buildButtonContainer());
}

function buildButtonContainer() {
  const container = document.createElement("div");
  container.className = CONTAINER_CLASS;
  container.appendChild(createFinderButton("Find aliases", onFindClick));
  return container;
}

function clearButton() {
  document
    .querySelectorAll(`.${CONTAINER_CLASS}`)
    .forEach((el) => el.remove());
}

// no-op placeholder; real find behavior added later
function onFindClick() {
  console.log("[alias-finder] find clicked");
}

export default { onload, onunload };
