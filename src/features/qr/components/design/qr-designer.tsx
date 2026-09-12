"use client";

import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type {
  ErrorCorrectionLevel,
  QRCustomization,
} from "../../types";
import { SIZE_OPTIONS, normalizeCustomization } from "../../types";
import { getDesignDefaults } from "../../hooks/use-design-defaults";
import { QRDesignPresets } from "./qr-design-presets";
import { QRColorPicker } from "./qr-color-picker";
import { QRStyleSelector } from "./qr-style-selector";
import { QRFrameSelector } from "./qr-frame-selector";
import { QRLogoUploader } from "./qr-logo-uploader";
import { QRDesignWarnings } from "./qr-design-warnings";
import { ChipButton, SectionLabel } from "./ui";

const MARGIN_OPTIONS = [1, 2, 4, 6, 8] as const;

const ERROR_INFO: Record<ErrorCorrectionLevel, string> = {
  L: "design.errL",
  M: "design.errM",
  Q: "design.errQ",
  H: "design.errH",
};

interface QRDesignerProps {
  customization: QRCustomization;
  onChange: (customization: QRCustomization) => void;
}

export function QRDesigner({ customization, onChange }: QRDesignerProps) {
  const { t } = useI18n();
  const c = useMemo(() => normalizeCustomization(customization), [customization]);

  const update = <K extends keyof QRCustomization>(
    key: K,
    value: QRCustomization[K]
  ) => {
    onChange({ ...customization, [key]: value });
  };

  const reset = () => onChange(getDesignDefaults());

  return (
    <div className="space-y-6">
      {/* Presets */}
      <QRDesignPresets customization={customization} onApply={onChange} />

      {/* Colors */}
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-3">
        <SectionLabel>{t("design.colors")}</SectionLabel>
        <QRColorPicker
          label={t("design.foreground")}
          value={c.foreground}
          onChange={(v) => update("foreground", v)}
        />
        <QRColorPicker
          label={t("design.background")}
          value={c.background}
          onChange={(v) => update("background", v)}
        />
        <QRColorPicker
          label={t("design.eyeColor")}
          value={c.eyeColor ?? c.foreground}
          onChange={(v) => update("eyeColor", v)}
          allowClear
          cleared={c.eyeColor === null}
          onClear={() => update("eyeColor", null)}
        />
      </div>

      {/* Module + eyes */}
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-3">
        <QRStyleSelector
          label={t("design.style")}
          value={c.style}
          onChange={(v) => update("style", v)}
        />
        <QRStyleSelector
          label={t("design.eyeStyle")}
          value={c.eyeStyle}
          onChange={(v) => update("eyeStyle", v)}
        />
      </div>

      {/* Frame */}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <QRFrameSelector
          value={c.frame}
          frameText={c.frameText}
          onFrameChange={(v) => update("frame", v)}
          onFrameTextChange={(v) => update("frameText", v)}
        />
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <QRLogoUploader logo={c.logo} onChange={(v) => update("logo", v)} />
      </div>

      {/* Size / margin / error correction */}
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-3">
        <div className="space-y-2">
          <SectionLabel>{t("design.size")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((size) => (
              <ChipButton
                key={size}
                active={c.size === size}
                onClick={() => update("size", size)}
              >
                {size}px
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel>{t("design.margin")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {MARGIN_OPTIONS.map((m) => (
              <ChipButton
                key={m}
                active={c.margin === m}
                onClick={() => update("margin", m)}
              >
                {m}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel>{t("design.errorCorrection")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(["L", "M", "Q", "H"] as ErrorCorrectionLevel[]).map((level) => (
              <ChipButton
                key={level}
                active={c.errorCorrection === level}
                onClick={() => update("errorCorrection", level)}
              >
                {level}
              </ChipButton>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t(ERROR_INFO[c.errorCorrection])}</p>
        </div>
      </div>

      {/* Transparency */}
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div className="space-y-0.5">
          <SectionLabel>{t("design.transparent")}</SectionLabel>
          <p className="text-xs text-muted-foreground">{t("design.transparentHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={c.transparentBackground}
          aria-label={t("design.transparent")}
          onClick={() => update("transparentBackground", !c.transparentBackground)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
            c.transparentBackground
              ? "border-primary bg-primary"
              : "border-border bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform",
              c.transparentBackground && "translate-x-5"
            )}
          />
        </button>
      </div>

      {/* Readability */}
      <QRDesignWarnings customization={customization} />

      {/* Reset */}
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="size-3.5" />
        {t("design.reset")}
      </button>
    </div>
  );
}