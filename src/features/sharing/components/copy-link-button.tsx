"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { copyToClipboard } from "../lib/index";

interface CopyLinkButtonProps {
  /** The exact value to copy (permanent public URL, encoded content…). */
  value: string;
  /** Accessible name for the button (defaults to `share.copy`). */
  label?: string;
  /** Optional visible text shown next to the icon (undefined = icon only). */
  showLabel?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "icon-sm" | "default";
  className?: string;
}

export function CopyLinkButton({
  value,
  label,
  showLabel,
  variant = "ghost",
  size = "sm",
  className,
}: CopyLinkButtonProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const handleCopy = async () => {
    const result = await copyToClipboard(value);
    if (!result.success) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  const visibleLabel = copied ? t("share.copied") : (showLabel ?? "");

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
      aria-label={label ?? t("share.copy")}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {visibleLabel ? <span>{visibleLabel}</span> : null}
    </Button>
  );
}