"use client";

import type { QRStyle } from "../../types";
import { useI18n } from "@/i18n/provider";
import { ChipButton, SectionLabel } from "./ui";

interface QRStyleSelectorProps {
  label: string;
  value: QRStyle;
  onChange: (value: QRStyle) => void;
}

const STYLE_OPTIONS: QRStyle[] = ["square", "rounded", "dots"];

/** Module / eye style picker (square, rounded, dots). */
export function QRStyleSelector({ label, value, onChange }: QRStyleSelectorProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {STYLE_OPTIONS.map((style) => (
          <ChipButton
            key={style}
            active={value === style}
            onClick={() => onChange(style)}
          >
            {t(
              style === "square"
                ? "design.styleSquare"
                : style === "rounded"
                  ? "design.styleRounded"
                  : "design.styleDots"
            )}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}