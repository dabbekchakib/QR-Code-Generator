/**
 * Pure QR geometry built on top of the `qrcode` engine. `qrcode` stays the
 * single source of truth for the matrix itself; these helpers handle the
 * visual layer (quiet zone, module scale, finder patterns, frame padding) so
 * the SVG and canvas renderers share identical arithmetic.
 */
import QRCode from "qrcode";
import type { ErrorCorrectionLevel, ResolvedCustomization } from "../types";

export type QRModuleAccess = (row: number, col: number) => number | boolean;

export interface QRMatrix {
  matrixSize: number;
  get: QRModuleAccess;
}

/** Build the QR module matrix (version + error correction from `qrcode`). The
 *  matrix does NOT include the quiet zone — that is added as `margin` at draw
 *  time, matching the spec's minimum 4-module quiet-zone requirement. */
export function getQRMatrix(
  content: string,
  errorCorrectionLevel: ErrorCorrectionLevel
): QRMatrix {
  const qr = QRCode.create(content, { errorCorrectionLevel });
  const { size } = qr.modules;
  const get = qr.modules.get.bind(qr.modules);
  return { matrixSize: size, get };
}

export interface QRGeometry {
  matrixSize: number;
  /** Size of one module in px. */
  modulePx: number;
  /** Quiet zone thickness in px (margin modules). */
  quietPx: number;
  /** Top/right/bottom/left padding added by the decorative frame. */
  framePad: { top: number; right: number; bottom: number; left: number };
  /** Total export width/height in px (size + frame padding). */
  totalWidth: number;
  totalHeight: number;
  /** Top-left of the QR content box (frame padding origin). */
  originX: number;
  originY: number;
}

/** Decorative frame padding, expressed in modules so it scales with the QR. */
export function getFramePad(
  frame: ResolvedCustomization["frame"],
  modulePx: number
): { top: number; right: number; bottom: number; left: number } {
  switch (frame) {
    case "badge":
      return { top: 2.6 * modulePx, right: 1 * modulePx, bottom: 1 * modulePx, left: 1 * modulePx };
    case "scan":
      // Extra room at the bottom for the scan/caption area.
      return { top: 1 * modulePx, right: 1 * modulePx, bottom: 3.2 * modulePx, left: 1 * modulePx };
    case "simple":
    case "rounded":
      return { top: 1 * modulePx, right: 1 * modulePx, bottom: 1 * modulePx, left: 1 * modulePx };
    default:
      return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

export function computeGeometry(
  customization: ResolvedCustomization,
  matrixSize: number
): QRGeometry {
  const { size, margin, frame } = customization;
  const modulePx = size / (matrixSize + 2 * margin);
  const quietPx = margin * modulePx;
  const pad = getFramePad(frame, modulePx);
  return {
    matrixSize,
    modulePx,
    quietPx,
    framePad: pad,
    totalWidth: size + pad.left + pad.right,
    totalHeight: size + pad.top + pad.bottom,
    originX: pad.left,
    originY: pad.top,
  };
}

export interface FinderZone {
  row0: number;
  col0: number;
}

/** The three finder-pattern zones in matrix coordinates (7x7 at the corners,
 *  quiet zone excluded). */
export function getFinderZones(matrixSize: number): FinderZone[] {
  return [
    { row0: 0, col0: 0 },
    { row0: 0, col0: matrixSize - 7 },
    { row0: matrixSize - 7, col0: 0 },
  ];
}

export function isInFinderZone(
  row: number,
  col: number,
  matrixSize: number
): boolean {
  return getFinderZones(matrixSize).some(
    (zone) =>
      row >= zone.row0 &&
      row < zone.row0 + 7 &&
      col >= zone.col0 &&
      col < zone.col0 + 7
  );
}

export interface ModuleRect {
  x: number;
  y: number;
  size: number;
}

/** Pixel rectangle (in export coordinates) for a matrix module. */
export function moduleRect(
  geom: QRGeometry,
  row: number,
  col: number
): ModuleRect {
  const x = geom.originX + geom.quietPx + col * geom.modulePx;
  const y = geom.originY + geom.quietPx + row * geom.modulePx;
  return { x, y, size: geom.modulePx };
}

/** Path builder for rounded modules (used by both renderers). */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}