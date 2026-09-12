"use client";

import { useRef, useState } from "react";
import { Search, PlusCircle, Download, Upload, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { QREmptyState } from "./components/library/qr-empty-state";
import { QRGridSkeleton } from "./components/library/qr-skeleton";
import { QRCard } from "./components/library/qr-card";
import { useQRs } from "@/features/qr/hooks/use-qrs";
import { filterAndSortRecords, duplicateRecord } from "@/features/qr/storage/utils";
import { qrService } from "@/features/qr/service/qr-service";
import type { QRCodeRecord } from "@/features/qr/storage";
import type { QRSortOption, QRStatusFilter } from "@/features/qr/storage/types";
import type { QRType } from "@/types";
import Link from "next/link";
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
import { cn } from "@/lib/utils";
import { qrTypes } from "@/features/qr/qr-types-config";

const statusFilters: QRStatusFilter[] = ["all", "static", "dynamic", "favorites"];

export function QRListContent() {
  const { t } = useI18n();
  const { records, loading, error, refresh } = useQRs();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QRStatusFilter>("all");
  const [type, setType] = useState<QRType | "all">("all");
  const [sort, setSort] = useState<QRSortOption>("updated");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<QRCodeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = filterAndSortRecords(records, { search, status, type, sort });

  const handleExport = async () => {
    setExporting(true);
    try {
      const { buildBackupFile } = await import("@/features/qr/storage/backup");
      const backup = buildBackupFile(records);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      a.download = `qr-manager-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ title: t("library.exported"), variant: "success" });
    } catch {
      showToast({ title: t("library.exportFailed"), variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    const text = await file.text();
    const { parseBackupJson } = await import("@/features/qr/storage/backup");
    try {
      const backup = parseBackupJson(text);
      let count = 0;
      for (const record of backup.qrCodes) {
        const { qrRecordSchema } = await import("@/features/qr/storage/backup");
        const parsed = qrRecordSchema.parse(record);
        await qrService.create({
          id: undefined,
          name: parsed.name,
          type: parsed.type,
          values: parsed.values,
          customization: parsed.customization,
          isDynamic: parsed.isDynamic,
          favorite: parsed.favorite,
          shortCode: parsed.shortCode ?? null,
          destinationUrl: parsed.destinationUrl ?? null,
          status: parsed.status ?? "active",
          templateId: parsed.templateId ?? null,
        });
        count++;
      }
      showToast({
        title: t("library.imported"),
        description: `${count} QR Code${count > 1 ? "s" : ""}`,
        variant: "success",
      });
      await refresh();
    } catch (err) {
      showToast({
        title: t("library.importFailed"),
        description: err instanceof Error ? err.message : "Invalid file",
        variant: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    await qrService.update({ ...record, favorite: !record.favorite });
    await refresh();
  };

  const handleDuplicate = async (record: QRCodeRecord) => {
    const copy = duplicateRecord(record);
    await qrService.create({
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
    showToast({
      title: t("library.duplicated"),
      description: copy.name,
      variant: "success",
    });
    await refresh();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await qrService.deleteRecord(pendingDelete.id);
      showToast({ title: t("library.deleted") });
      setPendingDelete(null);
      await refresh();
    } catch {
      showToast({ title: t("library.deleteFailed"), variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("library.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("library.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || records.length === 0}>
            <Download className="size-4" />
            {exporting ? "..." : t("library.export")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {importing ? "..." : t("library.import")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import QR codes backup"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button render={<Link href="/create" />} nativeButton={false}>
            <PlusCircle className="size-4" />
            {t("common.createQR")}
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("library.searchPlaceholder")}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`library.status.${s}`)}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Filter className="size-4" />
              {type === "all" ? t("library.type.all") : t(`qrTypes.${type}.name`)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("library.type.label")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setType("all")}>
                {t("library.type.all")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {qrTypes.map((qt) => (
                <DropdownMenuItem key={qt.type} onClick={() => setType(qt.type)}>
                  <qt.icon className="size-4" />
                  {t(`qrTypes.${qt.type}.name`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <ArrowUpDown className="size-4" />
              {t(`library.sort.${sort}`)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("library.sort.label")}</DropdownMenuLabel>
              {(["updated", "created", "name-asc", "name-desc"] as QRSortOption[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSort(s)}>
                  {t(`library.sort.${s}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <QRGridSkeleton />
      ) : error ? (
        <div className="rounded-xl border-2 border-dashed border-destructive/30 p-12 text-center">
          <p className="text-sm text-destructive font-medium">{t("library.error")}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-3">
            {t("library.retry")}
          </Button>
        </div>
      ) : records.length === 0 ? (
        <QREmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("library.noResults")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((record) => (
            <QRCard
              key={record.id}
              record={record}
              onToggleFavorite={handleToggleFavorite}
              onDuplicate={handleDuplicate}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("library.delete.title")}</DialogTitle>
            <DialogDescription>{t("library.delete.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} nativeButton={false}>
              {t("library.delete.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} nativeButton={false}>
              {deleting ? "..." : t("library.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}