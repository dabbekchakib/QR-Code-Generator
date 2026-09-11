import type { SupabaseClient } from "@supabase/supabase-js";
import { isSafeDestination } from "@/features/qr/dynamic";
import { resolveDynamicQR, recordScan } from "../repository";
import { parseUserAgent } from "../utils/ua";

export type RedirectOutcome =
  | { kind: "redirect"; location: string }
  | { kind: "notfound" }
  | { kind: "disabled" }
  | { kind: "invalid" }
  | { kind: "temporary" };

/**
 * Server-side resolution + best-effort scan tracking for the public /qr/[shortCode]
 * route (kept dependency-light so it can be unit tested against a fake client).
 *
 * Order of operations:
 *   1. resolve the QR (filters is_dynamic = true),
 *   2. refuse anything that is not an active dynamic QR with a valid destination,
 *   3. record the scan (never allowed to fail the redirect),
 *   4. hand back the safe destination for the 302.
 */
export async function resolveAndTrack(
  client: SupabaseClient,
  shortCode: string,
  userAgent: string | null | undefined
): Promise<RedirectOutcome> {
  let resolved;
  try {
    resolved = await resolveDynamicQR(client, shortCode);
  } catch {
    return { kind: "temporary" };
  }

  if (!resolved || !resolved.is_dynamic) return { kind: "notfound" };
  if (resolved.status !== "active") return { kind: "disabled" };

  const destination = resolved.destination_url;
  if (!destination || !isSafeDestination(destination)) {
    // Re-validated server-side right before redirecting; a bad destination
    // never produces a scan either.
    return { kind: "invalid" };
  }

  const metadata = parseUserAgent(userAgent);
  try {
    await recordScan(client, shortCode, metadata);
  } catch {
    // Tracking is secondary: measure, but never break the visitor's redirect.
    console.error(`[analytics] failed to record scan for ${shortCode}`);
  }

  return { kind: "redirect", location: destination.trim() };
}