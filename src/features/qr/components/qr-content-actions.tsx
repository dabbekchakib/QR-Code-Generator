"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { copyToClipboard } from "../lib/qr-clipboard";
import { shareQRCode } from "../lib/qr-share";
import { getCopyLabel } from "../lib/qr-generator";
import type { QRType } from "@/types";
import type { QRCustomization } from "../types";

interface QRContentActionsProps {
  type: QRType;
  content: string;
  customization?: QRCustomization;
  name?: string;
}

export function QRContentActions({ type, content, customization, name }: QRContentActionsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await shareQRCode({ content, name, customization });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? t("detail.copied") : getCopyLabel(type)}
      >
        {copied ? (
          <>
            <Check className="size-4" />
            {t("detail.copied")}
          </>
        ) : (
          <>
            <Copy className="size-4" />
            {getCopyLabel(type)}
          </>
        )}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleShare} aria-label={t("detail.share")}>
        <Share2 className="size-4" />
        {t("detail.share")}
      </Button>
    </>
  );
}