/**
 * Retry policy for the offline sync queue (spec Phase 11 §12).
 *
 * Transient failures (network, 5xx) are retried with an exponential backoff:
 * 1s, 2s, 4s, 8s — then capped. Permanent failures (401/403/404/422, row-level
 * security violations, constraint/validation errors) are never retried because
 * re-applying them cannot succeed and would only burn quota.
 */

export const RETRY_BASE_DELAY_MS = 1000;
export const RETRY_MAX_DELAY_MS = 8000;
export const MAX_SCHEDULED_RETRIES = 4;

/** Delay for the nth retry: 1s, 2s, 4s, 8s, then capped at the max. */
export function retryBackoffDelay(attempt: number): number {
  if (attempt <= 0) return RETRY_BASE_DELAY_MS;
  const delay = RETRY_BASE_DELAY_MS * 2 ** Math.min(attempt, 10);
  return Math.min(delay, RETRY_MAX_DELAY_MS);
}

const PERMANENT_HTTP_STATUS = new Set([401, 403, 404, 422]);

const PERMANENT_PG_CODES = new Set([
  "23502", // not-null violation
  "23503", // foreign key violation
  "23505", // unique violation
  "23514", // check violation
  "PGRST116", // resource not found
]);

const PERMANENT_MESSAGE = /permission denied|row.?level security|violates (foreign key|not-null|check constraint|unique constraint)|duplicate key|PGRST116|invalid input syntax/i;

/**
 * True when re-applying the operation can never succeed, so the entry must not
 * be retried. Network/TypeError/fetch failures and 5xx are transient.
 */
export function isPermanentSyncError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, status, message } = error as {
    code?: string | number;
    status?: number;
    message?: string;
  };
  if (typeof status === "number" && PERMANENT_HTTP_STATUS.has(status)) return true;
  if (typeof code === "string" && PERMANENT_PG_CODES.has(code)) return true;
  if (typeof message === "string" && PERMANENT_MESSAGE.test(message)) return true;
  return false;
}

/** True when the error comes from the network being unreachable. */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /failed to fetch|network|load failed|timed out/i.test(error.message))
  );
}