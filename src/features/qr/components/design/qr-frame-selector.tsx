"use client";

import type { QRFrameType } from "../../types";
import { useI18n } from "@/i18n/provider";
import { Input } from "@/components/ui/input";
import { ChipButton, SectionLabel } from "./ui";

const FRAME_OPTIONS: QRFrameType[] = ["none", "simple", "rounded", "badge", "scan"];

const FRAME_LABEL_KEYS: Record<QRFrameType, string> = {
  none: "design.frameNone",
  simple: "design.frameSimple",
  rounded: "design.frameRounded",
  badge: "design.frameBadge",
  scan: "design.frameScan",
};

interface QRFrameSelectorProps {
  value: QRFrameType;
  frameText: string;
  onFrameChange: (frame: QRFrameType) => void;
  onFrameTextChange: (text: string) => void;
}

export const FRAME_TEXT_MAX_LENGTH = 30;

export function QRFrameSelector({
  value,
  frameText,
  onFrameChange,
  onFrameTextChange,
}: QRFrameSelectorProps) {
  const { t } = useI18n();
  const showsText = value === "badge" || value === "scan";

  return (
    <div className="space-y-2">
      <SectionLabel>{t("design.frame")}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {FRAME_OPTIONS.map((frame) => (
          <ChipButton
            key={frame}
            active={value === frame}
            onClick={() => onFrameChange(frame)}
          >
            {t(FRAME_LABEL_KEYS[frame])}
          </ChipButton>
        ))}
      </div>

      {showsText && (
        <div className="space-y-1.5 pt-1">
          <label htmlFor="qr-frame-text" className="text-xs text-muted-foreground">
            {t("design.frameText")}
          </label>
          <Input
            id="qr-frame-text"
            value={frameText}
            maxLength={FRAME_TEXT_MAX_LENGTH}
            onChange={(e) => onFrameTextChange(e.target.value)}
            placeholder={t("design.frameTextPlaceholder")}
            className="h-8 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            {frameText.length}/{FRAME_TEXT_MAX_LENGTH} — {t("design.frameTextHint")}
          </p>
        </div>
      )}
    </div>
  );
}