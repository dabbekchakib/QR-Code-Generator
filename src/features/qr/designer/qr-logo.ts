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
/** Base64 of LOGO_MAX_BYTES + slack: the largest legal dataUrl. Used to bound
 *  imported backup payloads and stored customizations. */
export const LOGO_DATA_URL_MAX_LENGTH = Math.ceil((LOGO_MAX_BYTES * 4) / 3) + 1024;
export const LOGO_SIZE_DEFAULT = 15;
export const LOGO_SIZE_MIN = 5;
export const LOGO_SIZE_MAX = 40;

export type LogoValidation =
  | { ok: true }
  | { ok: false; error: "TYPE" | "SIZE" | "CONTENT" };

/** Static validation: MIME type + size cap (2 MB). */
export function validateLogoFile(file: File): LogoValidation {
  if (!LOGO_ACCEPTED_MIME_TYPES.includes(file.type as (typeof LOGO_ACCEPTED_MIME_TYPES)[number])) {
    return { ok: false, error: "TYPE" };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, error: "SIZE" };
  }
  // The content of binary formats (PNG/JPEG/WebP) cannot smuggle active code
  // and is drawn via <img>/canvas, so the decodability gate is enough there.
  if (file.type === "image/svg+xml") {
    return { ok: true };
  }
  return { ok: true };
}

/**
 * Reject vectors that can carry active content: scripts, inline event
 * handlers, <foreignObject> smuggling HTML, javascript:/data:text/html URLs,
 * external references and CSS expressions. Kept conservative — anything that
 * even mentions a handler is refused rather than stripped.
 */
export function isSafeSvg(svg: string): boolean {
  const text = String(svg ?? "");
  if (/<script[\s>]/i.test(text)) return false;
  if (/<\/script>/i.test(text)) return false;
  if (/\son\w+\s*=\s*["']/i.test(text)) return false;
  if (/javascript\s*:/i.test(text)) return false;
  if (/vbscript\s*:/i.test(text)) return false;
  if (/data\s*:\s*text\s*\/\s*html/i.test(text)) return false;
  if (/<foreignobject[\s>]/i.test(text)) return false;
  if (/expression\s*\(/i.test(text)) return false;
  if (/\bsrc\s*=\s*["'](https?:)?\/\//i.test(text)) return false;
  if (/\bhref\s*=\s*["']https?:\/\//i.test(text)) return false;
  if (/\burl\s*\(\s*["']?\s*https?:\/\//i.test(text)) return false;
  return true;
}

/** Decode the payload of a data URL (base64 or percent-encoded). */
function decodeDataUrlPayload(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return "";
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    try {
      return atob(payload);
    } catch {
      return "";
    }
  }
  try {
    return decodeURIComponent(payload);
  } catch {
    return "";
  }
}

/**
 * Content validation for an already-read logo data URL. Non-SVG formats pass
 * (their pixels cannot execute) as long as the URL is well-formed; SVG payloads
 * must survive isSafeSvg().
 */
export function validateLogoDataUrl(dataUrl: string): LogoValidation {
  if (!/^data:image\/(png|jpeg|webp|svg\+xml);/i.test(dataUrl)) {
    return { ok: false, error: "TYPE" };
  }
  if (dataUrl.length > LOGO_DATA_URL_MAX_LENGTH) {
    return { ok: false, error: "SIZE" };
  }
  if (/^data:image\/svg\+xml/i.test(dataUrl)) {
    if (!isSafeSvg(decodeDataUrlPayload(dataUrl))) {
      return { ok: false, error: "CONTENT" };
    }
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