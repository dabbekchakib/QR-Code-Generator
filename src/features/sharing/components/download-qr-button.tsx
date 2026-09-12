"use client";

import { useState } from "react";
import { Image as ImageIcon, FileCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import { downloadPNG, downloadSVG } from "../lib/index";
import type { ShareTarget } from "../types";

interface DownloadQRButtonProps {
  target: Pick<ShareTarget, "content" | "customization" | "type" | "name">;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon-sm";
  /** Icon-only buttons (used in tight rows/menus). */
  iconOnly?: boolean;
}

export function DownloadQRButton({
  target,
  variant = "outline",
  size = "sm",
  iconOnly = false,
}: DownloadQRButtonProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);

  const handlePNG = async () => {
    setDownloading("png");
    try {
      await downloadPNG(
        target.content,
        target.type ?? "text",
        target.customization,
        target.name
      );
      showToast({ title: t("share.toastPNG"), variant: "success" });
    } finally {
      setDownloading(null);
    }
  };

  const handleSVG = async () => {
    setDownloading("svg");
    try {
      await downloadSVG(
        target.content,
        target.type ?? "text",
        target.customization,
        target.name
      );
      showToast({ title: t("share.toastSVG"), variant: "success" });
    } finally {
      setDownloading(null);
    }
  };

  const busy = downloading !== null;

  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handlePNG}
        disabled={busy}
        aria-label={t("share.downloadPng")}
      >
        {downloading === "png" ? (
          <Download className="size-4 animate-pulse" />
        ) : (
          <ImageIcon className="size-4" />
        )}
        {!iconOnly ? <span>{t("share.downloadPng")}</span> : null}
      </Button>
      <Button
        variant={variant}
        size={size}
        onClick={handleSVG}
        disabled={busy}
        aria-label={t("share.downloadSvg")}
      >
        {downloading === "svg" ? (
          <Download className="size-4 animate-pulse" />
        ) : (
          <FileCode className="size-4" />
        )}
        {!iconOnly ? <span>{t("share.downloadSvg")}</span> : null}
      </Button>
    </div>
  );
}