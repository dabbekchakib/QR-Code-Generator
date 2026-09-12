import type {
  ErrorCorrectionLevel,
  QRCustomization,
  QRFrameType,
  QRStyle,
  ResolvedCustomization,
} from "@/features/qr/types";

export interface QRDesignPreset {
  id: "classic" | "midnight" | "minimal" | "soft" | "bold";
  nameKey: string;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrectionLevel;
  /** Module style and eye style (both styles use the same vocabulary). */
  style: QRStyle;
  eyeStyle: QRStyle;
  frame?: QRFrameType;
  frameText?: string;
}

/**
 * Design presets. Every palette is validated by `validateQRContrast` (tests
 * assert ratio >= 3) so readability always wins over aesthetics. Presets now
 * carry the full Phase 8 design: module + eye styles, optional frame and
 * frame text. Error correction stays at M — a logo raises it (H) because a
 * logo covers center modules and needs the extra recovery data.
 */
export const QR_DESIGN_PRESETS: readonly QRDesignPreset[] = [
  { id: "classic", nameKey: "templates.presets.classic", foreground: "#000000", background: "#FFFFFF", errorCorrection: "M", style: "square", eyeStyle: "square", frame: "none" },
  { id: "midnight", nameKey: "templates.presets.midnight", foreground: "#0B1220", background: "#FFFFFF", errorCorrection: "M", style: "rounded", eyeStyle: "rounded", frame: "none" },
  { id: "minimal", nameKey: "templates.presets.minimal", foreground: "#111827", background: "#FFFFFF", errorCorrection: "M", style: "square", eyeStyle: "square", frame: "simple" },
  { id: "soft", nameKey: "templates.presets.soft", foreground: "#1E40AF", background: "#EFF6FF", errorCorrection: "M", style: "rounded", eyeStyle: "rounded", frame: "none" },
  { id: "bold", nameKey: "templates.presets.bold", foreground: "#000000", background: "#FDE047", errorCorrection: "Q", style: "dots", eyeStyle: "dots", frame: "scan", frameText: "SCAN ME" },
] as const;

export function getPresetById(
  id: string | undefined
): QRDesignPreset {
  if (!id) return QR_DESIGN_PRESETS[0];
  return QR_DESIGN_PRESETS.find((p) => p.id === id) ?? QR_DESIGN_PRESETS[0];
}

/** Full design decisions for a preset (colors, styles, frame). Presets never
 *  set a logo — a logo is a user choice and is never silently injected. */
export function presetDesign(preset: QRDesignPreset): ResolvedCustomization {
  return {
    size: 512,
    margin: 4,
    foreground: preset.foreground,
    background: preset.background,
    errorCorrection: preset.errorCorrection,
    style: preset.style,
    eyeStyle: preset.eyeStyle,
    eyeColor: null,
    frame: preset.frame ?? "none",
    frameText: preset.frameText ?? "",
    logo: null,
    transparentBackground: false,
    preset: preset.id,
  };
}

/** Full QRCustomization for a preset: preset design + current size/margin. */
export function presetCustomization(
  preset: QRDesignPreset,
  current: Pick<QRCustomization, "size" | "margin">
): QRCustomization {
  const design = presetDesign(preset);
  return {
    ...design,
    size: current.size,
    margin: current.margin,
  };
}