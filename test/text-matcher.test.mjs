import { describe, it, expect } from "vitest";
import { findMatches } from "../src/text-matcher.js";

describe("findMatches core matching", () => {
  it("finds an exact whole-word occurrence", () => {
    const blockString = "We use PagerDuty daily";

    expect(findMatches(blockString, "PagerDuty")).toEqual([
      { start: 7, end: 16 },
    ]);
  });

  it("matches case-insensitively", () => {
    const blockString = "set up pagerduty alerts";

    expect(findMatches(blockString, "PagerDuty")).toEqual([
      { start: 7, end: 16 },
    ]);
  });

  it("matches only standalone whole words, not substrings", () => {
    const blockString = "weorks and OKRS today";

    expect(findMatches(blockString, "OKRS")).toEqual([{ start: 11, end: 15 }]);
  });

  it("returns multiple occurrences in order", () => {
    const blockString = "roam then roam again";

    expect(findMatches(blockString, "roam")).toEqual([
      { start: 0, end: 4 },
      { start: 10, end: 14 },
    ]);
  });

  it("returns ranges that slice back to the original-cased substring", () => {
    const blockString = "set up pagerduty alerts";
    const [range] = findMatches(blockString, "PagerDuty");

    expect(blockString.slice(range.start, range.end)).toBe("pagerduty");
  });

  it("matches a seed that has surrounding whitespace", () => {
    const blockString = "hello world today";
    const ranges = findMatches(blockString, " world ");

    expect(ranges).toHaveLength(1);
    expect(blockString.slice(ranges[0].start, ranges[0].end)).toBe("world");
  });
});

describe("findMatches guard rules", () => {
  it("excludes matches inside URLs", () => {
    const blockString = "see https://roam.com/x and roam notes";

    expect(findMatches(blockString, "roam")).toEqual([{ start: 27, end: 31 }]);
  });

  it("excludes a match inside an existing page link", () => {
    const blockString = "[[PagerDuty]]";

    expect(findMatches(blockString, "PagerDuty")).toEqual([]);
  });

  it("excludes a match inside an existing block ref", () => {
    const blockString = "((PagerDuty))";

    expect(findMatches(blockString, "PagerDuty")).toEqual([]);
  });

  it("excludes a match inside an existing alias", () => {
    const blockString = "[pd]([[PagerDuty]])";

    expect(findMatches(blockString, "PagerDuty")).toEqual([]);
  });

  it("returns an empty array for a single-character alias", () => {
    expect(findMatches("a * b", "*")).toEqual([]);
  });

  it("returns an empty array for a footnote-marker alias", () => {
    expect(findMatches("see note 1 here", "1")).toEqual([]);
  });

  it("returns only the plain occurrence when an alias also appears inside a page link", () => {
    const blockString = "[[PagerDuty]] but also PagerDuty here";
    const ranges = findMatches(blockString, "PagerDuty");

    expect(ranges).toHaveLength(1);
    expect(blockString.slice(ranges[0].start, ranges[0].end)).toBe("PagerDuty");
    expect(ranges[0].start).toBeGreaterThan(13);
  });

  it("returns only the plain occurrence when an alias also appears inside an existing alias", () => {
    const blockString = "[pd]([[PagerDuty]]) and PagerDuty again";
    const ranges = findMatches(blockString, "PagerDuty");

    expect(ranges).toHaveLength(1);
    expect(blockString.slice(ranges[0].start, ranges[0].end)).toBe("PagerDuty");
    expect(ranges[0].start).toBeGreaterThan(18);
  });

  it("returns only the plain occurrence when an alias also appears inside a bare tag", () => {
    const blockString = "#PagerDuty and PagerDuty here";
    const ranges = findMatches(blockString, "PagerDuty");

    expect(ranges).toHaveLength(1);
    expect(blockString.slice(ranges[0].start, ranges[0].end)).toBe("PagerDuty");
    expect(ranges[0].start).toBeGreaterThan(10);
  });

  it("excludes a match inside a bare tag (case-insensitive)", () => {
    const blockString = "#pagerduty and PagerDuty here";
    const ranges = findMatches(blockString, "PagerDuty");

    expect(ranges).toHaveLength(1);
    expect(blockString.slice(ranges[0].start, ranges[0].end)).toBe("PagerDuty");
    expect(ranges[0].start).toBeGreaterThan(10);
  });

  it("excludes a match inside a multi-word tag form #[[Multi Word]]", () => {
    const blockString = "#[[Multi Word]] and Multi Word here";
    const ranges = findMatches(blockString, "Multi Word");

    expect(ranges).toHaveLength(1);
    expect(blockString.slice(ranges[0].start, ranges[0].end)).toBe("Multi Word");
    expect(ranges[0].start).toBeGreaterThan(15);
  });
});
