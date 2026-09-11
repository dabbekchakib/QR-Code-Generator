import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSafeDestination } from "@/features/qr/dynamic";
import type { ResolvedDynamicQR } from "@/features/qr/cloud/types";
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
 * account). The visitor is redirected with a 302 only when every check passes:
 * record exists, is_dynamic = true, status = active and the destination is a
 * safe http(s) URL — preventing any open-redirect abuse.
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

  let resolved: ResolvedDynamicQR | null;
  try {
    const { data, error } = await supabase
      .rpc("resolve_dynamic_qr", { p_short_code: shortCode })
      .maybeSingle();
    if (error) throw new Error(error.message);
    resolved = data as ResolvedDynamicQR | null;
  } catch {
    return renderPublicError(locale, "temporary");
  }

  if (!resolved || !resolved.is_dynamic) {
    return renderPublicError(locale, "notfound");
  }

  if (resolved.status !== "active") {
    // Gone: the code exists but has been disabled. Never redirect to it.
    return renderPublicError(locale, "disabled");
  }

  const destination = resolved.destination_url;
  if (!destination || !isSafeDestination(destination)) {
    // Data can only be written by the owner through RLS, but re-validate on
    // the server right before the redirect anyway.
    return renderPublicError(locale, "invalid");
  }

  const response = new NextResponse(null, {
    status: 302,
    headers: {
      Location: destination.trim(),
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
  return response;
}