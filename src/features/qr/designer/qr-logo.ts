/**
 * Center-logo helpers. Logos are strictly local: they are read with
 * FileReader, validated (type / size / decodability) and then embedded in the
 * exported PNG/SVG. They are never uploaded or stored on Supabase — the
 * customization only keeps the data URL, which lives in the local IndexedDB.
 */
export const LOGO_ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_SIZE_DEFAULT = 15;
export const LOGO_SIZE_MIN = 5;
export const LOGO_SIZE_MAX = 40;

export type LogoValidation =
  | { ok: true }
  | { ok: false; error: "TYPE" | "SIZE" };

/** Static validation: MIME type + size cap (2 MB). */
export function validateLogoFile(file: File): LogoValidation {
  if (!LOGO_ACCEPTED_MIME_TYPES.includes(file.type as (typeof LOGO_ACCEPTED_MIME_TYPES)[number])) {
    return { ok: false, error: "TYPE" };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, error: "SIZE" };
  }
  return { ok: true };
}

/** Read a File into a data URL (browser FileReader). */
export function readLogoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Logo read failed"));
    reader.readAsDataURL(file);
  });
}

/** Decode a data URL to an in-memory image so an unreadable (corrupt) file can
 *  never reach the renderer. Returns null when the browser cannot decode it.
 *  Browser only. */
export function decodeLogoImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/** Clamp a logo size percentage to the allowed range. */
export function clampLogoSize(value: number): number {
  return Math.min(LOGO_SIZE_MAX, Math.max(LOGO_SIZE_MIN, value));
}