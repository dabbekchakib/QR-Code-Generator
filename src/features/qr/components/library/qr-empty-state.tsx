"use client";

import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import Link from "next/link";

export function QREmptyState() {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-12 flex flex-col items-center text-center gap-4">
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <QrCode className="size-8" />
      </div>
      <div>
        <p className="font-semibold text-foreground">
          {t("library.empty.title")}
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {t("library.empty.description")}
        </p>
      </div>
      <Button render={<Link href="/create" />} nativeButton={false}>
        <QrCode className="size-4" />
        {t("common.createQR")}
      </Button>
    </div>
  );
}