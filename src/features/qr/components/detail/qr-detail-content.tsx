"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon, FileCode, Copy, Check, Pencil, CopyPlus, Trash2, Star, Share2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { qrService } from "@/features/qr/service/qr-service";
import type { QRCodeRecord } from "@/features/qr/storage";
import { useQRContent, useQRPreviewDataUrl, useQRTypeName } from "@/features/qr/hooks/use-qr-preview";
import { downloadPNG, downloadSVG } from "@/features/qr/lib/qr-download";
import { copyToClipboard } from "@/features/qr/lib/qr-clipboard";
import { getCopyLabel } from "@/features/qr/lib/qr-generator";
import { duplicateRecord } from "@/features/qr/storage/utils";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QRDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [record, setRecord] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await qrService.get(id);
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
        } else {
          setRecord(data);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const content = useQRContent(record);
  const preview = useQRPreviewDataUrl(content, record?.customization ?? null);
  const typeName = useQRTypeName(record?.type ?? null);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-8 w-full rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <Shield className="size-7" />
        </div>
        <h1 className="text-xl font-bold">{t("detail.notFound.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("detail.notFound.description")}</p>
        <Button render={<Link href="/qrs" />} nativeButton={false} variant="outline">
          <ArrowLeft className="size-4" />
          {t("common.myQRCodes")}
        </Button>
      </div>
    );
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (format: "png" | "svg") => {
    setDownloading(format);
    try {
      if (format === "png") {
        await downloadPNG(content, record.type, record.customization);
      } else {
        await downloadSVG(content, record.type, record.customization);
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = async () => {
    const text = `${record.name}: ${content}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: record.name, text });
      } catch {
        // user cancelled
      }
      return;
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleFavorite = async () => {
    const updated = await qrService.update({ ...record, favorite: !record.favorite });
    setRecord(updated);
  };

  const handleDuplicate = async () => {
    const copy = duplicateRecord(record);
    const created = await qrService.create({
      id: copy.id,
      name: copy.name,
      type: copy.type,
      values: copy.values,
      customization: copy.customization,
    });
    showToast({ title: t("library.duplicated"), description: created.name, variant: "success" });
    router.push(`/qrs/${created.id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await qrService.deleteRecord(record.id);
      showToast({ title: t("library.deleted") });
      router.push("/qrs");
    } catch {
      showToast({ title: t("library.deleteFailed"), variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" render={<Link href="/qrs" />} nativeButton={false} className="-mx-2">
        <ArrowLeft className="size-4" />
        {t("common.myQRCodes")}
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{record.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{typeName}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5">Static</Badge>
          </div>
        </div>
        <button
          onClick={handleToggleFavorite}
          aria-label={record.favorite ? "Remove from favorites" : "Add to favorites"}
          className="shrink-0 rounded-md p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Star className={`size-5 ${record.favorite ? "fill-amber-500 text-amber-500" : ""}`} />
        </button>
      </div>

      {/* QR Preview */}
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: record.customization.background }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={`QR code for ${record.name}`}
                className="max-w-full h-auto"
                style={{ width: Math.min(record.customization.size, 320) }}
              />
            ) : (
              <div className="w-64 h-64 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                —
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            {t("detail.contentLabel")}
          </p>
          <div className="rounded-lg bg-muted/60 p-3 font-mono text-xs break-all max-h-32 overflow-y-auto">
            {content || "—"}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleDownload("png")} disabled={downloading !== null} nativeButton={false}>
          <ImageIcon className="size-4" />
          {downloading === "png" ? "..." : t("detail.downloadPng")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleDownload("svg")} disabled={downloading !== null} nativeButton={false}>
          <FileCode className="size-4" />
          {downloading === "svg" ? "..." : t("detail.downloadSvg")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={getCopyLabel(record.type)} nativeButton={false}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t("detail.copied") : t("detail.copy")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share" nativeButton={false}>
          <Share2 className="size-4" />
          {t("detail.share")}
        </Button>
      </div>

      <Separator />

      {/* Manage */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" render={<Link href={`/create?edit=${record.id}`} />} nativeButton={false}>
          <Pencil className="size-4" />
          {t("detail.edit")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDuplicate} nativeButton={false}>
          <CopyPlus className="size-4" />
          {t("detail.duplicate")}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} nativeButton={false}>
          <Trash2 className="size-4" />
          {t("detail.delete")}
        </Button>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="size-3.5 mt-0.5 shrink-0" />
        <p>{t("library.localDataNote")}</p>
      </div>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={(open) => !open && setShowDelete(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("detail.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("detail.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} nativeButton={false}>
              {t("detail.deleteDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} nativeButton={false}>
              {deleting ? "..." : t("detail.deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}