// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { isDailyNotePage, getReferencesAnchor } from "../src/page-context.js";

function mockPageTitleToDate(impl) {
  const pageTitleToDate = vi.fn(impl);
  globalThis.window = { roamAlphaAPI: { util: { pageTitleToDate } } };
  return pageTitleToDate;
}

afterEach(() => {
  delete globalThis.window;
});

describe("isDailyNotePage", () => {
  it("returns true when Roam parses the title to a Date", () => {
    mockPageTitleToDate(() => new Date(2026, 5, 15));

    expect(isDailyNotePage("June 15th, 2026")).toBe(true);
  });

  it("returns false when Roam returns null for a non-date title", () => {
    mockPageTitleToDate(() => null);

    expect(isDailyNotePage("PagerDuty")).toBe(false);
  });

  it("returns false for a null title without throwing", () => {
    mockPageTitleToDate(() => null);

    expect(isDailyNotePage(null)).toBe(false);
  });

  it("returns false for an empty title without throwing", () => {
    mockPageTitleToDate(() => null);

    expect(isDailyNotePage("")).toBe(false);
  });
});

describe("getReferencesAnchor", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("returns the parent of the page's .rm-reference-main when present", () => {
    const article = document.createElement("div");
    article.className = "roam-article";
    const parent = document.createElement("div");
    const refs = document.createElement("div");
    refs.className = "rm-reference-main";
    parent.appendChild(refs);
    article.appendChild(parent);
    document.body.appendChild(article);

    expect(getReferencesAnchor()).toBe(parent);
  });

  it("ignores a .rm-reference-main rendered inside an embed and uses the page's own", () => {
    const article = document.createElement("div");
    article.className = "roam-article";

    // An embedded query/page in the body, with its own references, earlier in the DOM.
    const embed = document.createElement("div");
    embed.className = "rm-embed-container";
    const embeddedRefs = document.createElement("div");
    embeddedRefs.className = "rm-reference-main";
    embed.appendChild(embeddedRefs);
    article.appendChild(embed);

    // The page's own references section, lower in the DOM.
    const pageRefsParent = document.createElement("div");
    const pageRefs = document.createElement("div");
    pageRefs.className = "rm-reference-main";
    pageRefsParent.appendChild(pageRefs);
    article.appendChild(pageRefsParent);

    document.body.appendChild(article);

    expect(getReferencesAnchor()).toBe(pageRefsParent);
  });

  it("returns null when .rm-reference-main is absent", () => {
    const article = document.createElement("div");
    article.className = "roam-article";
    document.body.appendChild(article);
    expect(getReferencesAnchor()).toBeNull();
  });
});
