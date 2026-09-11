"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock,
  TrendingUp,
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
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useAuth } from "@/lib/auth/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAnalytics, useDynamicQRs } from "@/features/analytics/hooks/use-analytics";
import { ScanChart } from "@/features/analytics/components/scan-chart";
import { BreakdownCard } from "@/features/analytics/components/breakdown-list";
import { formatCount } from "@/features/analytics/utils/format";
import {
  ANALYTICS_PERIODS,
  type AnalyticsPeriod,
  type AnalyticsPayload,
} from "@/features/analytics/types";

export function AnalyticsContent() {
  const { t } = useI18n();
  const { status } = useAuth();
  const online = useOnlineStatus();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [qrId, setQrId] = useState<string | null>(null);
  const [qrInitDone, setQrInitDone] = useState(false);

  const { items: dynamicQrs, loading: qrsLoading } = useDynamicQRs(
    status === "authenticated" && online
  );

  // /analytics?qr=<id>: validate against the owner's dynamic QR list. Invalid,
  // foreign or static ids are dropped so they never surface someone else's data.
  useEffect(() => {
    if (qrInitDone || qrsLoading) return;
    const id = setTimeout(() => {
      const param = searchParams.get("qr");
      if (param) {
        if (dynamicQrs.some((item) => item.id === param)) setQrId(param);
        else router.replace("/analytics");
      }
      setQrInitDone(true);
    }, 0);
    return () => clearTimeout(id);
  }, [searchParams, router, dynamicQrs, qrInitDone, qrsLoading]);

  const { payload, loading, error, refresh } = useAnalytics(qrId, period);

  const selectQr = (value: string) => {
    const next = value || null;
    setQrId(next);
    router.replace(next ? `/analytics?qr=${next}` : "/analytics");
  };

  const noDynamicQrs = status === "authenticated" && online && !qrsLoading && dynamicQrs.length === 0;

  if (status === "anonymous") {
    return <AuthPrompt />;
  }

  if (status === "authenticated" && !online) {
    return <OfflineCard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("nav.analytics")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("analytics.scanDefinition")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label={t("analytics.qrFilterLabel")}>
          <SelectBox
            value={qrId ?? ""}
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
            value={period}
            onChange={(value) => setPeriod(value as AnalyticsPeriod)}
            options={ANALYTICS_PERIODS.map((p) => ({ value: p, label: periodLabel(t, p) }))}
          />
        </FilterField>
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
      ) : payload.summary.total === 0 ? (
        <EmptyPanel
          icon={BarChart3}
          title={
            qrId || period !== "all"
              ? t("analytics.noDataForPeriod")
              : t("analytics.noScansTitle")
          }
          description={
            qrId || period !== "all"
              ? t("analytics.noDataForPeriodDesc")
              : t("analytics.noScansDesc")
          }
        />
      ) : (
        <AnalyticsDashboard payload={payload} />
      )}

      <PrivacyCard />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub sections                                                               */
/* -------------------------------------------------------------------------- */

function AnalyticsDashboard({ payload }: { payload: AnalyticsPayload }) {
  const { t } = useI18n();
  const { summary, timeseries, topQrs, devices, operatingSystems, browsers } = payload;

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
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="mt-2 text-right text-xs text-muted-foreground">
            {t("analytics.chartTotal")} {formatCount(summary.total)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopQRCard items={topQrs} />
        <BreakdownCard
          title={t("analytics.operatingSystems")}
          icon={Layers}
          items={operatingSystems}
          noDataLabel={t("analytics.noResults")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownCard
          title={t("analytics.deviceTypes")}
          icon={Smartphone}
          items={devices}
          noDataLabel={t("analytics.noResults")}
        />
        <BreakdownCard
          title={t("analytics.browsers")}
          icon={Monitor}
          items={browsers}
          noDataLabel={t("analytics.noResults")}
        />
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
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
              {formatCount(value)}
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

function TopQRCard({ items }: { items: { id: string; name: string; count: number }[] }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 py-4">
        <BarChart3 className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">{t("analytics.topQrCodes")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("analytics.noResults")}</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={`/analytics?qr=${item.id}`}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
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
    </div>
  );
}

function periodLabel(t: (path: string) => string, period: AnalyticsPeriod): string {
  switch (period) {
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