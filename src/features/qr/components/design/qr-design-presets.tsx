"use client";

import type { QRCustomization } from "../../types";
import { normalizeCustomization } from "../../types";
import { QR_DESIGN_PRESETS, presetCustomization } from "@/features/templates/presets";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./ui";

interface QRDesignPresetsProps {
  customization: QRCustomization;
  onApply: (customization: QRCustomization) => void;
}

/** Pick a full preset look (colors, styles, frame). Applying a preset keeps the
 *  current size and margin but replaces all visual design decisions. */
export function QRDesignPresets({ customization, onApply }: QRDesignPresetsProps) {
  const { t } = useI18n();

  const isActive = (preset: (typeof QR_DESIGN_PRESETS)[number]) => {
    const c = normalizeCustomization(customization);
    return (
      preset.foreground === c.foreground &&
      preset.background === c.background &&
      preset.errorCorrection === c.errorCorrection &&
      preset.style === c.style &&
      preset.eyeStyle === c.eyeStyle &&
      (preset.frame ?? "none") === c.frame &&
      (preset.frameText ?? "") === c.frameText
    );
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{t("design.presets")}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {QR_DESIGN_PRESETS.map((preset) => {
          const active = isActive(preset);
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onApply(
                  presetCustomization(preset, {
                    size: customization.size,
                    margin: customization.margin,
                  })
                )
              }
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/30"
              )}
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
          );
        })}
      </div>
    </div>
  );
}