# Research: Roam Alias Finder Extension
Date: 2026-06-15
Decisions: [decisions.md](decisions.md)

Reference codebase (prior art): `/Users/ryansonnek/Projects/roam-meta-type` — a working
Roam Depot extension. The target project `/Users/ryansonnek/Projects/roam-alias-finder`
currently contains only `docs/`.

## Extension structure & packaging (depot template)
**Findings:**
- Entry point exports a default object `{ onload, onunload }`. `onload({ extensionAPI })` builds a teardown registry, loads config, registers a settings panel, installs handlers/observers, then renders for the current page. `onunload()` closes panels and runs all teardown. Reference: `extension.js:676`, `extension.js:721`, `extension.js:812`; source `src/meta-type.js:676`.
- Single bundled output: `extension.js` + `extension.css` at repo root. `extension.css` is auto-loaded by Roam alongside the JS.
- Bundler is **esbuild** via `bin/build.mjs` (target `es2020`, format `esm`, JSX factory `React.createElement`). Entry `src/meta-type.js` → output `extension.js`. Reference: `bin/build.mjs:66-73`.
- A custom esbuild plugin `roamGlobalsPlugin` externalizes `react` → `window.React` and `@blueprintjs/core` → `window.Blueprint.Core` (Depot mandate). A `knownExports` table must list every named import used; adding an unlisted import fails the build. Reference: `bin/build.mjs:14-63`.
- npm scripts: `build` (`node bin/build.mjs`), `test` (`vitest run`), `test:watch`. Reference: `package.json:6-10`. Depot CI entry is `build.sh` (`npm ci && npm run build`).
- Depot-relevant files present: `extension.js`, `extension.css`, `README.md` (with architecture section), `CHANGELOG.md`, `LICENSE` (MIT), `package.json` (metadata), `build.sh`, `screenshots/`. No separate `manifest.json` — Roam Depot reads `package.json` + README.
- Source modules in `src/`: `meta-type.js` (entry/lifecycle/observer), `settings-panel.js` (React settings UI), `panel.js` (sidebar panel DOM), `inline-editor.js` (native block editor embedding), `roam-data.js` (all graph queries), `config.js` (config state + defaults), `meta-type-helpers.mjs` (HTML gen + XSS escaping), `teardown-registry.mjs` (LIFO cleanup).
- Test framework **vitest** (`vitest.config.mjs`). React/Blueprint aliased to stubs in `test/stubs/`. Tests cover pure helpers only (config parsing, HTML gen, field-CSV parsing, teardown ordering, build-externals completeness); components verified manually in live Roam. Reference: `vitest.config.mjs:7-35`.

## UI injection & current-page detection
**Findings:**
- UI is injected with **imperative DOM manipulation**, not React or `{{roam/render}}`. Elements are created via `document.createElement` + `.innerHTML` and inserted into the page. Reference: `src/meta-type.js:177`, `src/panel.js:89-99`.
- Near-title injection: finds `.rm-title-display`, walks up to the title row's parent, and `insertBefore(container, titleRow)`. Reference: `src/roam-data.js:4`, `src/meta-type.js:159-177`. (No existing "bottom of page" injection — that anchor is not used in prior art.)
- Sidebar panels: anchor `#roam-right-sidebar-content`, `sidebar.prepend(panelEl)`, polled up to 2s for the node to exist. Reference: `src/panel.js:50-56`.
- Roam render helpers used: `roamAlphaAPI.ui.components.renderString()` for value cells (`src/meta-type-helpers.mjs:42`) and `roamAlphaAPI.ui.components.renderBlock()` for inline editing (`src/inline-editor.js:50-52`).
- Current page detection: `getCurrentPageTitle()` reads `.rm-title-display` `textContent` from the DOM (`src/roam-data.js:3-6`); `getPageUid(title)` resolves it via datalog (`src/roam-data.js:9-15`).
- Navigation handling: a debounced **MutationObserver** on `#app` re-checks the title on every mutation; if it changed, it cleans up old UI and re-renders. Generation counter (`renderGeneration`) guards against stale async renders. Reference: `src/meta-type.js:737-772`.
- Cleanup is centralized in a LIFO `teardown-registry` (`src/teardown-registry.mjs`). Specific teardowns: remove injected nodes via `.remove()` (`src/meta-type.js:152-156`), `observer.disconnect()` (`src/meta-type.js:753-757`), `removeEventListener` for delegated handlers (`src/meta-type.js:810-811`, `src/inline-editor.js:10-13`), clear CSS vars. Click handling uses one delegated `click` listener on `document.body` with `data-*` attributes carrying context (`src/meta-type.js:809`).

## Graph query mechanism
**Findings:**
- All queries use **`window.roamAlphaAPI.q(query, ...args)`** (datalog). No `.pull`, `.data.fast.q`, `.data.async.q`, or helper libraries. Reference: `src/roam-data.js:10`, `:36`, `:60`.
- Title → UID (verbatim): `[:find ?uid :in $ ?title :where [?e :node/title ?title] [?e :block/uid ?uid]]`. Reference: `src/roam-data.js:10-12`. UID → title is not implemented.
- Prefix match on a page's direct children (verbatim, used for `Type::`/`Field::`): uses `clojure.string/starts-with?` server-side:
  `[:find ?string :in $ ?pageUid ?prefix :where [?p :block/uid ?pageUid] [?p :block/children ?b] [?b :block/string ?string] [(clojure.string/starts-with? ?string ?prefix)]]`. Reference: `src/roam-data.js:29-34`; field variant returning `[?uid ?string]` at `src/roam-data.js:52-58`.
- **No backlinks / linked-references query exists.** Prior art never queries references TO a page (`:block/refs`). It parses refs FROM a block string with regex instead.
- **No graph-wide substring/text search exists.** All searches are scoped to one page's direct children and use prefix matching only — never an arbitrary substring scan across `:block/string`.
- Live updates use `roamAlphaAPI.data.addPullWatch(pattern, entityId, callback)` with pattern `[:block/uid :block/string {:block/children ...}]`. Reference: `src/panel.js:147`.
- All query/write helpers live in one module, `src/roam-data.js` (`getCurrentPageTitle`, `getPageUid`, `parsePageRefs`, `detectTypes`, `readFieldValue`, `readAllFields`, `createFieldBlock`).

## Block read/update mechanics
**Findings:**
- Reads: `roamAlphaAPI.q` for `:block/string`, then JS `substring()`/`trim()` to strip the prefix. Reference: `src/roam-data.js:41`, `:64`.
- **No block-string updates in prior art.** There is **no `roamAlphaAPI.updateBlock(...)` call anywhere.** Editing is delegated to Roam's native editor by mounting `roamAlphaAPI.ui.components.renderBlock({ uid, el })` and focusing it; Roam persists the user's keystrokes. Reference: `src/inline-editor.js:50-53`, `src/inline-editor.js:77-79`.
- Block creation: `roamAlphaAPI.createBlock({ location: { "parent-uid": pageUid, order: 0 }, block: { string: \`${fieldName}:: \` } })`. Single call site, no batching. Reference: `src/roam-data.js:75-82`.
- No string-transformation/wrapping logic on block content; the only string parsing is `parsePageRefs()` extracting existing `[[...]]` and `#tag` (read-only). Reference: `src/roam-data.js:18-25`.
- Read batching via `Promise.all` for parallel reads (`src/roam-data.js:68-73`); no write batching.

## Text matching / parsing logic
**Findings:**
- Only two markup regexes exist: `/#[\w-]+/g` (hashtags) and `/\[\[([^\]]+)\]\]/g` (page links). Reference: `src/roam-data.js:20`, `:22`. Plus six HTML-escaping char regexes in `src/meta-type-helpers.mjs:3-13`.
- **No whole-word / word-boundary (`\b`) logic.** None found.
- **No URL detection or exclusion logic.** None found.
- **No case-insensitive comparison/normalization** (`.toLowerCase()`, `i` flag, `localeCompare`). All comparisons are case-sensitive in prior art.
- **No parsing of aliases `[text]([[Page]])`, block refs `((...))`, or attributes `Name::`** beyond the two regexes above.
- Tests exercise config JSON parsing, field-CSV parsing, and HTML escaping; `parsePageRefs` is untested. Reference: `test/settings-panel.test.mjs:11-47`, `test/meta-type-helpers.test.mjs:12-23`, `test/config.test.mjs:63-142`.

## Patterns Observed
- **Lifecycle:** `onload`/`onunload` with a LIFO teardown registry; every observer/listener/DOM node registers its own cleanup. Generation counter guards stale async renders.
- **Navigation reactivity:** debounced MutationObserver on `#app`, comparing the DOM page title to detect page changes and re-render.
- **Data access:** thin module (`roam-data.js`) wrapping direct `roamAlphaAPI.q` datalog calls; page identified by title from DOM, resolved to UID by query.
- **UI:** imperative DOM + `innerHTML` HTML strings with custom XSS escaping; native Roam rendering via `renderString`/`renderBlock`; delegated click handling with `data-*` payloads.
- **Build:** esbuild ESM bundle, React/Blueprint externalized to Roam globals via a plugin with an explicit `knownExports` allowlist.
- **Testing:** vitest on pure helpers only; UI verified manually in Roam.

## Constraints Discovered
- **No write path to reuse.** Prior art never calls `updateBlock`; it delegates edits to Roam's editor. The alias finder's "link" action (programmatically wrapping matched text into `[text]([[Page]])` and saving) requires `roamAlphaAPI.updateBlock(...)`, which is **net-new** — no existing pattern to copy.
- **No graph-wide search to reuse.** Prior art only does prefix matching scoped to one page's children. Both required searches are net-new: (a) finding existing `[text]([[Page]])` alias references to the current page across the graph, and (b) finding unlinked plain-text occurrences of alias texts graph-wide. The clean datalog approach for (a) would likely traverse `:block/refs`/`:node/title` (no prior-art example); for (b), substring filtering could use `clojure.string/includes?` server-side or fetch-and-filter in JS — neither exists in prior art.
- **No text-matching primitives to reuse.** Whole-word matching, URL exclusion, case-insensitive matching, single-char/footnote filtering (all required by the decisions' guard rules) are entirely net-new; prior art has no word-boundary, URL, or case-insensitivity logic.
- **No "bottom of page" injection example.** Prior art injects near the title (`.rm-title-display`); a bottom-of-page anchor and its selector are net-new and must be determined against current Roam DOM.
- **Alias parsing is net-new.** Prior art parses `[[Page]]` and `#tag` only; parsing the alias form `[text]([[Page]])` (and distinguishing it from a plain external markdown link) has no prior-art regex.
- **Build allowlist friction.** Any new Blueprint/React named import must be added to `knownExports` in `bin/build.mjs` or the build fails — relevant if the results UI uses new Blueprint components.
- **Case-insensitive matching note.** Datalog `clojure.string/starts-with?`/`includes?` are case-sensitive; case-insensitive matching (per decision D3) will need JS-side `.toLowerCase()` comparison or a normalized query approach.
