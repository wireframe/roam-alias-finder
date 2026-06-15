// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderResults } from "../src/results-panel.js";

function candidate(overrides) {
  return {
    blockUid: "b1",
    string: "we use pd daily",
    aliasText: "pd",
    range: { start: 7, end: 9 },
    ...overrides,
  };
}

let container;

beforeEach(() => {
  container = document.createElement("div");
});

describe("renderResults", () => {
  it("renders one row with a link button per candidate", () => {
    const candidates = [candidate(), candidate({ blockUid: "b2" })];

    renderResults(container, candidates, () => {});

    expect(container.querySelectorAll(".alias-finder-row")).toHaveLength(2);
    container.querySelectorAll(".alias-finder-row").forEach((row) => {
      expect(row.querySelector(".alias-finder-link-btn")).toBeTruthy();
    });
  });

  it("calls onLink with the row's candidate when its button is clicked", () => {
    const first = candidate({ blockUid: "b1" });
    const second = candidate({ blockUid: "b2" });
    const onLink = vi.fn();

    renderResults(container, [first, second], onLink);
    const buttons = container.querySelectorAll(".alias-finder-link-btn");
    buttons[1].dispatchEvent(new Event("click"));

    expect(onLink).toHaveBeenCalledWith(second);
  });

  it("disables the link button on click and still calls onLink", () => {
    const only = candidate();
    const onLink = vi.fn();

    renderResults(container, [only], onLink);
    const button = container.querySelector(".alias-finder-link-btn");
    button.dispatchEvent(new Event("click"));

    expect(button.disabled).toBe(true);
    expect(onLink).toHaveBeenCalledWith(only);
  });

  it("shows a no-matches message and no rows when candidates is empty", () => {
    renderResults(container, [], () => {});

    expect(container.querySelectorAll(".alias-finder-row")).toHaveLength(0);
    expect(container.textContent).toContain("No unlinked matches found");
  });

  it("clears existing children before rendering", () => {
    const stale = document.createElement("p");
    stale.className = "stale";
    container.appendChild(stale);

    renderResults(container, [candidate()], () => {});

    expect(container.querySelectorAll(".alias-finder-row")).toHaveLength(1);
    expect(container.querySelectorAll(".stale")).toHaveLength(0);
  });

  it("renders block content as text, not HTML", () => {
    renderResults(container, [candidate({ string: "danger <b>bold</b>" })], () => {});

    const row = container.querySelector(".alias-finder-row");
    expect(row.querySelector("b")).toBeNull();
    expect(row.textContent).toContain("<b>bold</b>");
  });
});
