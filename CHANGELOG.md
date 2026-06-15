# Changelog

## 0.1.0

- Initial extension skeleton.
- Roam Depot lifecycle (`onload` / `onunload`) with teardown registry.
- Injects a "Find aliases" button at the bottom of each page and re-injects on
  navigation.
- Alias finder: clicking "Find aliases" scans the graph for unlinked plain-text
  occurrences of the page's existing aliases and lists each with a per-row
  "link" button that wraps the text as `[text]([[Page]])` in place.
- Match guards: whole-word, case-insensitive; skips matches inside URLs,
  existing links, block references, and aliases; skips single-character and
  footnote-style aliases.
- The "Find aliases" button is excluded from daily-notes pages and appears only
  on real pages.
