# Structure: Roam Alias Finder Extension
Date: 2026-06-15
Decisions: [decisions.md](decisions.md)
Research: [research.md](research.md)

## Phase 1: Extension skeleton + bottom-of-page button
**Goal:** A Depot-structured extension that loads, injects a button at the bottom of each page, re-injects on navigation, and fully cleans up on unload. Button is a no-op (click stub) for now.
**Files touched:** `package.json`, `bin/build.mjs`, `build.sh`, `extension.js` (built output), `extension.css`, `src/alias-finder.js` (entry: onload/onunload), `src/teardown-registry.mjs`, `src/page-context.js` (current page title/UID + navigation observer), `vitest.config.mjs`, `LICENSE`, `README.md`, `CHANGELOG.md`
**Depends on:** nothing
**Verification:** `npm run build` produces `extension.js`; `npm test` passes; load in Roam → button appears at page bottom, survives navigation between pages, disappears cleanly on disable (no orphan DOM nodes, observers, or listeners).

## Phase 2: Matching engine (pure, unit-tested)
**Goal:** The net-new text logic as pure functions — parse `[text]([[Page]])` aliases from a block string, and given an alias text + a block string, find valid match positions honoring all guard rules: whole-word only, case-insensitive, exclude matches inside URLs, skip single-character aliases and footnote-style markers. No Roam APIs.
**Files touched:** `src/alias-parser.js`, `src/text-matcher.js`, `test/alias-parser.test.mjs`, `test/text-matcher.test.mjs`
**Depends on:** Phase 1 (test harness)
**Verification:** `npm test` — table-driven cases covering `OKRS` ≠ `weorks` (partial word), URL exclusion, case variants (`pagerduty` matches `PagerDuty`), single-char `*`, footnote markers `1`/`2`, and multiple matches within one block string.

## Phase 3: Graph data layer
**Goal:** Wire the engine to `roamAlphaAPI` — (a) find existing `[text]([[Page]])` alias references to the current page and collect distinct alias-text seeds; (b) scan the graph for blocks containing unlinked occurrences of those seeds, returning candidate results `{ blockUid, string, matchRange }`.
**Files touched:** `src/roam-data.js`, `test/roam-data.test.mjs` (with mocked `roamAlphaAPI`)
**Depends on:** Phase 1, Phase 2
**Verification:** Mocked-API unit tests for query construction and result shaping; manual check on a real page → console-log returns plausible alias seeds and unlinked candidate matches graph-wide.

## Phase 4: Results UI + link action
**Goal:** Render candidate matches in rows with a per-row "link" button; clicking calls `roamAlphaAPI.updateBlock` to wrap the matched text in `[text]([[Page]])`, preserving the original casing; the row updates/removes after linking. Wire the Phase 1 button to trigger the find → list flow.
**Files touched:** `src/results-panel.js`, `src/link-action.js`, `src/alias-finder.js` (wire button → flow), `extension.css`, `test/link-action.test.mjs`
**Depends on:** Phase 1, Phase 2, Phase 3
**Verification (success criteria D6):** End-to-end on a real page — the button finds genuine unlinked matches graph-wide, the guard rules hold on live data, and clicking "link" correctly wraps the text in Roam and persists the change.

## Out of Scope
- "Link all" / bulk or checkbox selection (D4 = per-row only).
- Normalizing/rewriting casing on link (D3 = preserve original).
- Page-title or `Aliases::`-attribute seeds (D1 = existing alias references only).
- Result caps/pagination, scope toggles, configurable settings panel.
- Actual Roam Depot submission (D5 = structured but not submitted).
- Undo of a created link.
