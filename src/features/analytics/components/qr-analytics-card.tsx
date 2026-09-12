"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronRight, CloudOff, ScanLine, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useSyncStore } from "@/features/qr/sync/sync-store";
import { useQRPerformance } from "@/features/analytics/hooks/use-analytics";
import { formatCount } from "@/features/analytics/utils/format";
import { formatRelativeTime } from "@/features/analytics/utils/relative-time";
import { selectionToUrl } from "@/features/analytics/utils/analytics-filters";

/**
 * Compact scan summary shown on the QR detail page for dynamic QR codes.
 * Comes from the same owned-row performance RPC as the full analytics page
 * (real stored data only — never placeholder figures).
 */
export function QRAnalyticsCard({ qrId }: { qrId: string }) {
  const { t } = useI18n();
  const online = useSyncStore((s) => s.online);
  const { rows, loading, error } = useQRPerformance({
    period: "all",
    qrId,
    custom: null,
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!online) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <CloudOff className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">{t("analytics.offlineDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <BarChart3 className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">{t("analytics.errorDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  const row = rows?.find((item) => item.id === qrId) ?? null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{t("analytics.scanSummary")}</h2>
        </div>

        {loading || !row ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryStat label={t("analytics.totalScans")} value={formatCount(row.total)} />
              <SummaryStat label={t("analytics.today")} value={formatCount(row.today)} />
              <SummaryStat label={t("analytics.last7")} value={formatCount(row.last7)} />
              <SummaryStat label={t("analytics.last30")} value={formatCount(row.last30)} />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              {row.lastScannedAt
                ? formatRelativeTime(row.lastScannedAt, now, t)
                : t("analytics.neverScanned")}
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-4 -mx-2"
          render={<Link href={selectionToUrl({ period: "all", qrId, custom: null })} />}
          nativeButton={false}
        >
          {t("analytics.viewFullAnalytics")}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
        <ScanLine className="size-4 inline-block me-1.5 align-[-2px] text-primary opacity-70" />
        {value}
      </p>
    </div>
  );
}