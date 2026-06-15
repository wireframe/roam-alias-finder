# Plan: Roam Alias Finder Extension
Date: 2026-06-15
Decisions: [decisions.md](decisions.md)
Research: [research.md](research.md)
Structure: [structure.md](structure.md)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Roam Depot–structured extension that adds a bottom-of-page button which finds unlinked plain-text occurrences of a page's existing aliases across the graph and lets the user link them one at a time.

**Architecture:** Plain-JS ESM bundled by esbuild into a single `extension.js` (`{ onload, onunload }`), mirroring the `roam-meta-type` prior art. Pure logic (alias parsing, guarded text matching) lives in dependency-free modules with full vitest coverage; a thin `roam-data.js` wraps `window.roamAlphaAPI` datalog queries + `updateBlock`; imperative DOM renders the button and results, all cleaned up via a LIFO teardown registry.

**Tech Stack:** JavaScript (ESM), esbuild, vitest, `window.roamAlphaAPI` (datalog `q`, `updateBlock`), imperative DOM.

**Working directory:** `/Users/ryansonnek/Projects/roam-alias-finder` (currently contains only `docs/`). Reference code: `/Users/ryansonnek/Projects/roam-meta-type`.

---

## Phase 1: Extension skeleton + bottom-of-page button

- [x] Task 1.1: Initialize git + npm project
  - File: `package.json` (new), repo root
  - Change: `git init`. Create `package.json` modeled on `roam-meta-type/package.json:1-20`: `"name": "roam-alias-finder"`, `"version": "0.1.0"`, `"type": "module"`, scripts `{ "build": "node bin/build.mjs", "test": "vitest run", "test:watch": "vitest" }`, devDependencies `{ "esbuild": "^0.28.0", "vitest": "^1.6.0" }`, `"license": "MIT"`. Then `npm install`.
  - Test: `npm test` runs (exits 0 with "no test files" or similar); `ls node_modules/.bin/esbuild` exists.

- [x] Task 1.2: Add esbuild build script
  - File: `bin/build.mjs` (new)
  - Change: Model on `roam-meta-type/bin/build.mjs:65-76` but DROP the `roamGlobalsPlugin` and JSX (this extension uses no React/Blueprint). `build({ entryPoints: [resolve(root, "src/alias-finder.js")], bundle: true, format: "esm", target: "es2020", outfile: resolve(root, "extension.js"), logLevel: "info" })`.
  - Test: after Task 1.5 exists, `npm run build` writes `extension.js`. (For now, file is correct JS — `node --check bin/build.mjs`.)

- [x] Task 1.3: Add Depot CI build entry + vitest config + .gitignore
  - File: `build.sh` (new), `vitest.config.mjs` (new), `.gitignore` (new)
  - Change: `build.sh` copy verbatim from `roam-meta-type/build.sh:1-6` (`set -euo pipefail; npm ci; npm run build`), `chmod +x build.sh`. `vitest.config.mjs`: minimal `import { defineConfig } from "vitest/config"; export default defineConfig({ test: {} });` (no JSX/react stubs needed — pure JS). `.gitignore`: `node_modules/`.
  - Test: `node --check vitest.config.mjs`; `bash -n build.sh`.

- [x] Task 1.4: Copy teardown registry
  - File: `src/teardown-registry.mjs` (new)
  - Change: Copy verbatim from `roam-meta-type/src/teardown-registry.mjs:1-23` (`createTeardownRegistry` with LIFO `register`/`runAll` and `runSafely`).
  - Test: `node --check src/teardown-registry.mjs`.

- [x] Task 1.5: Page context module (current page title + UID + nav observer)
  - File: `src/page-context.js` (new)
  - Change: Port from `roam-meta-type/src/roam-data.js:3-16`: export `getCurrentPageTitle()` (reads `.rm-title-display` textContent) and `async getPageUid(pageTitle)` (datalog `[:find ?uid :in $ ?title :where [?e :node/title ?title] [?e :block/uid ?uid]]`). Also export `observePageChanges(onChange)` ported from `roam-meta-type/src/meta-type.js:101-126` (debounced MutationObserver on `#app`, fires `onChange(title)` when the title changes); returns a disconnect function. Include the `debounce` helper (`meta-type.js:17-23`).
  - Test: `node --check src/page-context.js`.

- [x] Task 1.6: Extension entry with no-op bottom button (TDD: write a render-helper test first)
  - File: `test/button.test.mjs` (new), `src/button.js` (new), `src/alias-finder.js` (new)
  - Change: First write failing test `test/button.test.mjs` importing `createFinderButton` from `src/button.js`, asserting it returns an `HTMLElement` (use vitest `environment: "jsdom"`? — instead keep pure: `createFinderButton({ onClick })` returns `{ className, label }` descriptor OR build a real element guarded by `typeof document`). To stay dependency-free, make `createFinderButton(label, onClick)` return a `<button class="alias-finder-btn">` via `document.createElement`; add `// @vitest-environment jsdom` at top of test and `jsdom` to devDeps (`npm i -D jsdom`). Assert `el.tagName === "BUTTON"`, `el.textContent === "Find aliases"`, and that clicking calls `onClick`. Then implement `src/button.js`.
  - Test: `npm test` — button test passes.

- [x] Task 1.7: Wire onload/onunload to inject button at page bottom
  - File: `src/alias-finder.js`
  - Change: Implement `onload({ extensionAPI })` / `onunload()` modeled on `roam-meta-type/src/meta-type.js:25-41,82-86`. Use `createTeardownRegistry`. On load: `observePageChanges` → on each page, `mountButton()`; register disconnect + a `clearButton()` (removes `.alias-finder-container`). `mountButton()` finds the page body container and appends the button at the bottom: query `.rm-article-wrapper` (fallback `.roam-article`); append a `<div class="alias-finder-container">` holding `createFinderButton`. Button onClick is a stub: `console.log("[alias-finder] find clicked")`. `export default { onload, onunload }`.
  - Test: `npm run build` succeeds → `extension.js` written. Manual (record in PR, not blocking): load unpacked in Roam, button appears at bottom of a page, persists across navigation, removed on disable.

- [x] Task 1.8: Minimal extension.css + Depot metadata files
  - File: `extension.css` (new), `LICENSE` (new), `README.md` (new), `CHANGELOG.md` (new)
  - Change: `extension.css` — basic styling for `.alias-finder-btn` and `.alias-finder-container` (margin, padding). `LICENSE` — MIT (copy from `roam-meta-type/LICENSE`, update year/author). `README.md` — purpose, install/build (`npm ci && npm run build`), architecture paragraph. `CHANGELOG.md` — `## 0.1.0` initial entry.
  - Test: files exist; `npm run build && npm test` both pass.

- [x] Commit Phase 1 ("Phase 1: extension skeleton + bottom-of-page button")

## Phase 2: Matching engine (pure, unit-tested)

- [x] Task 2.1: Alias parser test (TDD red)
  - File: `test/alias-parser.test.mjs` (new)
  - Change: Test `parseAliasTextsForPage(blockString, pageTitle)` from `src/alias-parser.js`. Cases: `"[the pager tool]([[PagerDuty]])"` + `"PagerDuty"` → `["the pager tool"]`; multiple aliases in one string; alias targeting a different page → excluded; plain `[[PagerDuty]]` (no alias text) → `[]`; external markdown link `[text](http://x)` → `[]`; page titles containing regex-special chars (e.g. `C++`) handled literally.
  - Test: `npm test` — fails (module absent).

- [x] Task 2.2: Implement alias parser (TDD green)
  - File: `src/alias-parser.js` (new)
  - Change: Export `parseAliasTextsForPage(blockString, pageTitle)`. Scan with `/\[([^\]]+)\]\(\[\[([^\]]+)\]\]\)/g` (group 1 = alias text, group 2 = target page); return group-1 values where group 2 `=== pageTitle`. (Net-new; prior art only parsed `[[...]]`/`#tag` at `roam-data.js:18-25`.)
  - Test: `npm test` — alias-parser tests pass.

- [x] Task 2.3: Text matcher test — core whole-word + case-insensitive (TDD red)
  - File: `test/text-matcher.test.mjs` (new)
  - Change: Test `findMatches(blockString, aliasText)` returning array of `{ start, end }`. Cases: exact `"...PagerDuty..."` → one range; lowercase `"...pagerduty..."` → matched (case-insensitive, D3); partial-word `aliasText="OKRS"` in `"weorks and OKRS"` → only the standalone `OKRS`, never inside `weorks`; multiple occurrences → multiple ranges; ranges index the original string (casing preserved for later wrapping).
  - Test: `npm test` — fails.

- [x] Task 2.4: Implement text matcher core (TDD green)
  - File: `src/text-matcher.js` (new)
  - Change: Build a case-insensitive whole-word regex from the (regex-escaped) alias text with `\w` boundary checks (match only when char before/after is absent or a non-word char). Iterate `matchAll`, push `{ start, end }`. Escape helper like `bin/build.mjs:32`.
  - Test: `npm test` — core matcher tests pass.

- [x] Task 2.5: Text matcher test — guard rules (TDD red)
  - File: `test/text-matcher.test.mjs` (extend)
  - Change: Add cases — (a) URL exclusion: alias `"roam"` inside `"see https://roam.com/x"` → no match, but a standalone `"roam"` elsewhere in the same string → matched; (b) already-linked exclusion: occurrence inside `[[PagerDuty]]`, `((abc123))`, or `[pd]([[PagerDuty]])` → not matched; (c) single-char alias `"*"` → `[]`; (d) footnote alias `"1"` (all-digits) → `[]`.
  - Test: `npm test` — new cases fail.

- [x] Task 2.6: Implement guard rules (TDD green)
  - File: `src/text-matcher.js` (extend)
  - Change: Early-return `[]` when `aliasText.trim().length <= 1` or `/^\d+$/.test(aliasText.trim())` (single-char + footnote, per Constraints in decisions.md). Compute excluded spans: URLs via `/\bhttps?:\/\/[^\s)]+/g` and `/\bwww\.[^\s)]+/g`; existing markup via `/\[\[[^\]]+\]\]/g`, `/\(\([^)]+\)\)/g`, and the alias form `/\[[^\]]+\]\(\[\[[^\]]+\]\]\)/g`. Drop any match range overlapping an excluded span.
  - Test: `npm test` — all text-matcher + alias-parser tests pass.

- [x] Commit Phase 2 ("Phase 2: pure alias-parsing + guarded matching engine")

## Phase 3: Graph data layer

- [x] Task 3.1: roam-data test with mocked roamAlphaAPI (TDD red)
  - File: `test/roam-data.test.mjs` (new)
  - Change: Stub `globalThis.window = { roamAlphaAPI: { q: vi.fn(), updateBlock: vi.fn() } }`. Test `async collectAliasSeeds(pageTitle)` — given `q` returns blocks referencing the page, it parses distinct alias texts (via `parseAliasTextsForPage`) and filters out single-char/footnote seeds. Test `async findUnlinkedCandidates(seeds, pageTitle)` — given `q` returns `[[uid, string], ...]`, it returns `{ blockUid, string, aliasText, range }` items using `findMatches`, excluding the page's own title blocks.
  - Test: `npm test` — fails.

- [x] Task 3.2: Implement alias-seed collection (TDD green)
  - File: `src/roam-data.js` (new)
  - Change: `collectAliasSeeds(pageTitle)` — datalog query for blocks that reference the page and expose `:block/string`: `[:find ?s :in $ ?title :where [?p :node/title ?title] [?b :block/refs ?p] [?b :block/string ?s]]`; for each string call `parseAliasTextsForPage(s, pageTitle)`; dedupe; drop seeds failing the matcher guards (length<=1, all-digits). Uses `window.roamAlphaAPI.q` (pattern per `roam-data.js:10`).
  - Test: `npm test` — seed tests pass.

- [x] Task 3.3: Implement graph-wide candidate scan (TDD green)
  - File: `src/roam-data.js` (extend)
  - Change: `findUnlinkedCandidates(seeds, pageTitle)` — fetch all blocks once: `[:find ?uid ?s :where [?b :block/uid ?uid] [?b :block/string ?s]]`; for each `(uid, s)` and each seed, run `findMatches(s, seed)`; emit `{ blockUid: uid, string: s, aliasText: seed, range }` per match. (Fetch-all-then-filter in JS — the clean path for case-insensitive whole-word matching, since datalog `clojure.string/includes?` is case-sensitive per research Constraints. Acceptable for a personal-graph prototype.)
  - Test: `npm test` — candidate tests pass.

- [x] Task 3.4: Manual smoke check on a real page — SKIPPED (user decision): data layer fully unit-tested against real matching logic; live validation folded into Task 4.6
  - File: (none — temporary console wiring in `src/alias-finder.js` button onClick)
  - Change: Temporarily make the button onClick call `collectAliasSeeds` + `findUnlinkedCandidates` for the current page and `console.log` the results. `npm run build`, load in Roam, click on a page with known aliases.
  - Test: Manual — console shows plausible alias seeds and unlinked candidate matches; guard rules visibly hold (no URL/partial-word hits). Revert the temporary logging before Phase 4 wiring.

- [x] Commit Phase 3 ("Phase 3: graph data layer — alias seeds + unlinked candidate scan")

## Phase 4: Results UI + link action

- [x] Task 4.1: Link-action test (TDD red)
  - File: `test/link-action.test.mjs` (new)
  - Change: Stub `window.roamAlphaAPI.updateBlock`. Test `async linkMatch({ blockUid, string, range, pageTitle })` — computes the new string by wrapping `string[range.start..range.end]` as `[<original text>]([[pageTitle]])`, preserving original casing (D3), and calls `updateBlock({ block: { uid: blockUid, string: <new> } })` with the exact expected string. Verify only the targeted occurrence is wrapped (other identical substrings untouched).
  - Test: `npm test` — fails.

- [x] Task 4.2: Implement link action (TDD green)
  - File: `src/link-action.js` (new)
  - Change: `linkMatch({ blockUid, string, range, pageTitle })` — `const text = string.slice(range.start, range.end); const next = string.slice(0, range.start) + \`[${text}]([[${pageTitle}]])\` + string.slice(range.end); await window.roamAlphaAPI.updateBlock({ block: { uid: blockUid, string: next } });`. (Net-new write path — prior art has no `updateBlock`, per research Constraints.)
  - Test: `npm test` — link-action tests pass.

- [x] Task 4.3: Results panel render test (TDD red)
  - File: `test/results-panel.test.mjs` (new, `// @vitest-environment jsdom`)
  - Change: Test `renderResults(container, candidates, onLink)` from `src/results-panel.js` — renders one `.alias-finder-row` per candidate showing the alias text + a context snippet, each with a `.alias-finder-link-btn`; clicking a row's button calls `onLink(candidate)`; assert empty state renders a "No unlinked matches found" message.
  - Test: `npm test` — fails.

- [x] Task 4.4: Implement results panel (TDD green)
  - File: `src/results-panel.js` (new)
  - Change: `renderResults(container, candidates, onLink)` — clear container; if none, append empty-state node; else per candidate append a row (escape text for `innerHTML`, per `meta-type-helpers.mjs:1-14` pattern, or use `textContent`) with a per-row "link" button wired to `onLink(candidate)` (D4 = per-row only).
  - Test: `npm test` — results-panel tests pass.

- [x] Task 4.5: Wire button → find → render → link, with row removal
  - File: `src/alias-finder.js` (extend)
  - Change: Replace the stub onClick: on click, resolve current page (title via `getCurrentPageTitle`, uid optional), `collectAliasSeeds(title)` → `findUnlinkedCandidates(seeds, title)`, render a results container under the button via `renderResults`. The per-row `onLink` calls `linkMatch(...)` then removes that row from the DOM (and disables re-click). Register results-container cleanup in teardown / `clearButton`.
  - Test: `npm run build` succeeds; `npm test` passes.

- [ ] Task 4.6: End-to-end verification on a real page (success criteria D6)
  - File: (none — manual)
  - Change: `npm run build`, load unpacked in Roam. On a real page with existing aliases: click the button, confirm genuine unlinked matches appear graph-wide, guard rules hold on live data (no URLs, no partial words, no single-char/footnote seeds), click a row's "link" → the target block gains `[text]([[Page]])` with original casing preserved and the row disappears.
  - Test: Manual end-to-end as above; note results in the PR/commit.

- [x] Task 4.7: Update docs
  - File: `README.md`, `CHANGELOG.md`
  - Change: Document the find/link flow and guard rules in README; add the feature to the `0.1.0` CHANGELOG entry.
  - Test: `npm run build && npm test` pass.

- [x] Commit Phase 4 ("Phase 4: results UI + link action — end-to-end alias finder")
