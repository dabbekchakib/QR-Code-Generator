import { describe, it, expect } from "vitest";
import {
  isValidCustomRange,
  daysBetweenLocal,
  selectionToRange,
  selectionDays,
  parseAnalyticsSelection,
  selectionToUrl,
  customToRange,
  toDateInputValue,
  parseLocalDate,
  localOffsetMinutes,
} from "../utils/analytics-filters";

// Fixed "now" in LOCAL time so the tests are time-zone independent.
const NOW = new Date(2026, 7, 15, 12, 0, 0); // 2026-08-15 12:00 local

describe("local dates", () => {
  it("formats a date as local YYYY-MM-DD", () => {
    expect(toDateInputValue(new Date(2026, 7, 1))).toBe("2026-08-01");
    expect(toDateInputValue(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("parses local YYYY-MM-DD and rejects impossible/malformed values", () => {
    const d = parseLocalDate("2026-08-15");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(7);
    expect(d?.getDate()).toBe(15);
    expect(parseLocalDate("2026-02-30")).toBeNull();
    expect(parseLocalDate("2026-8-1")).toBeNull();
    expect(parseLocalDate("abcd-ef-gh")).toBeNull();
    expect(parseLocalDate("")).toBeNull();
  });

  it("exposes the runtime offset as minutes", () => {
    const offset = localOffsetMinutes();
    expect(offset).toBe(-new Date().getTimezoneOffset());
    expect(Number.isInteger(offset)).toBe(true);
  });
});

describe("isValidCustomRange", () => {
  it("accepts a past range and one ending today", () => {
    expect(isValidCustomRange({ from: "2026-08-01", to: "2026-08-15" }, NOW)).toBe(true);
    expect(isValidCustomRange({ from: "2026-08-15", to: "2026-08-15" }, NOW)).toBe(true);
    expect(isValidCustomRange({ from: "2021-01-01", to: "2021-12-31" }, NOW)).toBe(true);
  });

  it("rejects future ends and reversed ranges", () => {
    expect(isValidCustomRange({ from: "2026-08-15", to: "2026-08-16" }, NOW)).toBe(false);
    expect(isValidCustomRange({ from: "2026-08-15", to: "2026-08-01" }, NOW)).toBe(false);
  });

  it("rejects spans longer than 365 days", () => {
    expect(isValidCustomRange({ from: "2025-01-01", to: "2026-08-15" }, NOW)).toBe(false);
  });

  it("rejects malformed dates", () => {
    expect(isValidCustomRange({ from: "2026-02-30", to: "2026-08-15" }, NOW)).toBe(false);
    expect(isValidCustomRange({ from: "", to: "2026-08-15" }, NOW)).toBe(false);
    expect(isValidCustomRange({ from: "nope", to: "2026-08-15" }, NOW)).toBe(false);
  });
});

describe("daysBetweenLocal", () => {
  it("counts inclusive days between the two dates", () => {
    expect(daysBetweenLocal("2026-08-01", "2026-08-15", NOW)).toBe(15);
    expect(daysBetweenLocal("2026-08-15", "2026-08-15", NOW)).toBe(1);
  });

  it("returns null for invalid ranges", () => {
    expect(daysBetweenLocal("2026-08-15", "2026-08-16", NOW)).toBeNull();
  });
});

describe("customToRange", () => {
  it("maps from = local midnight, to = following local midnight (exclusive)", () => {
    const range = customToRange({ from: "2026-08-01", to: "2026-08-15" });
    expect(range.start?.getFullYear()).toBe(2026);
    expect(range.start?.getMonth()).toBe(7);
    expect(range.start?.getDate()).toBe(1);
    expect(range.end?.getFullYear()).toBe(2026);
    expect(range.end?.getMonth()).toBe(7);
    expect(range.end?.getDate()).toBe(16);
  });
});

describe("selectionToRange", () => {
  it("all time = open boundaries", () => {
    const range = selectionToRange({ period: "all", qrId: null, custom: null }, 0, NOW);
    expect(range.start).toBeNull();
    expect(range.end).toBeNull();
  });

  it("valid custom range uses its own local window", () => {
    const range = selectionToRange(
      { period: "custom", qrId: null, custom: { from: "2026-08-01", to: "2026-08-15" } },
      0,
      NOW
    );
    expect(range.start?.getDate()).toBe(1);
    expect(range.end?.getDate()).toBe(16);
    expect(range.end?.getHours()).toBe(0);
  });

  it("invalid custom range falls back to 30d", () => {
    const range = selectionToRange(
      { period: "custom", qrId: null, custom: { from: "2026-08-99", to: "2026-08-15" } },
      0,
      NOW
    );
    expect(range.start).not.toBeNull();
    expect(range.end).not.toBeNull();
  });
});

describe("selectionDays", () => {
  it("maps named periods to their day counts", () => {
    expect(selectionDays({ period: "today", qrId: null, custom: null })).toBe(1);
    expect(selectionDays({ period: "7d", qrId: null, custom: null })).toBe(7);
    expect(selectionDays({ period: "30d", qrId: null, custom: null })).toBe(30);
    expect(selectionDays({ period: "90d", qrId: null, custom: null })).toBe(90);
    expect(selectionDays({ period: "all", qrId: null, custom: null })).toBeNull();
  });

  it("counts custom ranges inclusively", () => {
    expect(
      selectionDays({ period: "custom", qrId: null, custom: { from: "2026-08-01", to: "2026-08-10" } }, NOW)
    ).toBe(10);
  });
});

describe("parseAnalyticsSelection", () => {
  it("parses named periods and keeps qrId", () => {
    expect(parseAnalyticsSelection(new URLSearchParams("?range=30d"), NOW)).toEqual({
      period: "30d",
      qrId: null,
      custom: null,
    });
    expect(parseAnalyticsSelection(new URLSearchParams("?range=90d&qr=abc123"), NOW)).toEqual({
      period: "90d",
      qrId: "abc123",
      custom: null,
    });
  });

  it("parses a valid custom range from/from", () => {
    expect(
      parseAnalyticsSelection(
        new URLSearchParams("?range=custom&from=2026-08-01&to=2026-08-15&qr=q1"),
        NOW
      )
    ).toEqual({
      period: "custom",
      qrId: "q1",
      custom: { from: "2026-08-01", to: "2026-08-15" },
    });
  });

  it("falls back to the 30d default on unknown or invalid values", () => {
    expect(parseAnalyticsSelection(new URLSearchParams("?range=wat"), NOW)).toEqual({
      period: "30d",
      qrId: null,
      custom: null,
    });
    expect(
      parseAnalyticsSelection(new URLSearchParams("?range=custom&from=2026-08-15&to=2026-08-16"), NOW)
    ).toEqual({ period: "30d", qrId: null, custom: null });
    expect(parseAnalyticsSelection(new URLSearchParams("?range=custom"), NOW)).toEqual({
      period: "30d",
      qrId: null,
      custom: null,
    });
  });

  it("keeps qrId even when the period falls back", () => {
    expect(parseAnalyticsSelection(new URLSearchParams("?range=999d&qr=k"), NOW)).toEqual({
      period: "30d",
      qrId: "k",
      custom: null,
    });
  });
});

describe("selectionToUrl", () => {
  it("serializes named periods", () => {
    expect(selectionToUrl({ period: "30d", qrId: null, custom: null })).toBe("/analytics?range=30d");
    expect(selectionToUrl({ period: "all", qrId: null, custom: null })).toBe("/analytics?range=all");
  });

  it("adds the qr param when set", () => {
    expect(selectionToUrl({ period: "today", qrId: "xyz", custom: null })).toBe(
      "/analytics?range=today&qr=xyz"
    );
  });

  it("serializes custom ranges with from/to", () => {
    expect(
      selectionToUrl({
        period: "custom",
        qrId: null,
        custom: { from: "2026-08-01", to: "2026-08-15" },
      })
    ).toBe("/analytics?range=custom&from=2026-08-01&to=2026-08-15");
  });
});