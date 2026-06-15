import { describe, it, expect, vi, afterEach } from "vitest";
import { linkMatch } from "../src/link-action.js";

function mockUpdateBlock() {
  const updateBlock = vi.fn();
  globalThis.window = { roamAlphaAPI: { updateBlock } };
  return updateBlock;
}

afterEach(() => {
  delete globalThis.window;
});

describe("linkMatch", () => {
  it("wraps the targeted occurrence as an alias, preserving original casing", async () => {
    const updateBlock = mockUpdateBlock();

    await linkMatch({
      blockUid: "b1",
      string: "we use pagerduty daily",
      range: { start: 7, end: 16 },
      pageTitle: "PagerDuty",
    });

    expect(updateBlock).toHaveBeenCalledWith({
      block: { uid: "b1", string: "we use [pagerduty]([[PagerDuty]]) daily" },
    });
  });

  it("wraps only the targeted occurrence when the substring appears twice", async () => {
    const updateBlock = mockUpdateBlock();

    await linkMatch({
      blockUid: "b1",
      string: "pd then pd again",
      range: { start: 8, end: 10 },
      pageTitle: "PagerDuty",
    });

    expect(updateBlock).toHaveBeenCalledWith({
      block: { uid: "b1", string: "pd then [pd]([[PagerDuty]]) again" },
    });
  });

  it("returns the new block string so callers can refresh without a re-query", async () => {
    mockUpdateBlock();

    const next = await linkMatch({
      blockUid: "b1",
      string: "we use pagerduty daily",
      range: { start: 7, end: 16 },
      pageTitle: "PagerDuty",
    });

    expect(next).toBe("we use [pagerduty]([[PagerDuty]]) daily");
  });
});
