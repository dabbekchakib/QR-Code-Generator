import type { QRType } from "@/types";
import type { QRCustomization } from "../types";
import { renderDesignToDataURL } from "../designer/qr-render-canvas";
import { buildQRSVG } from "../designer/qr-render-svg";

/** Normalize a file name: keep letters/digits/`-`/`_`, collapse the rest into
 *  single `-`, cap the length. Falls back to the QR type when the name is
 *  empty (e.g. on the create page before the record is saved). */
export function sanitizeFilename(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .trim();
  return cleaned || "qr";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getFilename(type: QRType, name: string | undefined, ext: string): string {
  return `qr-manager-${sanitizeFilename(name?.trim() || type)}.${ext}`;
}

export async function downloadPNG(
  content: string,
  type: QRType,
  customization: QRCustomization,
  name?: string
): Promise<void> {
  const dataURL = await renderDesignToDataURL(content, customization);
  const res = await fetch(dataURL);
  const blob = await res.blob();
  triggerDownload(blob, getFilename(type, name, "png"));
}

export async function downloadSVG(
  content: string,
  type: QRType,
  customization: QRCustomization,
  name?: string
): Promise<void> {
  const svgString = buildQRSVG(content, customization);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, getFilename(type, name, "svg"));
}