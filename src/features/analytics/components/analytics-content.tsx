"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  CloudOff,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Globe,
  Lock,
  Smartphone,
  Monitor,
  Layers,
  ScanLine,
  Download,
  FileJson,
  FileText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useAuth } from "@/lib/auth/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useToast } from "@/lib/toast-store";
import {
  useAnalyticsSelection,
  useDynamicQRs,
  useQRComparison,
  useQRPerformance,
  useScansExport,
} from "@/features/analytics/hooks/use-analytics";
import { ScanChart } from "@/features/analytics/components/scan-chart";
import { BreakdownCard } from "@/features/analytics/components/breakdown-list";
import { formatCount, averagePerDay } from "@/features/analytics/utils/format";
import { formatRelativeTime } from "@/features/analytics/utils/relative-time";
import {
  parseAnalyticsSelection,
  selectionToUrl,
  selectionDays,
  todayDateInputValue,
  isValidCustomRange,
  toDateInputValue,
} from "@/features/analytics/utils/analytics-filters";
import {
  buildScansCsv,
  buildExportEnvelope,
  buildTextReport,
  downloadTextFile,
  exportFilename,
} from "@/features/analytics/utils/analytics-export";
import type {
  AnalyticsPayload,
  AnalyticsSelection,
  ComparisonRow,
  DynamicQRItem,
  ExportResult,
  PerformanceRow,
  TimeseriesPoint,
} from "@/features/analytics/types";

export function AnalyticsContent() {
  const { t } = useI18n();
  const { status } = useAuth();
  const online = useOnlineStatus();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selection = useMemo(
    () => parseAnalyticsSelection(searchParams, new Date()),
    [searchParams]
  );

  const { items: dynamicQrs, loading: qrsLoading } = useDynamicQRs(
    status === "authenticated" && online
  );

  // /analytics?qr=<id>: validate against the owner's dynamic QR list. Invalid,
  // foreign or static ids are dropped so they never surface someone else's data.
  useEffect(() => {
    if (qrsLoading) return;
    const param = searchParams.get("qr");
    if (param && !dynamicQrs.some((item) => item.id === param)) {
      const clean = parseAnalyticsSelection(searchParams, new Date());
      router.replace(selectionToUrl({ ...clean, qrId: null }));
    }
  }, [searchParams, router, dynamicQrs, qrsLoading]);

  const { payload, loading, error, refresh, lastUpdated } =
    useAnalyticsSelection(selection);
  const perf = useQRPerformance(selection);
  const exportState = useScansExport(selection);

  const selectQr = (value: string) => {
    const next: AnalyticsSelection = { ...selection, qrId: value || null };
    router.replace(selectionToUrl(next));
  };

  const selectPeriod = (value: string) => {
    if (value === "custom") {
      const from =
        selection.custom?.from ?? toDateInputValue(new Date(Date.now() - 29 * 86_400_000));
      const to = selection.custom?.to ?? todayDateInputValue();
      router.replace(selectionToUrl({ ...selection, period: "custom", custom: { from, to } }));
      return;
    }
    router.replace(
      selectionToUrl({ period: value as AnalyticsSelection["period"], qrId: selection.qrId, custom: null })
    );
  };

  const applyCustomRange = (from: string, to: string) => {
    router.replace(selectionToUrl({ period: "custom", qrId: selection.qrId, custom: { from, to } }));
  };

  const noDynamicQrs =
    status === "authenticated" && online && !qrsLoading && dynamicQrs.length === 0;

  if (status === "anonymous") {
    return <AuthPrompt />;
  }

  if (status === "authenticated" && !online) {
    return <OfflineCard />;
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={refresh}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label={t("analytics.qrFilterLabel")}>
          <SelectBox
            value={selection.qrId ?? ""}
            onChange={selectQr}
            options={[
              { value: "", label: t("analytics.allQrCodes") },
              ...dynamicQrs.map((item) => ({ value: item.id, label: item.name })),
            ]}
            disabled={qrsLoading}
          />
        </FilterField>
        <FilterField label={t("analytics.periodLabel")}>
          <SelectBox
            value={selection.period}
            onChange={selectPeriod}
            options={rangeOptions(t)}
          />
        </FilterField>

        {selection.period === "custom" && (
          <CustomRangeFields
            key={`${selection.custom?.from ?? ""}|${selection.custom?.to ?? ""}`}
            from={selection.custom?.from ?? ""}
            to={selection.custom?.to ?? ""}
            onApply={applyCustomRange}
          />
        )}

        {status === "loading" && (
          <div className="text-sm text-muted-foreground">…</div>
        )}
      </div>

      {noDynamicQrs ? (
        <EmptyPanel
          icon={Globe}
          title={t("analytics.noDynamicQrTitle")}
          description={t("analytics.noDynamicQrDesc")}
          actionLabel={t("analytics.noDynamicQrCta")}
          actionHref="/create"
        />
      ) : loading || !payload ? (
        <AnalyticsSkeleton />
      ) : error ? (
        <ErrorCard onRetry={refresh} />
      ) : (
        <div className="space-y-6">
          {payload.summary.total === 0 && (
            <EmptyPanel
              icon={BarChart3}
              title={
                selection.qrId || selection.period !== "all"
                  ? t("analytics.noDataForPeriod")
                  : t("analytics.noScansTitle")
              }
              description={
                selection.qrId || selection.period !== "all"
                  ? t("analytics.noDataForPeriodDesc")
                  : t("analytics.noScansDesc")
              }
              actionHref={selection.qrId === null && selection.period === "all" ? "/dashboard" : undefined}
              actionLabel={selection.qrId === null && selection.period === "all" ? t("analytics.shareQrCta") : undefined}
            />
          )}

          <AnalyticsDashboard
            payload={payload}
            selection={selection}
            performance={perf.rows}
            allDynamicQrs={dynamicQrs}
          />

          <PerformanceTable
            rows={perf.rows}
            loading={perf.loading}
            error={perf.error}
            onRetry={perf.refresh}
          />

          <ComparisonSection qrs={dynamicQrs} selection={selection} />

          <ExportSection
            selection={selection}
            payload={payload}
            exportResult={exportState.result}
            exportLoading={exportState.loading}
            exportError={exportState.error}
            onRetry={exportState.refresh}
          />
        </div>
      )}

      <PrivacyCard />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function AnalyticsHeader({
  lastUpdated,
  loading,
  onRefresh,
}: {
  lastUpdated: string | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useI18n();
  const now = useNow(30_000);
  const updatedLabel = lastUpdated ? renderUpdatedLabel(lastUpdated, now, t) : null;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.analytics")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("analytics.scanDefinition")}
        </p>
        {updatedLabel && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {updatedLabel}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} nativeButton={false} disabled={loading || !lastUpdated}>
        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        {t("analytics.refresh")}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom range fields                                                       */
/* -------------------------------------------------------------------------- */

function renderUpdatedLabel(
  lastUpdated: string,
  now: Date,
  t: (path: string, params?: Record<string, string | number>) => string
): string {
  const at = new Date(lastUpdated);
  if (now.getTime() - at.getTime() < 30_000) return t("analytics.updatedJustNow");
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
  return t("analytics.lastUpdated", { time });
}

function CustomRangeFields({
  from,
  to,
  onApply,
}: {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
}) {
  const { t } = useI18n();
  const [fromDraft, setFromDraft] = useState(from);
  const [toDraft, setToDraft] = useState(to);
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const custom = { from: fromDraft, to: toDraft };
    if (!isValidCustomRange(custom, new Date())) {
      setError(t("analytics.invalidRange"));
      return;
    }
    setError(null);
    onApply(fromDraft, toDraft);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <FilterField label={t("analytics.from")}>
          <input
            type="date"
            aria-label={t("analytics.from")}
            value={fromDraft}
            onChange={(e) => {
              setFromDraft(e.target.value);
              setError(null);
            }}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </FilterField>
        <FilterField label={t("analytics.to")}>
          <input
            type="date"
            aria-label={t("analytics.to")}
            value={toDraft}
            max={todayDateInputValue()}
            onChange={(e) => {
              setToDraft(e.target.value);
              setError(null);
            }}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </FilterField>
        <Button variant="outline" size="sm" onClick={apply} nativeButton={false}>
          {t("analytics.applyRange")}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                 */
/* -------------------------------------------------------------------------- */

function AnalyticsDashboard({
  payload,
  selection,
  performance,
  allDynamicQrs,
}: {
  payload: AnalyticsPayload;
  selection: AnalyticsSelection;
  performance: PerformanceRow[] | null;
  allDynamicQrs: DynamicQRItem[];
}) {
  const { t } = useI18n();
  const { summary, timeseries, topQrs, devices, operatingSystems, browsers } = payload;

  const days = selectionDays(selection);
  const avg = averagePerDay(summary.total, days);

  const kpis: KpiCardProps[] = [
    {
      label: t("analytics.totalScans"),
      value: summary.total,
      icon: ScanLine,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("analytics.today"),
      value: summary.today,
      icon: CalendarDays,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: t("analytics.thisWeek"),
      value: summary.thisWeek,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: t("analytics.thisMonth"),
      value: summary.thisMonth,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: t("analytics.avgPerDay"),
      value: avg,
      icon: BarChart3,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
  ];

  const ranking = useMemo(
    () =>
      (performance ?? []).map((row) => ({ id: row.id, name: row.name, count: row.total })),
    [performance]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <BarChart3 className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">{t("analytics.scansOverTime")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <ScanChart data={timeseries} />
          <ul className="sr-only" aria-label={t("analytics.chartListLabel")}>
            {timeseries.map((point) => (
              <li key={point.bucket}>
                {point.bucket}: {formatCount(point.count)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right text-xs text-muted-foreground">
            {t("analytics.chartTotal")} {formatCount(summary.total)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopQRCard
          items={topQrs}
          allItems={ranking.length > 0 ? ranking : topQrs}
          selection={selection}
        />
        <BreakdownCard
          title={t("analytics.deviceTypes")}
          icon={Smartphone}
          items={devices}
          noDataLabel={t("analytics.noResults")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownCard
          title={t("analytics.operatingSystems")}
          icon={Layers}
          items={operatingSystems}
          noDataLabel={t("analytics.noResults")}
        />
        <BreakdownCard
          title={t("analytics.browsers")}
          icon={Monitor}
          items={browsers}
          noDataLabel={t("analytics.noResults")}
        />
      </div>

      {allDynamicQrs.length > 1 && (
        <p className="text-xs text-muted-foreground">{t("analytics.compareHint")}</p>
      )}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  color: string;
  bg: string;
}

function KpiCard({ label, value, icon: Icon, color, bg }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {value === null ? "—" : formatCount(value)}
            </p>
          </div>
          <div className={`size-11 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`size-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top QR Codes (with "View all")                                            */
/* -------------------------------------------------------------------------- */

function TopQRCard({
  items,
  allItems,
  selection,
}: {
  items: { id: string; name: string; count: number }[];
  allItems: { id: string; name: string; count: number }[];
  selection: AnalyticsSelection;
}) {
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? allItems : items;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">{t("analytics.topQrCodes")}</CardTitle>
        </div>
        {allItems.length > items.length && (
          <Button
            variant="ghost"
            size="sm"
            className="-me-2"
            onClick={() => setShowAll((v) => !v)}
            nativeButton={false}
          >
            {showAll ? t("analytics.showLess") : t("analytics.viewAll")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {displayed.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("analytics.noResults")}</p>
        ) : (
          <ol className="space-y-3">
            {displayed.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={selectionToUrl({ ...selection, qrId: item.id })}
                  className="flex items-center gap-3 group"
                >
                  <span className="w-5 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                    {formatCount(item.count)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  QR Performance table                                                      */
/* -------------------------------------------------------------------------- */

function PerformanceTable({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: PerformanceRow[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const nowRef = useNow(60_000);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Layers className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">{t("analytics.performanceTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {error ? (
          <CardContent className="text-center py-8 space-y-3">
            <AlertCircle className="size-6 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{t("analytics.errorDesc")}</p>
            <Button variant="outline" size="sm" onClick={onRetry} nativeButton={false}>
              {t("analytics.retry")}
            </Button>
          </CardContent>
        ) : loading || !rows ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("analytics.noResults")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">{t("analytics.performanceTitle")}</caption>
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">{t("analytics.perfColumns.qrCode")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("analytics.perfColumns.type")}</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">{t("analytics.perfColumns.totalScans")}</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">{t("analytics.perfColumns.today")}</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">{t("analytics.perfColumns.last7")}</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">{t("analytics.perfColumns.last30")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("analytics.perfColumns.lastScan")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={selectionToUrl({ period: "all", qrId: row.id, custom: null })}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <span className="truncate inline-block max-w-52 align-middle">{row.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t(`qrTypes.${row.type}.name`)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCount(row.total)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCount(row.today)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCount(row.last7)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCount(row.last30)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.lastScannedAt
                        ? formatRelativeTime(row.lastScannedAt, nowRef, (path, params) => t(path, params))
                        : t("analytics.neverScanned")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">{t("analytics.staticNoticeDesc")}</p>
      </div>
    </Card>
  );
}

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* -------------------------------------------------------------------------- */
/*  QR comparison (2..5 codes)                                                */
/* -------------------------------------------------------------------------- */

function ComparisonSection({
  qrs,
  selection,
}: {
  qrs: DynamicQRItem[];
  selection: AnalyticsSelection;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const nowRef = useNow(60_000);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev; // comparison is capped at 5
      return [...prev, id];
    });
  };

  const { rows, loading, error, refresh } = useQRComparison(selected, selection);
  const ready = selected.length >= 2;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <TrendingUp className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">{t("analytics.compareTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <p className="text-xs text-muted-foreground">{t("analytics.compareHint")}</p>

        {qrs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {qrs.map((qr) => {
              const active = selected.includes(qr.id);
              const locked = !active && selected.length >= 5;
              return (
                <button
                  key={qr.id}
                  type="button"
                  aria-pressed={active}
                  disabled={locked}
                  onClick={() => toggle(qr.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50"
                  }`}
                >
                  {active && <Check className="size-3.5 text-primary" />}
                  <span className="max-w-40 truncate">{qr.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {!ready && (
          <p className="text-sm text-muted-foreground">{t("analytics.compareMinHint")}</p>
        )}

        {ready && error && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("analytics.errorDesc")}</p>
            <Button variant="outline" size="sm" onClick={refresh} nativeButton={false}>
              {t("analytics.retry")}
            </Button>
          </div>
        )}

        {ready && loading && !rows && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
        )}

        {ready && rows && rows.length > 0 && (
          <ComparisonTable rows={rows} now={nowRef} t={t} />
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonTable({
  rows,
  now,
  t,
}: {
  rows: ComparisonRow[];
  now: Date;
  t: (path: string, params?: Record<string, string | number>) => string;
}) {
  const grandTotal = rows.reduce((acc, row) => acc + row.total, 0);
  const maxTotal = Math.max(...rows.map((row) => row.total), 1);

  return (
    <div className="space-y-4" dir="ltr">
      <div className="flex items-end gap-2 h-28">
        {rows.map((row) => (
          <div key={row.id} className="flex-1 min-w-0">
            <div
              className="rounded-t-md bg-primary/70 hover:bg-primary transition-colors"
              style={{ height: `${Math.max((row.total / maxTotal) * 100, row.total > 0 ? 4 : 0)}%` }}
              title={`${row.name}: ${formatCount(row.total)}`}
            />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">{t("analytics.perfColumns.qrCode")}</th>
              <th scope="col" className="px-3 py-2 font-medium text-right">{t("analytics.perfColumns.totalScans")}</th>
              <th scope="col" className="px-3 py-2 font-medium text-right">{t("analytics.shareOfTotal")}</th>
              <th scope="col" className="px-3 py-2 font-medium">{t("analytics.perfColumns.lastScan")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-medium text-foreground">
                  <span className="truncate inline-block max-w-52 align-middle">{row.name}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.total)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {grandTotal > 0 ? `${Math.round((row.total / grandTotal) * 100)}%` : "0%"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {row.lastScannedAt
                    ? formatRelativeTime(row.lastScannedAt, now, t)
                    : t("analytics.neverScanned")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

function ExportSection({
  selection,
  payload,
  exportResult,
  exportLoading,
  exportError,
  onRetry,
}: {
  selection: AnalyticsSelection;
  payload: AnalyticsPayload;
  exportResult: ExportResult | null;
  exportLoading: boolean;
  exportError: string | null;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const rows = exportResult?.rows ?? [];
  const total = exportResult?.total ?? 0;
  const disabled = exportLoading || !exportResult || total === 0;

  const notify = (label: string) =>
    showToast({ title: t("analytics.exportToast"), description: label, variant: "success" });

  const doCsv = () => {
    const csv = buildScansCsv(rows, {
      qrName: t("analytics.perfColumns.qrCode"),
      qrType: t("analytics.perfColumns.type"),
      scannedAt: t("analytics.perfColumns.scannedAt"),
      device: t("analytics.deviceTypes"),
      operatingSystem: t("analytics.operatingSystems"),
      browser: t("analytics.browsers"),
    });
    downloadTextFile(exportFilename("csv"), csv, "text/csv");
    notify("CSV");
  };

  const doJson = () => {
    const json = buildExportEnvelope(rows, rangeLabel(t, selection), selection.qrId);
    downloadTextFile(exportFilename("json"), json, "application/json");
    notify("JSON");
  };

  const doReport = () => {
    const report = buildAnalyticsReportData({ payload, selection, t });
    downloadTextFile(exportFilename("report"), report, "text/plain");
    notify(t("analytics.exportReport"));
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Download className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">{t("analytics.exportTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {exportError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{t("analytics.errorDesc")}</p>
            <Button variant="outline" size="sm" onClick={onRetry} nativeButton={false}>
              <RefreshCw className="size-4" />
              {t("analytics.retry")}
            </Button>
          </div>
        ) : exportLoading ? (
          <div className="flex gap-2">
            <div className="h-9 w-32 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-9 w-32 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        ) : exportResult ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={doCsv} nativeButton={false} disabled={disabled}>
                <Download className="size-4" />
                {t("analytics.exportCsv")}
              </Button>
              <Button variant="outline" size="sm" onClick={doJson} nativeButton={false} disabled={disabled}>
                <FileJson className="size-4" />
                {t("analytics.exportJson")}
              </Button>
              <Button variant="outline" size="sm" onClick={doReport} nativeButton={false} disabled={disabled}>
                <FileText className="size-4" />
                {t("analytics.exportReport")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? t("analytics.exportNoData")
                : t("analytics.exportCount", { count: total })}
            </p>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={onRetry} nativeButton={false}>
            <Download className="size-4" />
            {t("analytics.exportLoad")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function buildAnalyticsReportData({
  payload,
  selection,
  t,
}: {
  payload: AnalyticsPayload;
  selection: AnalyticsSelection;
  t: (path: string, params?: Record<string, string | number>) => string;
}): string {
  const { summary, timeseries, topQrs, devices, operatingSystems, browsers } = payload;
  const days = selectionDays(selection);
  const avg = averagePerDay(summary.total, days);

  const meta = [
    `${t("analytics.reportPeriod")}: ${rangeLabel(t, selection)}`,
    `${t("analytics.reportQr")}: ${selection.qrId ? selection.qrId : t("analytics.allQrCodes")}`,
    `${t("analytics.reportGenerated")}: ${new Date().toLocaleString()}`,
  ];

  const summaryItems = [
    { name: t("analytics.totalScans"), value: formatCount(summary.total) },
    { name: t("analytics.today"), value: formatCount(summary.today) },
    { name: t("analytics.thisWeek"), value: formatCount(summary.thisWeek) },
    { name: t("analytics.thisMonth"), value: formatCount(summary.thisMonth) },
    { name: t("analytics.avgPerDay"), value: avg === null ? "—" : formatCount(avg) },
  ];

  const trendItems = timeseries.slice(0, 20).map((point: TimeseriesPoint) => ({
    name: point.bucket,
    value: formatCount(point.count),
  }));

  const sections: { label: string; items: { name: string; value: string }[] }[] = [
    { label: t("analytics.reportSummary"), items: summaryItems },
    { label: t("analytics.scansOverTime"), items: trendItems },
    {
      label: t("analytics.topQrCodes"),
      items: topQrs.map((qr) => ({ name: qr.name, value: formatCount(qr.count) })),
    },
    {
      label: t("analytics.deviceTypes"),
      items: devices.map((d) => ({ name: d.label, value: formatCount(d.count) })),
    },
    {
      label: t("analytics.operatingSystems"),
      items: operatingSystems.map((os) => ({ name: os.label, value: formatCount(os.count) })),
    },
    {
      label: t("analytics.browsers"),
      items: browsers.map((b) => ({ name: b.label, value: formatCount(b.count) })),
    },
  ];

  return buildTextReport(t("analytics.reportTitle"), meta, sections);
}

function rangeLabel(
  t: (path: string) => string,
  selection: AnalyticsSelection
): string {
  if (selection.period === "custom" && selection.custom) {
    return `${t("analytics.customRange")} (${selection.custom.from} → ${selection.custom.to})`;
  }
  if (selection.period === "custom") return t("analytics.periodLast30Days");
  switch (selection.period) {
    case "today":
      return t("analytics.periodToday");
    case "7d":
      return t("analytics.periodLast7Days");
    case "30d":
      return t("analytics.periodLast30Days");
    case "90d":
      return t("analytics.periodLast90Days");
    case "all":
      return t("analytics.periodAllTime");
  }
}

/* -------------------------------------------------------------------------- */
/*  Shared building blocks                                                    */
/* -------------------------------------------------------------------------- */

function rangeOptions(t: (path: string) => string): { value: string; label: string }[] {
  return [
    { value: "today", label: t("analytics.periodToday") },
    { value: "7d", label: t("analytics.periodLast7Days") },
    { value: "30d", label: t("analytics.periodLast30Days") },
    { value: "90d", label: t("analytics.periodLast90Days") },
    { value: "all", label: t("analytics.periodAllTime") },
    { value: "custom", label: t("analytics.customRange") },
  ];
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card>
      <CardContent className="py-14 text-center space-y-3">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Icon className="size-6" />
        </div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
        {actionLabel && actionHref && (
          <Button size="sm" render={<Link href={actionHref} />} nativeButton={false}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function OfflineCard() {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="py-14 text-center space-y-3">
        <CloudOff className="size-8 text-muted-foreground mx-auto" />
        <p className="font-semibold text-foreground">{t("analytics.offlineTitle")}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("analytics.offlineDesc")}
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="py-14 text-center space-y-3">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="font-semibold text-foreground">{t("analytics.errorTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("analytics.errorDesc")}</p>
        <Button size="sm" variant="outline" onClick={onRetry} nativeButton={false}>
          <RefreshCw className="size-4" />
          {t("analytics.retry")}
        </Button>
      </CardContent>
    </Card>
  );
}

function AuthPrompt() {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="py-14 text-center space-y-3">
        <Lock className="size-8 text-muted-foreground mx-auto" />
        <p className="font-semibold text-foreground">{t("analytics.signInTitle")}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("analytics.signInDesc")}
        </p>
        <Button size="sm" render={<Link href="/login" />} nativeButton={false}>
          {t("common.login")}
        </Button>
      </CardContent>
    </Card>
  );
}

function PrivacyCard() {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{t("analytics.privacyTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t("analytics.privacyDesc")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-9 min-w-44 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/60 animate-pulse" />
        ))}
      </div>
      <div className="h-60 rounded-xl bg-muted/60 animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </div>
      <div className="h-64 rounded-xl bg-muted/60 animate-pulse" />
    </div>
  );
}