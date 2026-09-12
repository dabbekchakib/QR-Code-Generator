export type SafeUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: "empty" | "unsupported-scheme" };

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validate a URL before it is offered as an "Open" target. Only http:// and
 * https:// are permitted — javascript:, data:, file:, vbscript:, etc. are
 * rejected so a scanned/typed value can never execute in the page context.
 */
export function parseSafeUrl(input: string | null | undefined): SafeUrlResult {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  try {
    const url = new URL(trimmed);
    if (!SUPPORTED_PROTOCOLS.has(url.protocol)) {
      return { ok: false, reason: "unsupported-scheme" };
    }
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, reason: "unsupported-scheme" };
  }
}

export function isSafeUrl(input: string | null | undefined): boolean {
  return parseSafeUrl(input).ok;
}