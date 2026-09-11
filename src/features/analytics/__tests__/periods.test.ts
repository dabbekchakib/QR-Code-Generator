import { describe, it, expect } from "vitest";
import {
  daysForPeriod,
  getPeriodRange,
  isAnalyticsPeriod,
} from "../utils/periods";
import { ANALYTICS_PERIODS } from "../types";

describe("daysForPeriod", () => {
  it("maps every period to its calendar days", () => {
    expect(daysForPeriod("today")).toBe(1);
    expect(daysForPeriod("7d")).toBe(7);
    expect(daysForPeriod("30d")).toBe(30);
    expect(daysForPeriod("90d")).toBe(90);
    expect(daysForPeriod("all")).toBeNull();
  });
});

describe("isAnalyticsPeriod", () => {
  it("accepts only the known periods", () => {
    for (const period of ANALYTICS_PERIODS) {
      expect(isAnalyticsPeriod(period)).toBe(true);
    }
    expect(isAnalyticsPeriod("14d")).toBe(false);
    expect(isAnalyticsPeriod("custom")).toBe(false);
    expect(isAnalyticsPeriod(null)).toBe(false);
    expect(isAnalyticsPeriod("")).toBe(false);
  });
});

describe("getPeriodRange", () => {
  const UTC_MINUS_4 = -4 * 60; // e.g. New York in summer (UTC-04:00)

  it("today = local midnight to now (UTC storage, local boundaries)", () => {
    // Fixed "now": 2026-08-15 18:30 local in UTC-4 => 22:30 UTC.
    const now = new Date("2026-08-15T22:30:00Z");
    const range = getPeriodRange("today", UTC_MINUS_4, now);
    expect(range.start?.toISOString()).toBe("2026-08-15T04:00:00.000Z");
    expect(range.end).toBe(now);
  });

  it("7d covers the previous 6 full days plus today", () => {
    const now = new Date("2026-08-15T22:30:00Z");
    const range = getPeriodRange("7d", UTC_MINUS_4, now);
    expect(range.start?.toISOString()).toBe("2026-08-09T04:00:00.000Z");
    expect(range.end).toBe(now);
  });

  it("30d covers the month window", () => {
    const now = new Date("2026-08-15T22:30:00Z");
    const range = getPeriodRange("30d", UTC_MINUS_4, now);
    expect(range.start?.toISOString()).toBe("2026-07-17T04:00:00.000Z");
    expect(range.end).toBe(now);
  });

  it("positive offsets (east of UTC) are handled correctly", () => {
    const now = new Date("2026-08-15T22:30:00Z");
    // UTC+3: local time is already 2026-08-16 01:30, so "today" starts at
    // local midnight (2026-08-16 00:00), which is 2026-08-15 21:00 UTC.
    const range = getPeriodRange("today", 3 * 60, now);
    expect(range.start?.toISOString()).toBe("2026-08-15T21:00:00.000Z");
    expect(range.end).toBe(now);
  });

  it("all time returns open boundaries", () => {
    const range = getPeriodRange("all", 0, new Date("2026-08-15T22:30:00Z"));
    expect(range.start).toBeNull();
    expect(range.end).toBeNull();
  });

  it("handles a day-boundary wrap for UTC+3", () => {
    // Local midnight for UTC+3 falls before 00:00 UTC, so the previous UTC day.
    const now = new Date("2026-08-01T02:30:00Z"); // local 05:30, still Aug 1
    const range = getPeriodRange("today", 3 * 60, now);
    expect(range.start?.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(range.end).toBe(now);
  });
});