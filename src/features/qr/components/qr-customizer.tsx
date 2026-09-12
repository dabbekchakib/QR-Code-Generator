"use client";

import type {
  QRCustomization,
  ErrorCorrectionLevel,
  QRStyle,
} from "../types";
import { DEFAULT_CUSTOMIZATION, SIZE_OPTIONS } from "../types";
import { useI18n } from "@/i18n/provider";
import { QR_DESIGN_PRESETS } from "@/features/templates/presets";
import { presetCustomization } from "@/features/templates/presets";
import { validateQRContrast } from "@/features/templates/utils/contrast";
import { cn } from "@/lib/utils";

interface QRCustomizerProps {
  customization: QRCustomization;
  onChange: (customization: QRCustomization) => void;
}

const STYLE_OPTIONS: { value: QRStyle; labelKey: string; available: boolean }[] = [
  { value: "square", labelKey: "design.styleSquare", available: true },
  { value: "rounded", labelKey: "design.styleRounded", available: false },
  { value: "dots", labelKey: "design.styleDots", available: false },
];

const MARGIN_OPTIONS = [0, 1, 2, 4, 6, 8] as const;

const ERROR_INFO = {
  L: "design.errL",
  M: "design.errM",
  Q: "design.errQ",
  H: "design.errH",
} as const;

export function QRCustomizer({ customization, onChange }: QRCustomizerProps) {
  const { t } = useI18n();

  const update = <K extends keyof QRCustomization>(
    key: K,
    value: QRCustomization[K]
  ) => {
    onChange({ ...customization, [key]: value });
  };

  const contrast = validateQRContrast(
    customization.foreground,
    customization.background
  );

  const isPresetActive = (preset: (typeof QR_DESIGN_PRESETS)[number]) => {
    return (
      preset.foreground === customization.foreground &&
      preset.background === customization.background &&
      preset.errorCorrection === customization.errorCorrection &&
      preset.style === customization.style
    );
  };

  const chip = (active: boolean, disabled?: boolean) =>
    cn(
      "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border hover:border-primary/30",
      disabled && "opacity-50 cursor-not-allowed"
    );

  return (
    <div className="space-y-5">
      {/* Design presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("design.presets")}</label>
        <div className="flex flex-wrap gap-2">
          {QR_DESIGN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isPresetActive(preset)}
              onClick={() =>
                onChange(
                  presetCustomization(preset, {
                    size: customization.size,
                    margin: customization.margin,
                  })
                )
              }
              className={chip(isPresetActive(preset))}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-flex h-3.5 w-3.5 rounded-sm border border-border"
                  style={{
                    background:
                      preset.foreground === preset.background
                        ? preset.background
                        : `linear-gradient(135deg, ${preset.foreground} 50%, ${preset.background} 50%)`,
                  }}
                />
                {t(`templates.presets.${preset.id}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contrast warning */}
      {!contrast.sufficient && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400" role="alert">
          {t("design.contrastWarning", {
            ratio: contrast.ratio.toFixed(2),
          })}
        </p>
      )}

      {/* Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("design.size")}</label>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update("size", size)}
              className={chip(customization.size === size)}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("design.margin")}</label>
        <div className="flex flex-wrap gap-2">
          {MARGIN_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update("margin", m)}
              className={chip(customization.margin === m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="qr-fg" className="text-sm font-medium">
            {t("design.foreground")}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="qr-fg"
              type="color"
              value={customization.foreground}
              onChange={(e) => update("foreground", e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {customization.foreground}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="qr-bg" className="text-sm font-medium">
            {t("design.background")}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="qr-bg"
              type="color"
              value={customization.background}
              onChange={(e) => update("background", e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {customization.background}
            </span>
          </div>
        </div>
      </div>

      {/* Error Correction */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("design.errorCorrection")}</label>
        <div className="flex flex-wrap gap-2">
          {(["L", "M", "Q", "H"] as ErrorCorrectionLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => update("errorCorrection", level)}
              className={chip(customization.errorCorrection === level)}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {t(ERROR_INFO[customization.errorCorrection])}
        </p>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("design.style")}</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.value}
              type="button"
              disabled={!style.available}
              onClick={() => style.available && update("style", style.value)}
              className={chip(customization.style === style.value, !style.available)}
              title={!style.available ? t("design.comingSoon") : undefined}
            >
              {t(style.labelKey)}
              {!style.available && ` (${t("design.soon")})`}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Customization */}
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_CUSTOMIZATION })}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("design.reset")}
      </button>
    </div>
  );
}