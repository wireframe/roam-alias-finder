import { describe, it, expect, vi } from "vitest";
import { createTeardownRegistry } from "../src/teardown-registry.mjs";

describe("createTeardownRegistry", () => {
  it("runs cleanups in LIFO order", () => {
    const order = [];
    const registry = createTeardownRegistry();

    registry.register(() => order.push("A"));
    registry.register(() => order.push("B"));
    registry.runAll();

    expect(order).toEqual(["B", "A"]);
  });

  it("keeps running later cleanups when one throws", () => {
    const successful = vi.fn();
    const registry = createTeardownRegistry();
    vi.spyOn(console, "error").mockImplementation(() => {});

    registry.register(successful);
    registry.register(() => {
      throw new Error("cleanup failed");
    });
    registry.runAll();

    expect(successful).toHaveBeenCalledOnce();
  });
});
