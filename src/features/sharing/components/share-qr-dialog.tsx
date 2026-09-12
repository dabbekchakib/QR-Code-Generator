"use client";

import { ExternalLink, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import { useQRPreviewDataUrl } from "@/features/qr/hooks/use-qr-preview";
import { canShareNative, isSafeUrl, getShareText, shareQRCode } from "../lib/index";
import { CopyLinkButton } from "./copy-link-button";
import { DownloadQRButton } from "./download-qr-button";
import type { ShareTarget } from "../types";

interface ShareQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ShareTarget;
}

/**
 * Fallback share UI when the Web Share API is not available (or failed): the
 * user can copy the public link / encoded content, open it in a new tab and
 * download PNG or SVG instead of getting a dead end.
 */
export function ShareQRDialog({ open, onOpenChange, target }: ShareQRDialogProps) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const shareValue = getShareText(target);
  const preview = useQRPreviewDataUrl(target.content, target.customization ?? null);
  const canOpen = target.isDynamic
    ? Boolean(target.published && isSafeUrl(target.permanentUrl))
    : isSafeUrl(target.content);
  const openHref = canOpen
    ? target.isDynamic
      ? target.permanentUrl!
      : target.content
    : null;

  const handleNativeShare = async () => {
    const result = await shareQRCode({
      content: shareValue,
      name: target.name,
      customization: target.customization ?? undefined,
    });
    if (result === "shared") {
      showToast({ title: t("share.toastQRShared"), variant: "success" });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>
            {target.name}
            {target.description ? ` — ${target.description}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center rounded-lg border bg-white p-3">
          {/* The QR graphic itself is direction-neutral content. */}
          <div dir="ltr">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={t("share.previewAlt")}
                className="size-40 rounded object-contain"
              />
            ) : (
              <div className="flex size-40 items-center justify-center text-xs text-muted-foreground">
                …
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {target.isDynamic ? t("share.publicUrlLabel") : t("share.encodedUrlLabel")}
          </p>
          <div className="flex items-center gap-2">
            <p
              dir="ltr"
              className="min-w-0 flex-1 truncate text-right text-sm"
              title={shareValue}
            >
              {shareValue}
            </p>
            <CopyLinkButton value={shareValue} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {openHref ? (
            <Button
              variant="outline"
              size="sm"
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
            </Button>
          ) : null}
          {canShareNative() ? (
            <Button variant="outline" size="sm" onClick={handleNativeShare}>
              <Share2 className="size-4" />
              {t("share.nativeShare")}
            </Button>
          ) : null}
        </div>

        <DialogFooter>
          <DownloadQRButton
            target={{
              content: target.content,
              customization: target.customization,
              type: target.type,
              name: target.name,
            }}
            size="sm"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}