"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { copyToClipboard } from "../lib/qr-clipboard";
import { getCopyLabel } from "../lib/qr-generator";
import { ShareQRButton } from "@/features/sharing/components/share-qr-button";
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
    const result = await copyToClipboard(content);
    if (!result.success) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <ShareQRButton
        target={{
          name: name ?? getCopyLabel(type),
          isDynamic: false,
          content,
          customization,
          type,
        }}
      />
    </>
  );
}