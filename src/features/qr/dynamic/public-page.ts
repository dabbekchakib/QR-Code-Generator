import { getTranslation } from "@/i18n/translations";
import type { Locale } from "@/i18n/config";
import { defaultLocale, rtlLocales } from "@/i18n/config";

export type PublicErrorReason = "notfound" | "disabled" | "invalid" | "temporary";

const STATUS: Record<PublicErrorReason, number> = {
  notfound: 404,
  disabled: 410,
  invalid: 400,
  temporary: 503,
};

function keysFor(reason: PublicErrorReason): { title: string; message: string } {
  switch (reason) {
    case "notfound":
      return { title: "dynamicQr.qrNotFoundTitle", message: "dynamicQr.qrNotFoundDesc" };
    case "disabled":
      return { title: "dynamicQr.qrDisabledTitle", message: "dynamicQr.qrDisabledDesc" };
    case "invalid":
      return { title: "dynamicQr.invalidDestinationTitle", message: "dynamicQr.invalidDestinationDesc" };
    case "temporary":
      return { title: "dynamicQr.temporaryErrorTitle", message: "dynamicQr.temporaryErrorDesc" };
  }
}

/**
 * Minimal, self-contained HTML error page served for /qr/[shortCode] failures.
 * We answer directly from the route handler (correct HTTP status, no React
 * shell, no JavaScript) so the visitor always gets a fast, clean response.
 */
export function renderPublicError(
  locale: Locale,
  reason: PublicErrorReason
): Response {
  const { title, message } = keysFor(reason);
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";
  const status = STATUS[reason];

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>QR Manager — ${getTranslation(locale, title)}</title>
  <style>
    :root { --bg: #ffffff; --fg: #0f172a; --muted: #64748b; --border: #e2e8f0; --accent: #2563eb; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0f172a; --fg: #e2e8f0; --muted: #94a3b8; --border: #1e293b; --accent: #3b82f6; }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg); color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased; text-align: center; padding: 24px;
    }
    .card { max-width: 420px; width: 100%; }
    .mark { width: 56px; height: 8px; border-radius: 999px; background: var(--accent); margin: 0 auto 24px; }
    h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.01em; }
    p { font-size: 0.875rem; line-height: 1.6; color: var(--muted); margin: 0; }
    footer { margin-top: 32px; font-size: 0.75rem; color: var(--muted); }
  </style>
</head>
<body>
  <main class="card">
    <div class="mark" aria-hidden="true"></div>
    <h1>${getTranslation(locale, title)}</h1>
    <p>${getTranslation(locale, message)}</p>
    <footer>QR Manager &mdash; ${getTranslation(locale, "common.free")}</footer>
  </main>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}

export function localeFromAcceptLanguage(value: string | null | undefined): Locale {
  if (!value) return defaultLocale;
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("fr")) return "fr";
  if (first.startsWith("ar")) return "ar";
  if (first.startsWith("en")) return "en";
  return defaultLocale;
}