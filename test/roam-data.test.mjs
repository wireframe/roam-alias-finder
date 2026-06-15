import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  collectAliasSeeds,
  findUnlinkedCandidates,
  findBlockCandidates,
  isExistingPage,
} from "../src/roam-data.js";

function mockQuery(...resultsPerCall) {
  const q = vi.fn();
  resultsPerCall.forEach((result) => q.mockResolvedValueOnce(result));
  globalThis.window = { roamAlphaAPI: { q } };
  return q;
}

afterEach(() => {
  delete globalThis.window;
});

describe("collectAliasSeeds", () => {
  it("returns distinct alias seeds in first-seen order", async () => {
    mockQuery([
      ["uses [pd]([[PagerDuty]]) here"],
      ["see [oncall]([[PagerDuty]]) too"],
    ]);

    const seeds = await collectAliasSeeds("PagerDuty");

    expect(seeds).toEqual(["pd", "oncall"]);
  });

  it("dedupes the same alias text seen across blocks", async () => {
    mockQuery([
      ["uses [pd]([[PagerDuty]]) here"],
      ["also [pd]([[PagerDuty]]) again"],
    ]);

    const seeds = await collectAliasSeeds("PagerDuty");

    expect(seeds).toEqual(["pd"]);
  });

  it("dedupes case-insensitively, keeping the first-seen casing", async () => {
    mockQuery([
      ["[She]([[Sheila]]) leads"],
      ["and [she]([[Sheila]]) again"],
    ]);

    const seeds = await collectAliasSeeds("Sheila");

    expect(seeds).toEqual(["She"]);
  });

  it("drops single-character and all-digit seeds", async () => {
    mockQuery([
      ["[*]([[PagerDuty]]) and [1]([[PagerDuty]]) and [pd]([[PagerDuty]])"],
    ]);

    const seeds = await collectAliasSeeds("PagerDuty");

    expect(seeds).toEqual(["pd"]);
  });

  it("returns an empty array when no blocks reference the page", async () => {
    mockQuery([]);

    const seeds = await collectAliasSeeds("PagerDuty");

    expect(seeds).toEqual([]);
  });
});

describe("findUnlinkedCandidates", () => {
  it("returns one candidate per plain-text match with uid, aliasText, and range", async () => {
    const q = mockQuery([
      ["uid-1", "we use pd daily"],
      ["uid-2", "pd then pd again"],
    ]);

    const candidates = await findUnlinkedCandidates(["pd"], "PagerDuty");

    expect(candidates).toEqual([
      { blockUid: "uid-1", string: "we use pd daily", aliasText: "pd", range: { start: 7, end: 9 } },
      { blockUid: "uid-2", string: "pd then pd again", aliasText: "pd", range: { start: 0, end: 2 } },
      { blockUid: "uid-2", string: "pd then pd again", aliasText: "pd", range: { start: 8, end: 10 } },
    ]);
    expect(q).toHaveBeenCalledOnce();
  });

  it("emits no candidate for a block that already links the alias", async () => {
    mockQuery([["uid-1", "we use [[pd]] daily"]]);

    const candidates = await findUnlinkedCandidates(["pd"], "PagerDuty");

    expect(candidates).toEqual([]);
  });

  it("returns an empty array and does not query when seeds is empty", async () => {
    const q = mockQuery();

    const candidates = await findUnlinkedCandidates([], "PagerDuty");

    expect(candidates).toEqual([]);
    expect(q).not.toHaveBeenCalled();
  });

  it("excludes a block whose string equals the page title", async () => {
    mockQuery([["uid-1", "PagerDuty"]]);

    const candidates = await findUnlinkedCandidates(["PagerDuty"], "PagerDuty");

    expect(candidates).toEqual([]);
  });
});

describe("isExistingPage", () => {
  it("returns true when a page with the exact title exists", () => {
    globalThis.window = { roamAlphaAPI: { q: vi.fn().mockReturnValue([["uid-1"]]) } };
    expect(isExistingPage("Zettelkasten")).toBe(true);
  });

  it("returns false when no page has the title (e.g. a zoomed-in block)", () => {
    globalThis.window = { roamAlphaAPI: { q: vi.fn().mockReturnValue([]) } };
    expect(isExistingPage("every zettel should hold exactly one idea")).toBe(false);
  });
});

describe("findBlockCandidates", () => {
  it("returns candidates for a single block without any query", () => {
    const candidates = findBlockCandidates("uid-1", "pd and pd", ["pd"]);

    expect(candidates).toEqual([
      { blockUid: "uid-1", string: "pd and pd", aliasText: "pd", range: { start: 0, end: 2 } },
      { blockUid: "uid-1", string: "pd and pd", aliasText: "pd", range: { start: 7, end: 9 } },
    ]);
  });

  it("recomputes correct ranges against an updated (post-link) block string", () => {
    const candidates = findBlockCandidates(
      "uid-1",
      "[pd]([[Page]]) and pd",
      ["pd"],
    );

    expect(candidates).toEqual([
      {
        blockUid: "uid-1",
        string: "[pd]([[Page]]) and pd",
        aliasText: "pd",
        range: { start: 19, end: 21 },
      },
    ]);
  });
});
