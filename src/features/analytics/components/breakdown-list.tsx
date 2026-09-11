import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount, percent } from "@/features/analytics/utils/format";
import type { BreakdownItem } from "@/features/analytics/types";
import { useI18n } from "@/i18n/provider";

/**
 * Categorical breakdown (devices / OS / browsers) as an accessible list: volume,
 * percentage and a proportional bar. Text stays the primary representation so the
 * data is never chart-only.
 */
export function BreakdownCard({
  title,
  icon: Icon,
  items,
  noDataLabel,
}: {
  title: string;
  icon: LucideIcon;
  items: BreakdownItem[];
  noDataLabel: string;
}) {
  const { t } = useI18n();
  const total = items.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 py-4">
        <Icon className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{noDataLabel}</p>
        ) : (
          items.map((item) => {
            const pct = percent(item.count, total);
            return (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground truncate">
                    {translateLabel(item.label, t)}
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {pct.toLocaleString()}% · {formatCount(item.count)}
                  </span>
                </div>
                <div
                  className="mt-1 h-1.5 w-full rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.label}: ${pct}%`}
                >
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function translateLabel(label: string, t: (path: string) => string): string {
  switch (label) {
    case "mobile":
      return t("analytics.mobile");
    case "tablet":
      return t("analytics.tablet");
    case "desktop":
      return t("analytics.desktop");
    case "Other":
      return t("analytics.other");
    case "Unknown":
      return t("analytics.unknown");
    default:
      return label; // iOS, Android, Chrome, Safari... are language-neutral
  }
}