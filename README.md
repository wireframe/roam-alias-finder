# roam-alias-finder

A Roam Research extension that helps you find unlinked occurrences of a page's
existing aliases and link them. When a page declares aliases, those aliases are
often mentioned elsewhere in your graph as plain text. This extension surfaces
those unlinked mentions so you can turn them into proper page references.

## Usage

On a real page (not a daily-notes page), click the "Find aliases" button at the
bottom of the page. The extension scans your graph for unlinked plain-text
occurrences of that page's existing aliases and lists each match with a "link"
button. Clicking "link" wraps the matched text in place as an alias-style
reference, `[text]([[Page]])`, then re-runs the scan so the list reflects the
change.

The button only appears on real pages. Daily-notes pages do not get a "Find
aliases" button.

### Match rules

A plain-text occurrence is only offered as a candidate when it satisfies these
guards:

- **Whole-word only** — partial-word matches inside a longer word are skipped.
- **Case-insensitive** — matching ignores case.
- **Skips matches inside URLs, existing links, block references, and existing
  aliases** — only genuine plain-text mentions are surfaced.
- **Skips single-character aliases** — too noisy to be useful.
- **Skips footnote-style aliases** — these are not treated as linkable mentions.

## Known limitations

- The graph-wide scan fetches all blocks and re-runs after each link. This is
  fine for a personal graph but is not optimized for very large graphs.
- This is a prototype. It is structured for Roam Depot but has not been
  submitted.

## Install / Build

```sh
npm ci && npm run build
```

This produces `extension.js` at the repo root, which Roam Depot loads alongside
`extension.css`.

For local development:

```sh
npm install
npm test        # run the test suite once
npm run build   # bundle src/ into extension.js
```

## Architecture

The extension entry point (`src/alias-finder.js`) implements the Roam Depot
`onload` / `onunload` lifecycle. On load it injects a "Find aliases" button at
the bottom of the current page and re-injects it whenever the user navigates,
driven by a debounced `MutationObserver` in `src/page-context.js`. All side
effects (the observer and the injected DOM) are registered with a teardown
registry (`src/teardown-registry.mjs`) so `onunload` removes them cleanly. The
button itself is built by a pure helper in `src/button.js`. The click handler is
currently a stub and will be wired to the real alias-finding behavior in a later
phase.

## Related Documents

- `docs/features/` — feature requirements and specifications.
