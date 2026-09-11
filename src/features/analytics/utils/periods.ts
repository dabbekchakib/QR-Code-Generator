import { ANALYTICS_PERIODS, type AnalyticsPeriod, type PeriodRange } from "../types";

/** Number of calendar days covered by each period (null = all time). */
export function daysForPeriod(period: AnalyticsPeriod): number | null {
  switch (period) {
    case "today":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return null;
  }
}

export function isAnalyticsPeriod(value: string | null): value is AnalyticsPeriod {
  return (ANALYTICS_PERIODS as readonly string[]).includes(value ?? "");
}

/**
 * Calendar-aligned period window in the caller's local timezone.
 *
 * Supabase stores timestamps in UTC, so "today" / "last N days" must start at
 * the user's midnight, not at 00:00 UTC. The offset in minutes (JavaScript
 * getTimezoneOffset() rounds the wrong way) is passed explicitly:
 * `offsetMinutes = -new Date().getTimezoneOffset()`.
 */
export function getPeriodRange(
  period: AnalyticsPeriod,
  offsetMinutes: number,
  now: Date = new Date()
): PeriodRange {
  if (period === "all") return { start: null, end: null };

  const days = daysForPeriod(period) ?? 1;
  // Shift the clock so its UTC fields encode the local wall-clock time, then
  // snap to local midnight and shift back to real UTC.
  const wall = new Date(now.getTime() + offsetMinutes * 60_000);
  const wallMidnightUtc = Date.UTC(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate()
  );
  const start = new Date(
    wallMidnightUtc - offsetMinutes * 60_000 - (days - 1) * 86_400_000
  );
  return { start, end: now };
}