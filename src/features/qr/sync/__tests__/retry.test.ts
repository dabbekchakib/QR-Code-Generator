import { describe, it, expect } from "vitest";
import {
  retryBackoffDelay,
  isPermanentSyncError,
  isNetworkError,
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_DELAY_MS,
} from "../retry";

describe("retryBackoffDelay", () => {
  it("starts at 1s and doubles (1s, 2s, 4s, 8s)", () => {
    expect(retryBackoffDelay(0)).toBe(RETRY_BASE_DELAY_MS);
    expect(retryBackoffDelay(1)).toBe(RETRY_BASE_DELAY_MS * 2);
    expect(retryBackoffDelay(2)).toBe(RETRY_BASE_DELAY_MS * 4);
    expect(retryBackoffDelay(3)).toBe(RETRY_BASE_DELAY_MS * 8);
  });

  it("caps at the max delay (8s) afterwards", () => {
    expect(retryBackoffDelay(4)).toBe(RETRY_MAX_DELAY_MS);
    expect(retryBackoffDelay(5)).toBe(RETRY_MAX_DELAY_MS);
    expect(retryBackoffDelay(50)).toBe(RETRY_MAX_DELAY_MS);
  });

  it("never returns a non-positive delay", () => {
    expect(retryBackoffDelay(-1)).toBe(RETRY_BASE_DELAY_MS);
  });
});

describe("isPermanentSyncError", () => {
  it("treats auth/forbidden/not-found/validation HTTP statuses as permanent", () => {
    expect(isPermanentSyncError({ status: 401, message: "Unauthorized" })).toBe(true);
    expect(isPermanentSyncError({ status: 403, message: "Forbidden" })).toBe(true);
    expect(isPermanentSyncError({ status: 404, message: "Not found" })).toBe(true);
    expect(isPermanentSyncError({ status: 422, message: "Unprocessable" })).toBe(true);
  });

  it("treats server errors and rate limits as transient", () => {
    expect(isPermanentSyncError({ status: 429, message: "Too many requests" })).toBe(false);
    expect(isPermanentSyncError({ status: 500, message: "Internal" })).toBe(false);
    expect(isPermanentSyncError({ status: 503, message: "Unavailable" })).toBe(false);
  });

  it("treats constraint/PG and PostgREST not-found codes as permanent", () => {
    expect(isPermanentSyncError({ code: "23505" })).toBe(true);
    expect(isPermanentSyncError({ code: "23514" })).toBe(true);
    expect(isPermanentSyncError({ code: "PGRST116" })).toBe(true);
  });

  it("detects row-level security / permission messages", () => {
    expect(
      isPermanentSyncError({ message: "permission denied for table qr_codes" })
    ).toBe(true);
    expect(
      isPermanentSyncError({ message: "new row violates row-level security policy" })
    ).toBe(true);
    expect(
      isPermanentSyncError({ message: 'duplicate key value violates unique constraint "qr_codes_short_code_unique"' })
    ).toBe(true);
  });

  it("treats network/TypeError failures as transient (never permanent)", () => {
    expect(isPermanentSyncError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isPermanentSyncError(new Error("network error"))).toBe(false);
    expect(isPermanentSyncError(null)).toBe(false);
    expect(isPermanentSyncError(undefined)).toBe(false);
  });
});

describe("isNetworkError", () => {
  it("recognises fetch TypeErrors and common network messages", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("Load failed"))).toBe(true);
    expect(isNetworkError(new Error("Network request failed"))).toBe(true);
  });

  it("rejects unrelated errors", () => {
    expect(isNetworkError(new Error("vdm qr_codes bad id"))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});