# Decisions: Roam Alias Finder Extension
Date: 2026-06-15

Source context: Roam page "Roam Alias Finder Extension". Prior art: Roam page
"Roam Meta Types Prototype" and code in `../roam-meta-type`.

Objective (verbatim intent): prototype a rebuild of the Roam aliases extension as an
"alias finder" that does not require pre-setting a set of alias data. A button at the
bottom of each page finds existing aliases pointing to that page, takes the alias text,
scans the graph for unlinked occurrences of that text, and lists each match in a row with
a button to create the link (wrap the text in the alias markdown).

## D1: Alias source
**Question:** When the button is clicked on a page (e.g. PagerDuty), where should it look to discover the alias texts to search for?
**Options considered:**
- Existing aliases to this page — scan for existing `[text]([[Page]])` references, use those texts as seeds (pure finder, no pre-config).
- Page title + aliases — also use the page title itself as a seed.
- Title + aliases + Roam alias attribute — also read a page-level `Aliases::` attribute (reintroduces pre-config).
**Chosen:** Existing aliases to this page.
**Rationale:** Matches the core "finder" intent — learn from how the page has already been aliased, with no pre-configuration required.

## D2: Scan scope
**Question:** Where should the extension scan for unlinked occurrences of those alias texts?
**Options considered:**
- Entire graph — search every block (most thorough, heaviest query/result list).
- Current page only — fast, tightly scoped, misses most of the graph.
- Graph-wide, capped/paginated — whole graph but cap/paginate results.
**Chosen:** Entire graph.
**Rationale:** The value of the tool is surfacing every linkable mention; the user wants thoroughness over a constrained query.

## D3: Case matching
**Question:** How should text matching handle case, and when linking a case variant, what text lands in the block?
**Options considered:**
- Case-insensitive match, preserve original text on link.
- Case-sensitive (exact) only.
- Case-insensitive, normalize linked text to the canonical alias casing.
**Chosen:** Case-insensitive matching; preserve the author's original text casing when linking.
**Rationale:** Catch lowercase/variant mentions (more matches found) without silently rewriting the author's wording. E.g. plain `pagerduty` → `[pagerduty]([[PagerDuty]])`.

## D4: Link UX
**Question:** How should the "link" action work in the results list?
**Options considered:**
- Per-row button only (one at a time; simplest, max control).
- Per-row + "Link all" (bulk action).
- Checkbox select + link selected.
**Chosen:** Per-row button only.
**Rationale:** Simplest to build and keeps each link an explicit, reviewed action — appropriate for a prototype.

## D5: Depot scope
**Question:** How far should this prototype go toward being a Roam Depot extension?
**Options considered:**
- Depot-structured, not submitted — proper entry with onload/onunload lifecycle, settings panel if needed; not published.
- Quick script, refactor later — loose script, package only if it proves out.
- Fully submission-ready — README, metadata, changelog, full lifecycle hygiene.
**Chosen:** Depot-structured, not submitted.
**Rationale:** Build it so it could be submitted later (correct lifecycle structure) without spending hackathon time on publishing polish.

## D6: Success criteria
**Question:** What defines "done" for this prototype?
**Options considered:**
- End-to-end on a real page — works against live graph data with guard rules holding.
- Works on a crafted test page — controlled, repeatable, not validated on real data.
- Core flow, guards best-effort — find → list → link works; exclusion rules not exhaustively verified.
**Chosen:** End-to-end on a real page.
**Rationale:** On a real page, the button finds genuine unlinked matches across the graph, the guard rules hold, and clicking "link" correctly wraps the text in Roam — proven on live data, not just a fixture.

## Constraints (guard rules, carried from the objective)
- Do not match text inside URLs.
- Do not match partial words (`OKRS` must not match `weorks`); whole-word matches only.
- Skip single-character aliases (e.g. `*`).
- Skip footnote-style markers (e.g. `1`, `2`, ...).
- Matching is case-insensitive (see D3).

## Research Focus Areas
- How does `../roam-meta-type` structure a Roam Depot extension — entry point, `onload`/`onunload` lifecycle, manifest/metadata, build/packaging? What can be reused as a template?
- How does the prior art add UI to a page (e.g. a button at the bottom of each page) — what Roam API or DOM/observer mechanism does it use, and how does it clean up on unload?
- What query mechanism does the prior art use against the graph (Roam datalog/`roamAlphaAPI`, pull/query patterns), and how to query for existing `[text]([[Page]])` alias references and for unlinked plain-text occurrences graph-wide?
- How are blocks read and updated (string edits) via the Roam API in the prior art — the path for wrapping matched text into `[text]([[Page]])` while preserving original casing.
- How does the prior art identify "the current page" the user is viewing (to know which page the button acts on)?
- What is the right approach to whole-word, URL-excluding, case-insensitive text matching against block strings (regex/tokenization) given Roam block content format?
- Any settings/config panel pattern in the prior art (in case result caps or scope toggles are wanted later)?
