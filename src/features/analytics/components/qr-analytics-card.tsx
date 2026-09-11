"use client";

import Link from "next/link";
import { BarChart3, ChevronRight, CloudOff, ScanLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useSyncStore } from "@/features/qr/sync/sync-store";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { formatCount } from "@/features/analytics/utils/format";

/**
 * Compact scan summary shown on the QR detail page for dynamic QR codes. One
 * request always counts as one scan; the summary reflects only real, stored
 * data (never placeholder figures).
 */
export function QRAnalyticsCard({ qrId }: { qrId: string }) {
  const { t } = useI18n();
  const online = useSyncStore((s) => s.online);
  const { payload, loading, error } = useAnalytics(qrId, "all");

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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{t("analytics.scansOverTime")}</h2>
        </div>

        {loading || !payload ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryStat label={t("analytics.totalScans")} value={payload.summary.total} />
              <SummaryStat label={t("analytics.today")} value={payload.summary.today} />
            </div>
            {payload.summary.total === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">{t("analytics.noScansDesc")}</p>
            )}
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-4 -mx-2"
          render={<Link href={`/analytics?qr=${qrId}`} />}
          nativeButton={false}
        >
          {t("analytics.viewFullAnalytics")}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
        <ScanLine className="size-4 inline-block mr-1.5 align-[-2px] text-primary opacity-70" />
        {formatCount(value)}
      </p>
    </div>
  );
}