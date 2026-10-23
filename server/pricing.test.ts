import { describe, expect, it } from "vitest";
import { computeOrderTotal, normalizeQty } from "./pricing";

// The order total is the one number a visitor could try to influence, so it is
// computed server-side from the STORED prices. These tests pin that behaviour.
describe("computeOrderTotal", () => {
  it("sums price × qty across every line", () => {
    expect(
      computeOrderTotal([
        { priceSnapshot: 4850, qty: 1 },
        { priceSnapshot: 1850, qty: 2 },
      ]),
    ).toBe(8550);
  });

  it("is zero for an empty cart", () => {
    expect(computeOrderTotal([])).toBe(0);
  });

  it("ignores nothing — a zero-priced line contributes zero, not a skip", () => {
    expect(computeOrderTotal([{ priceSnapshot: 0, qty: 5 }])).toBe(0);
  });
});

describe("normalizeQty", () => {
  it("keeps a sane quantity as-is", () => {
    expect(normalizeQty(3)).toBe(3);
  });

  it("floors a fractional quantity", () => {
    expect(normalizeQty(2.9)).toBe(2);
  });

  it("clamps to at least 1 and at most 20", () => {
    expect(normalizeQty(0)).toBe(1);
    expect(normalizeQty(-4)).toBe(1);
    expect(normalizeQty(999)).toBe(20);
  });

  it("treats NaN as 1 rather than propagating it into the total", () => {
    expect(normalizeQty(Number.NaN)).toBe(1);
  });
});
