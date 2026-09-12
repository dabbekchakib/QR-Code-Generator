import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "../utils/relative-time";

const NOW = new Date("2026-08-15T20:30:00.000Z");

function t(path: string, params?: Record<string, string | number>): string {
  return `${path}|${params?.count ?? ""}`;
}

function isoMinutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

describe("formatRelativeTime", () => {
  it("returns an empty string for null, unparseable or future dates", () => {
    expect(formatRelativeTime(null, NOW, t)).toBe("");
    expect(formatRelativeTime("", NOW, t)).toBe("");
    expect(formatRelativeTime("not-a-date", NOW, t)).toBe("");
    expect(formatRelativeTime(new Date(NOW.getTime() + 5 * 60_000).toISOString(), NOW, t)).toBe(
      ""
    );
  });

  it("returns justNow under a minute", () => {
    expect(formatRelativeTime(isoMinutesAgo(0), NOW, t)).toBe("analytics.justNow|");
    expect(formatRelativeTime(isoMinutesAgo(0.5), NOW, t)).toBe("analytics.justNow|");
  });

  it("formats minutes, hours and days", () => {
    expect(formatRelativeTime(isoMinutesAgo(5), NOW, t)).toBe("analytics.minutesAgo|5");
    expect(formatRelativeTime(isoMinutesAgo(60), NOW, t)).toBe("analytics.hoursAgo|1");
    expect(formatRelativeTime(isoMinutesAgo(60 * 24), NOW, t)).toBe("analytics.daysAgo|1");
  });

  it("formats months and years for longer windows", () => {
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 30), NOW, t)).toBe("analytics.monthsAgo|1");
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 90), NOW, t)).toBe("analytics.monthsAgo|3");
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 500), NOW, t)).toBe("analytics.yearsAgo|1");
  });

  it("handles boundary minutes exactly", () => {
    expect(formatRelativeTime(isoMinutesAgo(1), NOW, t)).toBe("analytics.minutesAgo|1");
    expect(formatRelativeTime(isoMinutesAgo(59), NOW, t)).toBe("analytics.minutesAgo|59");
    expect(formatRelativeTime(isoMinutesAgo(60), NOW, t)).toBe("analytics.hoursAgo|1");
  });
});