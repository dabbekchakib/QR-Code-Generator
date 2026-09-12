import {
  ANALYTICS_PERIODS,
  type AnalyticsPeriod,
  type AnalyticsRangeKey,
  type AnalyticsSelection,
  type CustomRange,
  type PeriodRange,
} from "../types";
import { getPeriodRange } from "./periods";

/**
 * Time-zone + custom range handling for the analytics dashboard.
 *
 * Convention (documented in README):
 *   - Scanned timestamps are stored in UTC (`timestamptz`).
 *   - `offsetMinutes = -new Date().getTimezoneOffset()` is passed to every RPC
 *     so day boundaries and bucket labels are computed in the user's timezone.
 *   - Weeks always start on Monday (Postgres `date_trunc('week')`) for every
 *     locale — the backend behaviour is deterministic.
 *   - Custom ranges are LOCAL calendar dates ("YYYY-MM-DD"); `from` maps to the
 *     user's local midnight, `to` to the following local midnight (exclusive).
 */

export function localOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local "YYYY-MM-DD" of a Date.
 *  `getTimezoneOffset()` is not used: the date's own local fields are read. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayDateInputValue(now: Date = new Date()): string {
  return toDateInputValue(now);
}

/** Parse "YYYY-MM-DD" as a LOCAL calendar date. null when malformed. */
export function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/** Number of calendar days between two local dates (inclusive), or null. */
export function daysBetweenLocal(from: string, to: string, now: Date = new Date()): number | null {
  if (!isValidCustomRange({ from, to }, now)) return null;
  const f = parseLocalDate(from) as Date;
  const t = parseLocalDate(to) as Date;
  return Math.round((t.getTime() - f.getTime()) / 86_400_000) + 1;
}

/**
 * A custom range is valid when both dates are real local dates, from <= to,
 * the end is not in the future, and the span does not exceed maxDays.
 */
export function isValidCustomRange(
  range: CustomRange,
  now: Date = new Date(),
  maxDays = 365
): boolean {
  const from = parseLocalDate(range.from);
  const to = parseLocalDate(range.to);
  if (!from || !to) return false;
  if (from.getTime() > to.getTime()) return false;
  // Reject only when `to` is a future calendar date (tomorrow or later).
  // Ranges ending today are allowed: the window [from 00:00, to+1 00:00)
  // simply contains no rows beyond the present instant yet.
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (to.getTime() > todayStart) return false;
  const days = daysBetweenLocalChecked(from, to);
  return days <= maxDays;
}

function daysBetweenLocalChecked(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

/** Custom range -> inclusive start (local midnight) / exclusive end (midnight+1). */
export function customToRange(range: CustomRange): PeriodRange {
  const from = parseLocalDate(range.from);
  const to = parseLocalDate(range.to);
  if (!from || !to) return { start: null, end: null };
  return {
    start: new Date(from.getFullYear(), from.getMonth(), from.getDate()),
    end: new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1),
  };
}

/** Full (period or custom) selection -> RPC window. Invalid custom -> 30d. */
export function selectionToRange(
  selection: AnalyticsSelection,
  offsetMinutes: number,
  now: Date = new Date()
): PeriodRange {
  if (
    selection.period === "custom" &&
    selection.custom &&
    isValidCustomRange(selection.custom, now)
  ) {
    return customToRange(selection.custom);
  }
  const period: AnalyticsPeriod =
    selection.period === "custom" ? "30d" : selection.period;
  return getPeriodRange(period, offsetMinutes, now);
}

/** Number of calendar days covered by a selection (null = all time). */
export function selectionDays(
  selection: AnalyticsSelection,
  now: Date = new Date()
): number | null {
  if (selection.period === "custom") {
    return selection.custom
      ? daysBetweenLocal(selection.custom.from, selection.custom.to, now)
      : 30;
  }
  return daysForRangeKey(selection.period);
}

function daysForRangeKey(period: AnalyticsRangeKey): number | null {
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
    case "custom":
      return null; // handled by caller
  }
}

/* ------------------------------------------------------------------------- */
/* URL filter state                                                          */
/* ------------------------------------------------------------------------- */

/** Parse `range`/`qr`/`from`/`to`. Any value not understood falls back to
 *  the safe default ("30d", no QR). Never trusted blindly. */
export function parseAnalyticsSelection(
  searchParams: URLSearchParams,
  now: Date = new Date()
): AnalyticsSelection {
  const raw = searchParams.get("range");
  const qrId = searchParams.get("qr");
  if (isAnalyticsPeriod(raw)) {
    return { period: raw as AnalyticsPeriod, qrId, custom: null };
  }
  if (raw === "custom") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const custom = from && to ? { from, to } : null;
    if (custom && isValidCustomRange(custom, now)) {
      return { period: "custom", qrId, custom };
    }
  }
  return { period: "30d", qrId, custom: null };
}

/** Serialize a selection back to the /analytics URL (source of truth = URL). */
export function selectionToUrl(selection: AnalyticsSelection): string {
  const params = new URLSearchParams();
  if (selection.period === "custom" && selection.custom) {
    params.set("range", "custom");
    params.set("from", selection.custom.from);
    params.set("to", selection.custom.to);
  } else {
    params.set("range", selection.period);
  }
  if (selection.qrId) params.set("qr", selection.qrId);
  const qs = params.toString();
  return qs ? `/analytics?${qs}` : "/analytics";
}

function isAnalyticsPeriod(value: string | null): boolean {
  return (ANALYTICS_PERIODS as readonly string[]).includes(value ?? "");
}