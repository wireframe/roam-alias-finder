# Roam Alias Finder

Find the places you *meant* to link but never did. Alias Finder scans your graph for plain‑text mentions of a page's existing aliases and lets you turn each one into a proper link with a single click. No alias list to maintain, no setup.

![Alias Finder demo](https://raw.githubusercontent.com/wireframe/roam-alias-finder/main/screenshots/demo.gif)

## Why

Roam aliases let you write `[slip-box]([[Zettelkasten]])` so natural prose still links to the right page. But once you've used an alias a few times, older notes are full of the same words sitting as plain text, invisible to backlinks. Finding and fixing them by hand is tedious.

Alias Finder learns the aliases you already use for a page and surfaces every unlinked mention across the graph, so you can wire them up in seconds.

## What it does

A **Find unlinked aliases** button appears at the bottom of every real page, right below Roam's Unlinked References section. It only shows on real pages — never on daily notes.

![Find unlinked aliases button below Unlinked References](https://raw.githubusercontent.com/wireframe/roam-alias-finder/main/screenshots/find-button.png)

Click it and Alias Finder:

1. Reads the page's **existing aliases** — every `[text]([[ThisPage]])` already in your graph — and uses that text as the search terms. Nothing to configure.
2. Scans the whole graph for **unlinked, plain‑text occurrences** of those terms.
3. Groups the results **by alias** under collapsible, alphabetically‑sorted headers with a match count, and highlights the matched text in each block.
4. Lets you **link any match** with one click — it wraps the text as `[text]([[ThisPage]])`, preserving your original casing, and removes the row.

![Grouped results with per-row link buttons](https://raw.githubusercontent.com/wireframe/roam-alias-finder/main/screenshots/results.png)

### Match rules

Matching is deliberately careful, because it writes to your graph:

- **Whole words only** — `OKRS` never matches inside `weorks`.
- **Case‑insensitive** — `Zettel` and `zettel` both match the alias `zettel`; your original casing is kept when linking.
- **Skips text that's already linked** — occurrences inside `[[page links]]`, `((block refs))`, `#tags`, and existing `[alias]([[page]])` links are ignored.
- **Skips URLs** — matches inside `http(s)://…` and `www.…` are ignored.
- **Skips noise** — single‑character aliases (`*`) and footnote‑style numbers (`1`, `2`, …) are never used as search terms.

## Install

### From Roam Depot

In Roam: **Settings → Roam Depot → Browse → Alias Finder → Install**. (Available once the Depot listing is published.)

### As a local developer extension

1. Clone and build:
   ```bash
   git clone https://github.com/wireframe/roam-alias-finder.git
   cd roam-alias-finder
   npm install
   npm run build
   ```
2. In Roam: **Settings → Roam Depot → Installed Extensions** → gear icon → enable **Developer mode**.
3. In the **Developer Extensions** section, click the folder icon and choose this repo's folder. Roam loads `extension.js` and the sibling `extension.css` automatically.
4. Open any real page that you've aliased before — the **Find unlinked aliases** button appears below its references.

Reload after editing source: rebuild (`npm run build`), then press **`control-d control-r`** in Roam.

## Known limitations

- The scan fetches every block in the graph and matches in the browser, and re‑runs the affected block after each link. This is fast on a personal graph but is not optimized for very large graphs; the first scan briefly shows a "Searching…" state.
- This is an early prototype. It is structured as a Roam Depot extension but has not yet been submitted.

## Development

```bash
npm install     # esbuild, vitest, jsdom
npm test        # run unit tests (vitest)
npm run build   # bundle src/ into extension.js
```

The build uses [esbuild](https://esbuild.github.io/) (`bin/build.mjs`) to bundle `src/` into a single ESM `extension.js` exporting `{ onload, onunload }` — the Roam Depot plugin contract. The extension uses plain DOM (no React/Blueprint), so the bundle has no external globals.

## Architecture (one‑paragraph version)

`onload` injects the button below the page's references (`src/page-context.js` owns all Roam DOM lookups) and re‑injects it on navigation via a debounced `MutationObserver`; every side effect is registered with a LIFO teardown registry so `onunload` reverses it. Clicking the button collects the page's alias texts from blocks that reference it (`src/roam-data.js`), scans all blocks with a pure, dependency‑free matcher that enforces the whole‑word / case‑insensitive / exclusion rules (`src/text-matcher.js`), and renders grouped, collapsible results (`src/results-panel.js`). Linking wraps the matched range as `[text]([[Page]])` via `roamAlphaAPI.updateBlock` (`src/link-action.js`) and recomputes only the edited block so relinking is instant.

## License

[MIT](LICENSE).
