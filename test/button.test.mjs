// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createFinderButton } from "../src/button.js";

describe("createFinderButton", () => {
  it("builds a button element with the alias-finder class and label", () => {
    const button = createFinderButton("Find aliases", () => {});

    expect(button.tagName).toBe("BUTTON");
    expect(button.className).toContain("alias-finder-btn");
    expect(button.textContent).toBe("Find aliases");
  });

  it("invokes the onClick callback when clicked", () => {
    const onClick = vi.fn();
    const button = createFinderButton("Find aliases", onClick);

    button.dispatchEvent(new Event("click"));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
