"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQRs } from "@/features/qr/hooks/use-qrs";
import { useQRPreviewDataUrl, useQRTypeName } from "@/features/qr/hooks/use-qr-preview";
import { useQRContent } from "@/features/qr/hooks/use-qr-preview";
import { useQRPublication } from "@/features/qr/hooks/use-qr-publication";
import { getDynamicQRUrlWithFallback } from "@/features/qr/dynamic";
import { ShareQRButton } from "@/features/sharing/components/share-qr-button";
import {
  QrCode,
  ScanLine,
  ArrowRight,
  Star,
  Globe,
  CalendarDays,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { formatUpdatedAt } from "@/features/qr/storage";
import { useScanSummary } from "@/features/analytics/hooks/use-analytics";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { QuickCreate } from "@/features/templates/components/quick-create";

function RecentQRCard({ id }: { id: string }) {
  const { records } = useQRs();
  const { t } = useI18n();
  const record = records.find((r) => r.id === id);

  const content = useQRContent(record ?? null);
  const preview = useQRPreviewDataUrl(content, record?.customization ?? null);
  const typeName = useQRTypeName(record?.type ?? null);
  const publication = useQRPublication(record ?? null);

  if (!record) return null;

  const permanentUrl =
    record.isDynamic && record.shortCode
      ? getDynamicQRUrlWithFallback(record.shortCode)
      : "";

  return (
    <div className="group relative">
      <Link href={`/qrs/${record.id}`} className="block">
        <Card className="h-full transition-colors group-hover:border-primary/40">
          <CardContent className="p-4 pr-12">
            <div className="flex items-start gap-3">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={record.name}
                  className="size-12 rounded-lg border bg-white shrink-0"
                />
              ) : (
                <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <QrCode className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {record.name}
                  </p>
                  {record.favorite && (
                    <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {typeName} • {formatUpdatedAt(record.updatedAt)}
                </p>
                <Badge variant="secondary" className="mt-1.5 text-[10px]">
                  {record.isDynamic
                    ? t("library.status.dynamic")
                    : t("library.status.static")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <ShareQRButton
        iconOnly
        size="icon-sm"
        variant="ghost"
        className="absolute top-3 end-1.5"
        target={{
          name: record.name,
          isDynamic: record.isDynamic,
          content,
          customization: record.customization,
          type: record.type,
          permanentUrl,
          published: Boolean(publication?.published),
          description: typeName,
        }}
        ariaLabel={t("share.share")}
      />
    </div>
  );
}

export function DashboardContent() {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const { records, loading } = useQRs();
  const { summary } = useScanSummary();

  // Scanning numbers are real server data only: unavailable (offline, not
  // signed in, or still loading) is rendered as "—", never a placeholder.
  const scansAvailable = online && summary != null;
  const scansTotal = scansAvailable ? summary.total.toLocaleString() : "—";
  const scansToday = scansAvailable ? summary.today.toLocaleString() : "—";

  const recent = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [records]
  );

  const statCards = [
    {
      title: t("dashboard.totalQRCodes"),
      value: loading ? "..." : records.length.toLocaleString(),
      valueLabel: t("dashboard.yourQRCodes"),
      icon: QrCode,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("dashboard.totalDynamic"),
      value: loading
        ? "..."
        : records.filter((r) => r.isDynamic).length.toLocaleString(),
      valueLabel: t("library.status.dynamic"),
      icon: Globe,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: t("dashboard.totalScans"),
      value: scansTotal,
      valueLabel: t("analytics.scanDefinition"),
      icon: ScanLine,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      href: "/analytics",
    },
    {
      title: t("dashboard.scansToday"),
      value: scansToday,
      valueLabel: t("analytics.today"),
      icon: CalendarDays,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      href: "/analytics?range=today",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("nav.dashboard")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.yourQRCodes")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const card = (
            <Card
              className={stat.href ? "h-full transition-colors group-hover:border-primary/40" : undefined}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.valueLabel}
                    </p>
                  </div>
                  <div
                    className={`size-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`size-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          return stat.href ? (
            <Link
              key={stat.title}
              href={stat.href}
              className="group block"
              aria-label={`${stat.title}: ${stat.value}`}
            >
              {card}
            </Link>
          ) : (
            <div key={stat.title}>{card}</div>
          );
        })}
      </div>

      {/* Quick create from a template */}
      <QuickCreate />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dynamic QR summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              {t("features.dynamicTitle")}
            </CardTitle>
            <Button size="sm" render={<Link href="/create" />} nativeButton={false}>
              {t("create.dynamicOption")}
              <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "..." : records.filter((r) => !r.isDynamic).length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalStatic")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "..." : records.filter((r) => r.isDynamic).length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalDynamic")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading
                    ? "..."
                    : records.filter((r) => r.isDynamic && r.status === "active").length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.activeDynamic")}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground min-w-0">
                <ScanLine className="size-3.5 mt-0.5 shrink-0" />
                <p className="truncate">{t("dashboard.analyticsHint")}</p>
              </div>
              <Link
                href="/analytics"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                {t("dashboard.openAnalytics")}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent QR Codes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {t("dashboard.recentQRCodes")}
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/qrs" />} nativeButton={false}>
              {t("dashboard.viewAll")}
              <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                ...
              </p>
            ) : recent.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.noQRCodes")}
                </p>
                <Button size="sm" render={<Link href="/create" />} nativeButton={false}>
                  {t("common.createQR")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.slice(0, 5).map((r) => (
                  <RecentQRCard key={r.id} id={r.id} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}