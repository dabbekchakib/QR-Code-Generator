import type { QRCustomization } from "../types";
import { renderDesignToCanvas, renderDesignToDataURL } from "../designer/qr-render-canvas";
import { buildQRSVG } from "../designer/qr-render-svg";

/**
 * Small bounded cache for rendered preview data URLs. QR grids render dozens of
 * thumbnails whose output depends only on (content, customization); memoizing
 * prevents identical async canvas renders from running once per card. Evicted
 * LRU-style so a long library never grows without bound.
 */
const PREVIEW_CACHE_LIMIT = 64;
const previewCache = new Map<string, Promise<string>>();

function previewKey(content: string, customization: QRCustomization): string {
  return `${content}:::${JSON.stringify(customization)}`;
}

/** Kept for API compatibility. Rendered output is produced by the designer
 *  renderers (which honour module/eye styles, frames, logos and transparency)
 *  instead of the qrcode library's direct drawing. */
export function getCanvasOptions(customization: QRCustomization) {
  return {
    width: customization.size,
    margin: customization.margin,
    color: {
      dark: customization.foreground,
      light: customization.background,
    },
    errorCorrectionLevel: customization.errorCorrection,
  };
}

export async function renderQRToCanvas(
  content: string,
  canvas: HTMLCanvasElement,
  customization: QRCustomization
): Promise<void> {
  await renderDesignToCanvas(content, canvas, customization);
}

export async function renderQRToDataURL(
  content: string,
  customization: QRCustomization
): Promise<string> {
  const key = previewKey(content, customization);
  const cached = previewCache.get(key);
  if (cached) {
    // Refresh LRU position.
    previewCache.delete(key);
    previewCache.set(key, cached);
    return cached;
  }
  const promise = renderDesignToDataURL(content, customization).catch((error) => {
    previewCache.delete(key);
    throw error;
  });
  previewCache.set(key, promise);
  if (previewCache.size > PREVIEW_CACHE_LIMIT) {
    const oldest = previewCache.keys().next().value;
    if (oldest !== undefined) previewCache.delete(oldest);
  }
  return promise;
}

/** Clear the preview cache (tests / memory pressure). */
export function clearPreviewCache(): void {
  previewCache.clear();
}

export async function renderQRToSVG(
  content: string,
  customization: QRCustomization
): Promise<string> {
  return buildQRSVG(content, customization);
}