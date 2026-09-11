"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, MoreVertical, Pencil, Copy, Trash2, Download, ImageIcon, FileCode, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useQRContent,
  useQRPreviewDataUrl,
  useQRTypeName,
} from "@/features/qr/hooks/use-qr-preview";
import { useI18n } from "@/i18n/provider";
import { formatUpdatedAt } from "@/features/qr/storage/utils";
import type { QRCodeRecord } from "@/features/qr/storage";
import { downloadPNG, downloadSVG } from "@/features/qr/lib/qr-download";
import { cn } from "@/lib/utils";

interface QRCardProps {
  record: QRCodeRecord;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (record: QRCodeRecord) => void;
  onDelete: (record: QRCodeRecord) => void;
}

export function QRCard({ record, onToggleFavorite, onDuplicate, onDelete }: QRCardProps) {
  const { locale, t } = useI18n();
  const content = useQRContent(record);
  const preview = useQRPreviewDataUrl(content, record.customization);
  const typeName = useQRTypeName(record.type);
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);

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

  return (
    <Card className="overflow-hidden transition-all hover:shadow-sm hover:border-primary/20 group">
      <CardContent className="p-0">
        {/* Preview */}
        <Link
          href={`/qrs/${record.id}`}
          className="block aspect-square bg-muted/40 flex items-center justify-center p-6 overflow-hidden"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={`QR code preview for ${record.name}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              —
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {record.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {typeName} &bull;{" "}
                {formatUpdatedAt(record.updatedAt, locale) || "—"}
              </p>
            </div>
            <button
              onClick={() => onToggleFavorite(record.id)}
              aria-label={record.favorite ? "Remove from favorites" : "Add to favorites"}
              className={cn(
                "shrink-0 rounded-md p-1 transition-colors",
                record.favorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className={cn("size-4", record.favorite && "fill-current")} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {record.isDynamic ? t("library.status.dynamic") : t("library.status.static")}
            </Badge>
            {record.isDynamic && record.status === "disabled" && (
              <Badge variant="outline" className="text-[10px] px-1.5 text-muted-foreground">
                {t("detail.statusDisabled")}
              </Badge>
            )}
            <div className="flex-1" />

            {/* Download dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" />
                }
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">{t("detail.downloadPng")}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("detail.downloadPng")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleDownload("png")} disabled={downloading !== null}>
                  <ImageIcon className="size-4" />
                  PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("svg")} disabled={downloading !== null}>
                  <FileCode className="size-4" />
                  SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" />
                }
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/qrs/${record.id}`} />}>
                  <Eye className="size-4" />
                  {t("detail.view")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href={`/create?edit=${record.id}`} />}
                >
                  <Pencil className="size-4" />
                  {t("detail.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(record)}>
                  <Copy className="size-4" />
                  {t("detail.duplicate")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(record)}
                >
                  <Trash2 className="size-4" />
                  {t("detail.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}