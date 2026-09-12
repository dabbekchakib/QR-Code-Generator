/** Relative time localization used for "Last scan" (never a fake timestamp). */

export type RelativeTimeTranslator = (
  path: string,
  params?: Record<string, string | number>
) => string;

/** Human "X minutes ago" from a UTC ISO timestamp. Empty when not parseable
 *  or when the date is in the future. Callers render "Never scanned" when the
 *  input is null. */
export function formatRelativeTime(
  iso: string | null,
  now: Date,
  t: RelativeTimeTranslator
): string {
  if (!iso) return "";
  const at = new Date(iso);
  const diffMs = now.getTime() - at.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return t("analytics.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("analytics.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("analytics.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("analytics.daysAgo", { count: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t("analytics.monthsAgo", { count: months });
  return t("analytics.yearsAgo", { count: Math.floor(days / 365) });
}