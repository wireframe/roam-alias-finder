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

  it("returns the parent of .rm-reference-main when present", () => {
    const parent = document.createElement("div");
    const refs = document.createElement("div");
    refs.className = "rm-reference-main";
    parent.appendChild(refs);
    document.body.appendChild(parent);

    expect(getReferencesAnchor()).toBe(parent);
  });

  it("returns null when .rm-reference-main is absent", () => {
    expect(getReferencesAnchor()).toBeNull();
  });
});
