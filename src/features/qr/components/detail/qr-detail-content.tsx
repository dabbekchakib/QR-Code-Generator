"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Pencil, CopyPlus, Trash2, Star, Shield, Link2, Power, CloudOff, Palette, ExternalLink, WifiOff, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { qrService } from "@/features/qr/service/qr-service";
import type { QRCodeRecord, QRStatus } from "@/features/qr/storage";
import { useQRContent, useQRPreviewDataUrl, useQRTypeName } from "@/features/qr/hooks/use-qr-preview";
import { copyToClipboard } from "@/features/qr/lib/qr-clipboard";
import { getCopyLabel } from "@/features/qr/lib/qr-generator";
import { duplicateRecord } from "@/features/qr/storage/utils";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import { getDynamicQRUrlWithFallback, isSafeDestination, DynamicQRError } from "@/features/qr/dynamic";
import { useQRPublication, type PublicationStatus } from "@/features/qr/hooks/use-qr-publication";
import { ShareQRButton } from "@/features/sharing/components/share-qr-button";
import { CopyLinkButton } from "@/features/sharing/components/copy-link-button";
import { DownloadQRButton } from "@/features/sharing/components/download-qr-button";
import { isWellFormedHttpUrl } from "@/features/sharing/lib/share-metadata";
import { QRAnalyticsCard } from "@/features/analytics/components/qr-analytics-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  const { t } = useI18n();
  const map: Record<PublicationStatus, { key: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    synced: { key: "share.statusSynced", variant: "default" },
    syncing: { key: "share.statusSyncing", variant: "outline" },
    pending: { key: "share.statusPending", variant: "secondary" },
    "not-published": { key: "share.statusNotPublished", variant: "secondary" },
    offline: { key: "share.statusOffline", variant: "destructive" },
  };
  const { key, variant } = map[status];
  const Icon =
    status === "synced" ? (
      <Check className="size-3.5" />
    ) : status === "syncing" ? (
      <Loader2 className="size-3.5 animate-spin" />
    ) : status === "pending" ? (
      <Clock className="size-3.5" />
    ) : status === "offline" ? (
      <WifiOff className="size-3.5" />
    ) : (
      <CloudOff className="size-3.5" />
    );
  return (
    <Badge variant={variant} className="gap-1 text-[10px] px-1.5">
      {Icon}
      {t(key)}
    </Badge>
  );
}

export function QRDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [record, setRecord] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDestination, setShowDestination] = useState(false);
  const [destinationInput, setDestinationInput] = useState("");
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [savingDestination, setSavingDestination] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showEnable, setShowEnable] = useState(false);
  const [toggling, setToggling] = useState(false);

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
  const publication = useQRPublication(record);
  const permanentUrl =
    record?.isDynamic && record.shortCode ? getDynamicQRUrlWithFallback(record.shortCode) : "";

  const canOpenPublicUrl =
    Boolean(publication?.published) && record?.status === "active";
  const staticUrl = !record?.isDynamic && isWellFormedHttpUrl(content) ? content : "";

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
    const result = await copyToClipboard(content);
    if (result.success) {
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
      isDynamic: copy.isDynamic,
      favorite: copy.favorite,
      shortCode: copy.shortCode ?? null,
      destinationUrl: copy.destinationUrl ?? null,
      status: copy.status,
    });
    showToast({ title: t("library.duplicated"), description: created.name, variant: "success" });
    router.push(`/qrs/${created.id}`);
  };

  const openDestinationDialog = () => {
    setDestinationInput(record.destinationUrl ?? "");
    setDestinationError(null);
    setShowDestination(true);
  };

  const handleSaveDestination = async () => {
    const trimmed = destinationInput.trim();
    if (!trimmed) {
      setDestinationError(t("dynamicQr.errDestinationRequired"));
      return;
    }
    if (!isSafeDestination(trimmed)) {
      setDestinationError(t("dynamicQr.errInvalidDestination"));
      return;
    }
    setSavingDestination(true);
    try {
      const updated = await qrService.updateDynamicDestination(record, trimmed);
      setRecord(updated);
      setShowDestination(false);
      showToast({ title: t("detail.destinationSaved"), variant: "success" });
    } catch (err) {
      setDestinationError(
        err instanceof DynamicQRError
          ? t("dynamicQr.errInvalidDestination")
          : t("detail.destinationFailed")
      );
    } finally {
      setSavingDestination(false);
    }
  };

  const handleSetStatus = async (status: QRStatus) => {
    setToggling(true);
    try {
      const updated = await qrService.setDynamicStatus(record, status);
      setRecord(updated);
      setShowDisable(false);
      setShowEnable(false);
      showToast({ title: t("create.saved"), variant: "success" });
    } catch {
      showToast({ title: t("detail.destinationFailed"), variant: "error" });
    } finally {
      setToggling(false);
    }
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
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {record.isDynamic ? t("library.status.dynamic") : t("library.status.static")}
            </Badge>
            {record.isDynamic && (
              <Badge
                variant={record.status === "active" ? "default" : "outline"}
                className="text-[10px] px-1.5"
              >
                {record.status === "active" ? t("detail.statusActive") : t("detail.statusDisabled")}
              </Badge>
            )}
          </div>
          {record.isDynamic && publication && (
            <div className="mt-1.5">
              <PublicationStatusBadge status={publication.status} />
            </div>
          )}
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
            style={{
              backgroundColor: record.customization.transparentBackground
                ? "transparent"
                : record.customization.background,
            }}
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
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-muted-foreground font-medium">
              {t("detail.contentLabel")}
            </p>
            {staticUrl && (
              <div className="flex items-center gap-1.5">
                <CopyLinkButton
                  value={staticUrl}
                  label={t("share.copyUrl")}
                  size="icon-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={staticUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("share.open")}
                    />
                  }
                >
                  <ExternalLink className="size-4" />
                  {t("share.open")}
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted/60 p-3 font-mono text-xs break-all max-h-32 overflow-y-auto" dir="ltr">
            {content || "—"}
          </div>
        </CardContent>
      </Card>

      {/* Public QR URL (dynamic only) */}
      {record.isDynamic && permanentUrl && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Link2 className="size-3.5" />
              {t("share.publicUrlLabel")}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs break-all" dir="ltr">
                {permanentUrl}
              </div>
              <CopyLinkButton value={permanentUrl} label={t("share.copyUrl")} size="icon-sm" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PublicationStatusBadge status={publication?.status ?? "not-published"} />
              {canOpenPublicUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={permanentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("share.open")}
                    />
                  }
                >
                  <ExternalLink className="size-4" />
                  {t("share.open")}
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ExternalLink className="size-4" />
                  {t("share.open")}
                </Button>
              )}
            </div>
            {!publication?.published && (
              <p className="text-xs text-muted-foreground">
                {t("share.notPublishedDesc")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t("detail.visibilityDesc")}</p>
          </CardContent>
        </Card>
      )}

      {/* Analytics (dynamic only) */}
      {record.isDynamic && <QRAnalyticsCard qrId={record.id} />}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <DownloadQRButton
          target={{ content, customization: record.customization, type: record.type, name: record.name }}
          variant="outline"
          size="sm"
        />
        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={getCopyLabel(record.type)} nativeButton={false}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t("detail.copied") : t("detail.copy")}
        </Button>
        <ShareQRButton
          target={{
            name: record.name,
            isDynamic: record.isDynamic,
            content,
            customization: record.customization,
            type: record.type,
            permanentUrl,
            published: canOpenPublicUrl,
            description: typeName,
          }}
        />
      </div>

      <Separator />

      {/* Manage */}
      <div className="flex flex-wrap gap-2">
        {record.isDynamic && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              record.status === "active" ? setShowDisable(true) : setShowEnable(true)
            }
            nativeButton={false}
          >
            <Power className="size-4" />
            {record.status === "active" ? t("detail.disable") : t("detail.enable")}
          </Button>
        )}
        {record.isDynamic && (
          <Button variant="outline" size="sm" onClick={openDestinationDialog} nativeButton={false}>
            <Link2 className="size-4" />
            {t("detail.editDestination")}
          </Button>
        )}
        <Button variant="outline" size="sm" render={<Link href={`/create?edit=${record.id}`} />} nativeButton={false}>
          <Pencil className="size-4" />
          {t("detail.edit")}
        </Button>
        <Button variant="outline" size="sm" render={<Link href={`/create?edit=${record.id}`} />} nativeButton={false}>
          <Palette className="size-4" />
          {t("detail.customize")}
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

      {/* Destination edit dialog */}
      <Dialog open={showDestination} onOpenChange={(open) => !open && setShowDestination(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("detail.editDestination")}</DialogTitle>
            <DialogDescription>{t("detail.destinationLabel")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="url"
              inputMode="url"
              value={destinationInput}
              onChange={(e) => {
                setDestinationInput(e.target.value);
                setDestinationError(null);
              }}
              placeholder={t("create.destinationPlaceholder")}
              aria-invalid={!!destinationError}
              aria-describedby={destinationError ? "destination-error" : undefined}
            />
            {destinationError && (
              <p id="destination-error" className="text-xs text-destructive" role="alert">
                {destinationError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDestination(false)} disabled={savingDestination} nativeButton={false}>
              {t("detail.deleteDialog.cancel")}
            </Button>
            <Button onClick={handleSaveDestination} disabled={savingDestination} nativeButton={false}>
              {savingDestination ? "..." : t("profile.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={showDisable} onOpenChange={(open) => !open && setShowDisable(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("detail.disableDialog.title")}</DialogTitle>
            <DialogDescription>{t("detail.disableDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisable(false)} disabled={toggling} nativeButton={false}>
              {t("detail.disableDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => handleSetStatus("disabled")} disabled={toggling} nativeButton={false}>
              {toggling ? "..." : t("detail.disableDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable dialog */}
      <Dialog open={showEnable} onOpenChange={(open) => !open && setShowEnable(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("detail.enableDialog.title")}</DialogTitle>
            <DialogDescription>{t("detail.enableDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnable(false)} disabled={toggling} nativeButton={false}>
              {t("detail.enableDialog.cancel")}
            </Button>
            <Button onClick={() => handleSetStatus("active")} disabled={toggling} nativeButton={false}>
              {toggling ? "..." : t("detail.enableDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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