import { describe, it, expect } from "vitest";
import { formatCount, percent, toCount } from "../utils/format";

describe("percent", () => {
  it("returns 0 for a zero or missing total (never NaN/Infinity)", () => {
    expect(percent(5, 0)).toBe(0);
    expect(percent(0, 0)).toBe(0);
    expect(percent(1, -1)).toBe(0);
    expect(Number.isNaN(percent(4, 0))).toBe(false);
    expect(Number.isFinite(percent(4, 0))).toBe(true);
  });

  it("rounds to 1 decimal", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2, 3)).toBe(66.7);
    expect(percent(10, 100)).toBe(10);
    expect(percent(1, 100)).toBe(1);
  });

  it("normalizes negative zero to 0", () => {
    expect(Object.is(percent(0, 100), -0)).toBe(false);
  });
});

describe("formatCount", () => {
  it("formats integers with thousands separators", () => {
    expect(formatCount(12482)).toBe("12,482");
    expect(formatCount(0)).toBe("0");
  });

  it("never renders NaN, Infinity or undefined", () => {
    expect(formatCount(null)).toBe("0");
    expect(formatCount(undefined)).toBe("0");
    expect(formatCount(Number.NaN)).toBe("0");
    expect(formatCount(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

describe("toCount", () => {
  it("coerces numbers, numeric strings and clamps negatives", () => {
    expect(toCount(42)).toBe(42);
    expect(toCount("7")).toBe(7);
    expect(toCount("7.8")).toBe(8);
    expect(toCount(null)).toBe(0);
    expect(toCount(undefined)).toBe(0);
    expect(toCount("nope")).toBe(0);
    expect(toCount(-3)).toBe(0);
    expect(toCount(Number.NaN)).toBe(0);
  });
});