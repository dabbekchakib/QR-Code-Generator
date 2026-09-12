import type { QRCustomization } from "../types";
import { renderQRToDataURL } from "./qr-renderer";
import { copyToClipboard } from "./qr-clipboard";
import { sanitizeFilename } from "./qr-download";

export type ShareResult = "shared" | "aborted" | "copied" | "failed";

async function buildPngFile(
  content: string,
  customization: QRCustomization,
  name: string
): Promise<File | null> {
  if (typeof document === "undefined") return null;
  try {
    const dataUrl = await renderQRToDataURL(content, customization);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], `${sanitizeFilename(name)}.png`, { type: "image/png" });
  } catch {
    return null;
  }
}

/**
 * Share a QR code the best way the current browser/OS supports:
 *  1. the generated PNG (Web Share API with files) when available,
 *  2. the content / permanent URL as plain text otherwise,
 *  3. a clipboard copy as the universal fallback.
 * Dynamic QR codes always carry their permanent URL (never the destination).
 */
export async function shareQRCode(options: {
  content: string;
  name?: string;
  customization?: QRCustomization;
}): Promise<ShareResult> {
  const { content, name = "QR Code", customization } = options;
  const text = content;

  const canNative = typeof navigator !== "undefined" && navigator.share;
  if (!canNative) {
    const ok = await copyToClipboard(text);
    return ok ? "copied" : "failed";
  }

  const file = customization ? await buildPngFile(content, customization, name) : null;
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name, text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "aborted";
    }
  }

  try {
    await navigator.share({ title: name, text });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "aborted";
    const ok = await copyToClipboard(text);
    return ok ? "copied" : "failed";
  }
}