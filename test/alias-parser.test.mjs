import { describe, it, expect } from "vitest";
import { parseAliasTextsForPage } from "../src/alias-parser.js";

describe("parseAliasTextsForPage", () => {
  it("returns the alias display-text targeting the page", () => {
    const aliases = parseAliasTextsForPage(
      "[the pager tool]([[PagerDuty]])",
      "PagerDuty",
    );

    expect(aliases).toEqual(["the pager tool"]);
  });

  it("returns all matching aliases in order", () => {
    const blockString =
      "[the pager tool]([[PagerDuty]]) and [pd]([[PagerDuty]])";

    expect(parseAliasTextsForPage(blockString, "PagerDuty")).toEqual([
      "the pager tool",
      "pd",
    ]);
  });

  it("excludes aliases targeting a different page", () => {
    const blockString =
      "[the pager tool]([[PagerDuty]]) and [okrs]([[OKRs]])";

    expect(parseAliasTextsForPage(blockString, "PagerDuty")).toEqual([
      "the pager tool",
    ]);
  });

  it("returns an empty array for a plain page link with no alias text", () => {
    expect(parseAliasTextsForPage("[[PagerDuty]]", "PagerDuty")).toEqual([]);
  });

  it("returns an empty array for an external markdown link", () => {
    expect(parseAliasTextsForPage("[text](http://x)", "x")).toEqual([]);
  });

  it("matches a page title with regex-special characters literally", () => {
    expect(
      parseAliasTextsForPage("[plus plus]([[C++]])", "C++"),
    ).toEqual(["plus plus"]);
  });
});
