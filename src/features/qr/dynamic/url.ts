import { DynamicQRError } from "./errors";

/**
 * The permanent, public URL of a Dynamic QR code. The domain always comes from
 * NEXT_PUBLIC_APP_URL (never hardcoded) and slash collisions are normalized.
 */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return raw.replace(/\/+$/, "");
}

export function isAppUrlConfigured(): boolean {
  return getAppBaseUrl().length > 0;
}

export function getDynamicQRUrl(shortCode: string): string {
  const base = getAppBaseUrl();
  if (!base) {
    throw new DynamicQRError("SYNC_REQUIRED", "NEXT_PUBLIC_APP_URL is not configured");
  }
  return `${base}/${encodeURIComponent(shortCode)}`.replace(/\/+$/, "");
}

/**
 * Fallback used while creating a QR on a device where NEXT_PUBLIC_APP_URL is
 * not set yet (local development without .env): the preview stays meaningful.
 */
export function getDynamicQRUrlWithFallback(shortCode: string): string {
  try {
    return getDynamicQRUrl(shortCode);
  } catch {
    return `/qr/${encodeURIComponent(shortCode)}`;
  }
}