import type { QRCustomization } from "../types";
import { renderQRToDataURL } from "./qr-renderer";
import { copyToClipboard } from "./qr-clipboard";
import { sanitizeFilename } from "./qr-download";

export type ShareResult = "shared" | "aborted" | "copied" | "failed";

export interface ShareOptions {
  content: string;
  name?: string;
  customization?: QRCustomization;
  title?: string;
}

/** Is the Web Share API available in this browser/context? */
export function canShareNative(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Can we share a file (the generated PNG) via the Web Share API? */
export function canSharePngFiles(file?: File): boolean {
  return (
    canShareNative() &&
    typeof navigator.canShare === "function" &&
    (file ? navigator.canShare({ files: [file] }) : true)
  );
}

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
    return new File([blob], `qr-manager-${sanitizeFilename(name)}.png`, {
      type: "image/png",
    });
  } catch {
    return null;
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Share a QR code the best way the current browser/OS supports:
 *  1. the generated PNG (Web Share API with files) when available,
 *  2. the share text (permanent URL for dynamic QR codes — never the
 *     destination; the encoded content otherwise),
 *  3. a clipboard copy as the universal last resort.
 *
 * When the Web Share API is entirely absent the caller is expected to show the
 * ShareQRDialog fallback instead of calling this directly.
 */
export async function shareQRCode(options: ShareOptions): Promise<ShareResult> {
  const { content, name = "QR Code", customization, title } = options;
  const text = content;
  const shareTitle = title ?? name;

  if (!canShareNative()) {
    const ok = await copyToClipboard(text);
    return ok.success ? "copied" : "failed";
  }

  const file = customization ? await buildPngFile(content, customization, name) : null;
  if (file && canSharePngFiles(file)) {
    try {
      await navigator.share({ files: [file], title: shareTitle, text });
      return "shared";
    } catch (err) {
      if (isAbort(err)) return "aborted";
    }
  }

  try {
    await navigator.share({ title: shareTitle, text });
    return "shared";
  } catch (err) {
    if (isAbort(err)) return "aborted";
    const ok = await copyToClipboard(text);
    return ok.success ? "copied" : "failed";
  }
}