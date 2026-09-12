/**
 * QR readability diagnostics. Pure functions: given a customization they
 * return structured results (contrast ratio, warnings, overall quality) that
 * the UI translates — no rendering, no side effects.
 */
import {
  type QRCustomization,
  normalizeCustomization,
} from "../types";
import { contrastRatio } from "@/features/templates/utils/contrast";

export interface QRContrastResult {
  valid: boolean;
  ratio: number;
  level: "good" | "warning" | "danger";
}

/** WCAG contrast check for QR foreground/background pairs. The QR specification
 *  calls for a strong ratio — 3:1 is the minimum for reliable scanning, 4.5:1
 *  is comfortably readable. `valid` mirrors `level !== "danger"`. */
export function checkQRContrast(
  foreground: string,
  background: string
): QRContrastResult {
  const ratio = contrastRatio(foreground, background);
  if (ratio >= 4.5) return { valid: true, ratio, level: "good" };
  if (ratio >= 3) return { valid: true, ratio, level: "warning" };
  return { valid: false, ratio, level: "danger" };
}

export type QRWarningLevel = "good" | "info" | "warning" | "danger";

export interface QRDesignIssue {
  code:
    | "contrast"
    | "margin-low"
    | "logo-large"
    | "logo-without-high-correction"
    | "transparent-background"
    | "decorative-style";
  level: QRWarningLevel;
  ratio?: number;
}

export interface QRDesignAssessment {
  quality: "good" | "warning" | "danger";
  warnings: QRDesignIssue[];
}

export const MIN_QUIET_ZONE_MODULES = 4;
export const LOGO_SAFE_ZONE_PERCENT = 25;

/** Overall readability assessment of a design. Quality is the worst severity
 *  present, mirroring how a scanner would experience the printed result. */
export function assessQRDesign(
  customization: QRCustomization
): QRDesignAssessment {
  const c = normalizeCustomization(customization);
  const warnings: QRDesignIssue[] = [];

  const contrast = checkQRContrast(c.foreground, c.background);
  warnings.push({ code: "contrast", level: contrast.level, ratio: contrast.ratio });

  if (c.margin < MIN_QUIET_ZONE_MODULES) {
    warnings.push({ code: "margin-low", level: "warning" });
  }

  if (c.logo) {
    if (c.logo.size > LOGO_SAFE_ZONE_PERCENT) {
      warnings.push({ code: "logo-large", level: "warning" });
    }
    if (c.errorCorrection !== "H") {
      warnings.push({ code: "logo-without-high-correction", level: "warning" });
    }
  }

  if (c.transparentBackground) {
    warnings.push({ code: "transparent-background", level: "warning" });
  }

  const decorative =
    c.style !== "square" ||
    c.eyeStyle !== "square" ||
    c.frame !== "none";
  if (decorative) {
    warnings.push({ code: "decorative-style", level: "info" });
  }

  const rank: Record<QRWarningLevel, number> = {
    good: 0,
    info: 0,
    warning: 1,
    danger: 2,
  };
  const quality = warnings.reduce<QRDesignAssessment["quality"]>(
    (acc, w) => (rank[w.level] > rank[acc] ? (w.level as QRDesignAssessment["quality"]) : acc),
    "good"
  );

  return { quality, warnings };
}