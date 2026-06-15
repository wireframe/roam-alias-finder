# roam-alias-finder

A Roam Research extension that helps you find unlinked occurrences of a page's
existing aliases and link them. When a page declares aliases, those aliases are
often mentioned elsewhere in your graph as plain text. This extension surfaces
those unlinked mentions so you can turn them into proper page references.

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
