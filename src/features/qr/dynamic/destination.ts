import { z } from "zod";
import { DynamicQRError } from "./errors";

/**
 * Destination validation for Dynamic QR codes. Only http/https is accepted so
 * the public redirect can never become an open redirect to javascript:, data:,
 * file:, etc.
 */
export const destinationUrlSchema = z
  .string()
  .trim()
  .min(1, { message: "dynamicQr.errDestinationRequired" })
  .max(2048)
  .refine((value) => isSafeDestination(value), {
    message: "dynamicQr.errInvalidDestination",
  });

/**
 * Server-safe boolean check (also usable on the server route after the row is
 * fetched from Supabase, never trusting the client in isolation).
 */
export function isSafeDestination(value: string): boolean {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate a destination and return the normalized URL, or throw a controlled
 * DynamicQRError (never a raw Zod error) so callers can map it to a friendly
 * message.
 */
export function validateDynamicDestination(value: string): string {
  const result = destinationUrlSchema.safeParse(value);
  if (!result.success) {
    throw new DynamicQRError("INVALID_DESTINATION");
  }
  return result.data;
}