import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAndTrack } from "@/features/analytics/services/redirect-service";
import {
  renderPublicError,
  localeFromAcceptLanguage,
} from "@/features/qr/dynamic/public-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public permanent URL of a Dynamic QR code: https://APP_URL/qr/<shortCode>.
 *
 * Resolution is fully server-side (no client JavaScript, no dashboard, no
 * account); the visitor is redirected with a 302 only when every check passes:
 * record exists, is_dynamic = true, status = active and the destination is a
 * safe http(s) URL — preventing any open-redirect abuse.
 *
 * Scans are recorded best-effort *after* the destination is validated. Tracking
 * failures are logged server-side and never block the redirect: one 200/302
 * response may therefore return zero or one stored scan.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;
  const locale = localeFromAcceptLanguage(request.headers.get("accept-language"));

  if (!shortCode || shortCode.length > 64) {
    return renderPublicError(locale, "notfound");
  }

  const supabase = await createClient();
  const outcome = await resolveAndTrack(
    supabase,
    shortCode,
    request.headers.get("user-agent")
  );

  switch (outcome.kind) {
    case "notfound":
      return renderPublicError(locale, "notfound");
    case "disabled":
      return renderPublicError(locale, "disabled");
    case "invalid":
      return renderPublicError(locale, "invalid");
    case "temporary":
      return renderPublicError(locale, "temporary");
    case "redirect":
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location: outcome.location,
          "X-Robots-Tag": "noindex, nofollow",
          "Cache-Control": "no-store",
        },
      });
  }
}