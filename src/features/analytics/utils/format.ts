/** Shared number/percentage formatting for analytics. Centralized so widgets
 * never show NaN, Infinity or undefined — total 0 always yields 0%. */

export function formatCount(value: number | null | undefined): string {
  const n = Number.isFinite(value) ? (value as number) : 0;
  // Fixed locale keeps separators consistent across app languages (and tests).
  return n.toLocaleString("en-US");
}

/** category / total in %, rounded to 1 decimal. total <= 0 => 0, never NaN. */
export function percent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  const value = (part / total) * 100;
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Centralized percentage helper: total 0 (or non-finite) always yields 0. */
export const calculatePercentage = percent;

/** Total / number of days (real data only). null when not computable. */
export function averagePerDay(
  total: number | null | undefined,
  days: number | null | undefined
): number | null {
  const t = typeof total === "number" ? total : Number(total ?? Number.NaN);
  const d = typeof days === "number" ? days : Number(days ?? Number.NaN);
  if (!Number.isFinite(t) || !Number.isFinite(d) || d <= 0) return null;
  if (t === 0) return null; // no scan data in window -> "—", never a fake figure
  return Math.round((t / d) * 10) / 10;
}

/** Safe integer coercion used when mapping raw RPC rows. */
export function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}