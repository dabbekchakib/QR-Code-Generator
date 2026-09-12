"use client";

import { useState } from "react";
import { Share2, Copy, ExternalLink, Image as ImageIcon, FileCode } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import {
  canShareNative,
  getShareText,
  shareQRCode,
  downloadPNG,
  downloadSVG,
  copyToClipboard,
  parseSafeUrl,
} from "../lib/index";
import { ShareQRDialog } from "./share-qr-dialog";
import type { ShareTarget } from "../types";

interface ShareActionsProps {
  target: ShareTarget;
  /** Show the "Open public URL" item even when the record is unpublished
   *  (disabled) — used when the caller shows publication status separately. */
  keepOpenItem?: boolean;
  align?: "start" | "end";
}

/**
 * Compact "Share" menu for cards/rows: native share (or fallback dialog),
 * copy/open of the public link and PNG/SVG downloads.
 */
export function ShareActions({ target, keepOpenItem = false, align = "end" }: ShareActionsProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const shareValue = getShareText(target);
  const safePublicUrl = target.isDynamic ? parseSafeUrl(target.permanentUrl) : null;
  const safeContent = !target.isDynamic ? parseSafeUrl(target.content) : null;
  const openHref = target.isDynamic
    ? safePublicUrl?.ok && (keepOpenItem || target.published)
      ? safePublicUrl.url
      : null
    : safeContent?.ok
      ? safeContent.url
      : null;

  const handleShare = async () => {
    if (!canShareNative()) {
      setDialogOpen(true);
      return;
    }
    const result = await shareQRCode({
      content: shareValue,
      name: target.name,
      customization: target.customization ?? undefined,
    });
    if (result === "shared") {
      showToast({ title: t("share.toastQRShared"), variant: "success" });
    } else if (result === "failed") {
      setDialogOpen(true);
    }
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(shareValue);
    if (result.success) {
      showToast({ title: t("share.toastCopied"), variant: "success" });
    } else {
      showToast({ title: t("share.clipboardUnavailable"), variant: "error" });
    }
  };

  const handleDownloadPNG = async () => {
    await downloadPNG(target.content, target.type ?? "text", target.customization, target.name);
    showToast({ title: t("share.toastPNG"), variant: "success" });
  };

  const handleDownloadSVG = async () => {
    await downloadSVG(target.content, target.type ?? "text", target.customization, target.name);
    showToast({ title: t("share.toastSVG"), variant: "success" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={t("share.actions")} />
          }
        >
          <Share2 className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          <DropdownMenuLabel>{target.name}</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="size-4" />
            {t("share.share")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="size-4" />
            {t("share.copy")}
          </DropdownMenuItem>
          {openHref ? (
            <DropdownMenuItem
              render={
                <a
                  href={openHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("share.open")}
                />
              }
            >
              <ExternalLink className="size-4" />
              {t("share.open")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadPNG}>
            <ImageIcon className="size-4" />
            {t("share.downloadPng")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadSVG}>
            <FileCode className="size-4" />
            {t("share.downloadSvg")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShareQRDialog open={dialogOpen} onOpenChange={setDialogOpen} target={target} />
    </>
  );
}