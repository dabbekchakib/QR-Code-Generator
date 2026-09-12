"use client";

import { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import type { QRDesignLogo } from "../../types";
import {
  validateLogoFile,
  readLogoAsDataUrl,
  decodeLogoImage,
  LOGO_ACCEPTED_MIME_TYPES,
  LOGO_MAX_BYTES,
} from "../../designer/qr-logo";
import { ChipButton, SectionLabel } from "./ui";

interface QRLogoUploaderProps {
  logo: QRDesignLogo | null;
  onChange: (logo: QRDesignLogo | null) => void;
}

export function QRLogoUploader({ logo, onChange }: QRLogoUploaderProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const validation = validateLogoFile(file);
    if (!validation.ok) {
      setError(
        validation.error === "SIZE"
          ? t("design.logoErrorSize")
          : t("design.logoErrorType")
      );
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readLogoAsDataUrl(file);
      const decoded = await decodeLogoImage(dataUrl);
      if (!decoded) {
        setError(t("design.logoDecodeFailed"));
        return;
      }
      onChange({
        dataUrl,
        size: 15,
        margin: 6,
        shape: "rounded",
      });
    } catch {
      setError(t("design.logoDecodeFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const update = <K extends keyof QRDesignLogo>(key: K, value: QRDesignLogo[K]) => {
    if (!logo) return;
    onChange({ ...logo, [key]: value });
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{t("design.logo")}</SectionLabel>

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPTED_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400" role="alert">
          {error}
        </p>
      )}

      {!logo ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          nativeButton={false}
        >
          <Upload className="size-4" />
          {t("design.logoUpload")}
        </Button>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.dataUrl}
                alt={t("design.logo")}
                className="size-10 shrink-0 rounded-lg border border-border object-contain bg-white"
              />
              <div className="min-w-0">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  nativeButton={false}
                >
                  {t("design.logoReplace")}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {LOGO_MAX_BYTES > 1024 * 1024
                    ? `${Math.round(LOGO_MAX_BYTES / (1024 * 1024))} MB max`
                    : `${Math.round(LOGO_MAX_BYTES / 1024)} KB max`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(null)}
              aria-label={t("design.logoRemove")}
              nativeButton={false}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="qr-logo-size" className="text-xs text-muted-foreground">
              {t("design.logoSize")} — {logo.size}%
            </label>
            <input
              id="qr-logo-size"
              type="range"
              min={5}
              max={40}
              step={1}
              value={logo.size}
              onChange={(e) => update("size", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="qr-logo-margin" className="text-xs text-muted-foreground">
              {t("design.logoMargin")} — {logo.margin}px
            </label>
            <Input
              id="qr-logo-margin"
              type="number"
              min={0}
              max={64}
              value={logo.margin}
              onChange={(e) => update("margin", Math.max(0, Number(e.target.value)))}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <SectionLabel>{t("design.logoShape")}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {(["square", "rounded", "circle"] as const).map((shape) => (
                <ChipButton
                  key={shape}
                  active={logo.shape === shape}
                  onClick={() => update("shape", shape)}
                >
                  {t(
                    shape === "square"
                      ? "design.shapeSquare"
                      : shape === "rounded"
                        ? "design.shapeRounded"
                        : "design.shapeCircle"
                  )}
                </ChipButton>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">{t("design.logoHint")}</p>
        </div>
      )}
    </div>
  );
}