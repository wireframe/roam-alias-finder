// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderResults, renderSearching } from "../src/results-panel.js";

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

describe("renderSearching", () => {
  it("clears the container and shows a searching status", () => {
    const stale = document.createElement("p");
    stale.className = "stale";
    container.appendChild(stale);

    renderSearching(container);

    expect(container.querySelectorAll(".stale")).toHaveLength(0);
    const status = container.querySelector(".alias-finder-status");
    expect(status).toBeTruthy();
    expect(status.textContent).toBe("Searching…");
  });
});

describe("renderResults empty state", () => {
  it("shows a no-matches message and no sections when candidates is empty", () => {
    renderResults(container, [], () => {});

    expect(container.querySelectorAll(".alias-finder-section")).toHaveLength(0);
    const empty = container.querySelector(".alias-finder-empty");
    expect(empty.textContent).toBe("No unlinked matches found");
  });

  it("includes the seed count suffix when seedCount > 0", () => {
    renderResults(container, [], () => {}, 4);

    const empty = container.querySelector(".alias-finder-empty");
    expect(empty.textContent).toBe("No unlinked matches found (4 aliases checked)");
  });

  it("uses the singular noun when exactly one alias was checked", () => {
    renderResults(container, [], () => {}, 1);

    const empty = container.querySelector(".alias-finder-empty");
    expect(empty.textContent).toBe("No unlinked matches found (1 alias checked)");
  });

  it("omits the suffix when seedCount is 0 or undefined", () => {
    renderResults(container, [], () => {}, 0);
    expect(container.querySelector(".alias-finder-empty").textContent).toBe(
      "No unlinked matches found",
    );
  });
});

describe("renderResults grouping", () => {
  it("renders one section per alias group", () => {
    const candidates = [
      candidate({ aliasText: "pd" }),
      candidate({ aliasText: "pd", blockUid: "b2" }),
      candidate({ aliasText: "okr", blockUid: "b3" }),
    ];

    renderResults(container, candidates, () => {});

    expect(container.querySelectorAll(".alias-finder-section")).toHaveLength(2);
  });

  it("sorts alias group sections alphabetically, case-insensitively", () => {
    const candidates = [
      candidate({ aliasText: "Zebra" }),
      candidate({ aliasText: "apple" }),
      candidate({ aliasText: "Mango" }),
    ];

    renderResults(container, candidates, () => {});

    const titles = [
      ...container.querySelectorAll(".alias-finder-section-title"),
    ].map((el) => el.textContent);
    expect(titles).toEqual(["apple", "Mango", "Zebra"]);
  });

  it("shows a count badge equal to the group size", () => {
    const candidates = [
      candidate({ aliasText: "pd" }),
      candidate({ aliasText: "pd", blockUid: "b2" }),
      candidate({ aliasText: "pd", blockUid: "b3" }),
    ];

    renderResults(container, candidates, () => {});

    expect(container.querySelector(".alias-finder-count").textContent).toBe("3");
  });

  it("renders one row per candidate in a group", () => {
    const candidates = [
      candidate({ aliasText: "pd" }),
      candidate({ aliasText: "pd", blockUid: "b2" }),
    ];

    renderResults(container, candidates, () => {});

    expect(container.querySelectorAll(".alias-finder-row")).toHaveLength(2);
  });
});

describe("renderResults collapsible sections", () => {
  it("starts expanded and toggles the collapsed class when the header is clicked", () => {
    renderResults(container, [candidate()], () => {});

    const section = container.querySelector(".alias-finder-section");
    const header = container.querySelector(".alias-finder-section-header");
    expect(section.classList.contains("collapsed")).toBe(false);

    header.dispatchEvent(new Event("click"));
    expect(section.classList.contains("collapsed")).toBe(true);

    header.dispatchEvent(new Event("click"));
    expect(section.classList.contains("collapsed")).toBe(false);
  });

  it("renders a disclosure caret in each section header", () => {
    renderResults(container, [candidate()], () => {});

    const header = container.querySelector(".alias-finder-section-header");
    expect(header.querySelector(".alias-finder-caret")).not.toBeNull();
  });
});

describe("renderResults highlight", () => {
  it("wraps only the matched substring in .unlink-word and keeps context outside it", () => {
    renderResults(
      container,
      [candidate({ string: "we use pd daily", range: { start: 7, end: 9 } })],
      () => {},
    );

    const highlight = container.querySelector(".unlink-word");
    expect(highlight.textContent).toBe("pd");
    const row = container.querySelector(".alias-finder-row");
    expect(row.textContent).toContain("we use ");
    expect(row.textContent).toContain(" daily");
  });

  it("preserves the original casing of the matched substring", () => {
    renderResults(
      container,
      [candidate({ string: "set up PagerDuty alerts", range: { start: 7, end: 16 } })],
      () => {},
    );

    expect(container.querySelector(".unlink-word").textContent).toBe("PagerDuty");
  });

  it("renders block content as text, not HTML", () => {
    renderResults(
      container,
      [candidate({ string: "danger <b>bold</b>", range: { start: 0, end: 6 } })],
      () => {},
    );

    const row = container.querySelector(".alias-finder-row");
    expect(row.querySelector("b")).toBeNull();
    expect(row.textContent).toContain("<b>bold</b>");
  });
});

describe("renderResults link button", () => {
  it("clears existing children before rendering", () => {
    const stale = document.createElement("p");
    stale.className = "stale";
    container.appendChild(stale);

    renderResults(container, [candidate()], () => {});

    expect(container.querySelectorAll(".stale")).toHaveLength(0);
    expect(container.querySelectorAll(".alias-finder-row")).toHaveLength(1);
  });

  it("disables the link button on click and calls onLink with the candidate", () => {
    const only = candidate();
    const onLink = vi.fn();

    renderResults(container, [only], onLink);
    const button = container.querySelector(".alias-finder-link-btn");
    button.dispatchEvent(new Event("click"));

    expect(button.disabled).toBe(true);
    expect(onLink).toHaveBeenCalledWith(only);
  });
});
