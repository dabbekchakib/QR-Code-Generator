"use client";

import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";
import { useQRs } from "@/features/qr/hooks/use-qrs";
import { useQRPreviewDataUrl, useQRContent, useQRTypeName } from "@/features/qr/hooks/use-qr-preview";
import { formatUpdatedAt } from "@/features/qr/storage/utils";
import type { QRCodeRecord } from "@/features/qr/storage/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";

function RecentQRCard({ record }: { record: QRCodeRecord }) {
  const content = useQRContent(record);
  const preview = useQRPreviewDataUrl(content, record.customization ?? null);
  const typeName = useQRTypeName(record.type);

  return (
    <Link href={`/qrs/${record.id}`} className="block group">
      <Card className="h-full transition-all hover:border-primary/40">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={record.name}
                decoding="async"
                loading="lazy"
                className="size-12 rounded-lg border bg-white shrink-0"
              />
            ) : (
              <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <QrCode className="size-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-start">
              <p className="text-sm font-medium text-foreground truncate">
                {record.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {typeName} • {formatUpdatedAt(record.updatedAt)}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function HomeRecentQRs() {
  const { records, loading } = useQRs();
  const { t } = useI18n();

  if (loading || records.length === 0) return null;

  const recent = [...records]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3);

  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("home.recentTitle")}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t("home.recentSubtitle")}
            </p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/qrs" />} nativeButton={false}>
            {t("home.myQRCodes")}
            <ArrowRight className="size-3" />
          </Button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {recent.map((r) => (
            <RecentQRCard key={r.id} record={r} />
          ))}
        </div>
      </div>
    </section>
  );
}