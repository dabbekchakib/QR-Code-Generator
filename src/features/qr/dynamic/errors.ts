/**
 * Controlled business errors for the Dynamic QR feature. These are the only
 * error surfaces the UI is allowed to display: raw Postgres/Supabase errors and
 * stack traces must stay out of the user interface.
 */
export type DynamicQRErrorCode =
  | "INVALID_DESTINATION"
  | "SHORT_CODE_COLLISION"
  | "SHORT_CODE_GENERATION_FAILED"
  | "QR_NOT_FOUND"
  | "QR_DISABLED"
  | "SYNC_REQUIRED";

export class DynamicQRError extends Error {
  readonly code: DynamicQRErrorCode;

  constructor(code: DynamicQRErrorCode, message?: string) {
    super(message ?? code);
    this.name = "DynamicQRError";
    this.code = code;
  }
}

export function isDynamicQRError(error: unknown): error is DynamicQRError {
  return error instanceof DynamicQRError;
}

export function isUniqueViolation(error: unknown): boolean {
  if (error && typeof error === "object") {
    const raw = (error as { message?: string; code?: string }).message ?? "";
    return (
      (error as { code?: string }).code === "23505" ||
      /duplicate key value violates unique constraint|unique constraint/i.test(raw)
    );
  }
  return false;
}

/** i18n key for a controlled error message, usable with getTranslation(). */
export function dynamicErrorKey(code: DynamicQRErrorCode): string {
  switch (code) {
    case "INVALID_DESTINATION":
      return "dynamicQr.errInvalidDestination";
    case "SHORT_CODE_COLLISION":
      return "dynamicQr.errShortCodeCollision";
    case "SHORT_CODE_GENERATION_FAILED":
      return "dynamicQr.errShortCodeGeneration";
    case "QR_NOT_FOUND":
      return "dynamicQr.qrNotFoundTitle";
    case "QR_DISABLED":
      return "dynamicQr.qrDisabledTitle";
    case "SYNC_REQUIRED":
      return "dynamicQr.syncRequired";
  }
}