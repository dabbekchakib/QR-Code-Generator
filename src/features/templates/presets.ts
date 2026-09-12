import type {
  ErrorCorrectionLevel,
  QRCustomization,
  QRStyle,
} from "@/features/qr/types";

export interface QRDesignPreset {
  id: "classic" | "midnight" | "minimal" | "soft" | "bold";
  nameKey: string;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrectionLevel;
  style: QRStyle;
}

/**
 * Design presets. Every palette is validated by `validateQRContrast` (tests
 * assert ratio >= 3) so readability always wins over aesthetics. Error
 * correction stays at M (H is reserved for a future logo phase).
 */
export const QR_DESIGN_PRESETS: readonly QRDesignPreset[] = [
  { id: "classic", nameKey: "templates.presets.classic", foreground: "#000000", background: "#FFFFFF", errorCorrection: "M", style: "square" },
  { id: "midnight", nameKey: "templates.presets.midnight", foreground: "#0B1220", background: "#FFFFFF", errorCorrection: "M", style: "square" },
  { id: "minimal", nameKey: "templates.presets.minimal", foreground: "#111827", background: "#FFFFFF", errorCorrection: "M", style: "square" },
  { id: "soft", nameKey: "templates.presets.soft", foreground: "#1E40AF", background: "#EFF6FF", errorCorrection: "M", style: "square" },
  { id: "bold", nameKey: "templates.presets.bold", foreground: "#000000", background: "#FDE047", errorCorrection: "Q", style: "square" },
] as const;

export function getPresetById(
  id: string | undefined
): QRDesignPreset {
  if (!id) return QR_DESIGN_PRESETS[0];
  return QR_DESIGN_PRESETS.find((p) => p.id === id) ?? QR_DESIGN_PRESETS[0];
}

/** Full QRCustomization for a preset: preset colors + current size/margin. */
export function presetCustomization(
  preset: QRDesignPreset,
  current: Pick<QRCustomization, "size" | "margin">
): QRCustomization {
  return {
    size: current.size,
    margin: current.margin,
    foreground: preset.foreground,
    background: preset.background,
    errorCorrection: preset.errorCorrection,
    style: preset.style,
  };
}