"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import { canShareNative, getShareText, shareQRCode } from "../lib/index";
import { ShareQRDialog } from "./share-qr-dialog";
import type { ShareTarget } from "../types";

interface ShareQRButtonProps {
  target: ShareTarget;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "icon-sm" | "default";
  className?: string;
  /** Icon-only rendering (aria-label only). */
  iconOnly?: boolean;
  /** Overrides the default `share.share` accessible label. */
  ariaLabel?: string;
}

/**
 * "Share" action: uses the Web Share API when the device supports it (PNG file,
 * then text), and falls back to the ShareQRDialog otherwise. The share flow
 * never ends on a technical dead end — the dialog always offers copy/open/download.
 */
export function ShareQRButton({
  target,
  variant = "ghost",
  size = "sm",
  className,
  iconOnly = false,
  ariaLabel,
}: ShareQRButtonProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleShare = async () => {
    if (!canShareNative()) {
      setDialogOpen(true);
      return;
    }
    const result = await shareQRCode({
      content: getShareText(target),
      name: target.name,
      customization: target.customization ?? undefined,
    });
    if (result === "shared") {
      showToast({ title: t("share.toastQRShared"), variant: "success" });
    } else if (result === "failed") {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleShare}
        aria-label={ariaLabel ?? t("share.share")}
      >
        <Share2 className="size-4" />
        {!iconOnly ? <span>{t("share.share")}</span> : null}
      </Button>
      <ShareQRDialog open={dialogOpen} onOpenChange={setDialogOpen} target={target} />
    </>
  );
}