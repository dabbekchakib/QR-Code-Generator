/**
 * Shared draw commands for the QR visual layer. Both renderers (SVG + canvas)
 * consume the exact same command list so the preview, the PNG export and the
 * SVG export are always identical.
 */
import type { ResolvedCustomization } from "../types";
import {
  type QRGeometry,
  computeGeometry,
  getFinderZones,
  getQRMatrix,
  isInFinderZone,
  moduleRect,
} from "./qr-matrix";

export type DrawCommand =
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string }
  | { kind: "roundRect"; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string }
  | { kind: "ring"; cx: number; cy: number; rOuter: number; rInner: number; fill: string }
  | { kind: "roundRing"; x: number; y: number; w: number; h: number; r: number; fill: string };

function eyeCommands(geom: QRGeometry, c: ResolvedCustomization): DrawCommand[] {
  const fill = c.eyeColor ?? c.foreground;
  const commands: DrawCommand[] = [];
  const mp = geom.modulePx;

  for (const zone of getFinderZones(geom.matrixSize)) {
    const x = geom.originX + geom.quietPx + zone.col0 * geom.modulePx;
    const y = geom.originY + geom.quietPx + zone.row0 * geom.modulePx;

    if (c.eyeStyle === "dots") {
      commands.push(
        { kind: "ring", cx: x + 3.5 * mp, cy: y + 3.5 * mp, rOuter: 3.2 * mp, rInner: 2.2 * mp, fill },
        { kind: "circle", cx: x + 3.5 * mp, cy: y + 3.5 * mp, r: 1.5 * mp, fill }
      );
    } else if (c.eyeStyle === "rounded") {
      commands.push(
        { kind: "roundRing", x, y, w: 7 * mp, h: 7 * mp, r: 1.15 * mp, fill },
        { kind: "roundRect", x: x + 2 * mp, y: y + 2 * mp, w: 3 * mp, h: 3 * mp, r: 0.5 * mp, fill }
      );
    } else {
      commands.push(
        { kind: "rect", x, y, w: 7 * mp, h: mp, fill },
        { kind: "rect", x, y: y + 6 * mp, w: 7 * mp, h: mp, fill },
        { kind: "rect", x, y, w: mp, h: 7 * mp, fill },
        { kind: "rect", x: x + 6 * mp, y, w: mp, h: 7 * mp, fill },
        { kind: "rect", x: x + 2 * mp, y: y + 2 * mp, w: 3 * mp, h: 3 * mp, fill }
      );
    }
  }

  return commands;
}

/** All module + eye shapes for a QR, in export coordinates. */
export function buildQRShapeCommands(
  content: string,
  customization: ResolvedCustomization
): { geometry: QRGeometry; commands: DrawCommand[] } {
  const matrix = getQRMatrix(content, customization.errorCorrection);
  const geometry = computeGeometry(customization, matrix.matrixSize);
  const commands: DrawCommand[] = [];
  const fill = customization.foreground;

  for (let row = 0; row < geometry.matrixSize; row++) {
    for (let col = 0; col < geometry.matrixSize; col++) {
      if (!matrix.get(row, col)) continue;
      if (isInFinderZone(row, col, geometry.matrixSize)) continue;
      const { x, y, size } = moduleRect(geometry, row, col);
      if (customization.style === "dots") {
        commands.push({ kind: "circle", cx: x + size / 2, cy: y + size / 2, r: size * 0.35, fill });
      } else if (customization.style === "rounded") {
        commands.push({ kind: "roundRect", x, y, w: size, h: size, r: size * 0.28, fill });
      } else {
        commands.push({ kind: "rect", x, y, w: size, h: size, fill });
      }
    }
  }

  commands.push(...eyeCommands(geometry, customization));
  return { geometry, commands };
}

/** Does the frame text contain right-to-left script? */
export function isRtlText(text: string): boolean {
  return /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFF]/.test(text);
}

export interface QRTextStyle {
  text: string;
  fontSize: number;
  color: string;
  centerX: number;
  centerY: number;
  rtl: boolean;
}

/** Frame text shown by the badge/scan frames. */
export function getFrameTextStyle(
  geometry: QRGeometry,
  c: ResolvedCustomization
): QRTextStyle | null {
  if (!c.frameText || (c.frame !== "badge" && c.frame !== "scan")) return null;

  const text = c.frameText.trim();
  if (!text) return null;

  const bandHeight = c.frame === "badge" ? geometry.framePad.top : geometry.framePad.bottom;
  const maxWidth = geometry.totalWidth * 0.82;
  const fontSize = Math.max(
    8,
    Math.min(maxWidth / Math.max(1, text.length * 0.58), bandHeight * 0.85)
  );

  const centerX = geometry.totalWidth / 2;
  const centerY =
    c.frame === "badge"
      ? geometry.framePad.top / 2
      : geometry.totalHeight - geometry.framePad.bottom / 2;

  return { text, fontSize, color: c.foreground, centerX, centerY, rtl: isRtlText(text) };
}