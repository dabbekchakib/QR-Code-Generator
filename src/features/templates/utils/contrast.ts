export interface ContrastResult {
  ratio: number;
  sufficient: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.trim().replace(/^#/, "");
  if (value.length !== 3 && value.length !== 6) return null;
  if (!/^[0-9a-fA-F]+$/.test(value)) return null;
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const int = parseInt(full, 16);
  if (!Number.isFinite(int)) return null;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** WCAG relative luminance of a #rgb / #rrggbb hex color. Returns 0 for
 *  anything that does not parse, so an invalid color can never silently pass
 *  the readability check. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

/** WCAG contrast ratio between two colors (order agnostic). Returned as 0
 *  when either color is unparseable. */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === 0 && l2 === 0) return 0;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * QR readability gate. The QR spec relies on strong contrast between modules
 * and quiet-zone background — anything below a 3:1 ratio is a real
 * scan-reliability risk. Returns a flag; never throws.
 */
export function validateQRContrast(
  foreground: string,
  background: string
): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  return { ratio, sufficient: ratio >= 3 };
}