import { describe, it, expect, afterEach, vi } from "vitest";
import { copyToClipboard } from "@/features/qr/lib/qr-clipboard";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubClipboard(writeText: ((t: string) => Promise<void>) | undefined) {
  vi.stubGlobal("navigator", {
    clipboard: writeText ? { writeText } : undefined,
  });
}

function stubLegacyDocument(execResult: boolean) {
  const textarea = {
    value: "",
    style: {},
    setAttribute: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn(),
  };
  vi.stubGlobal("document", {
    createElement: vi.fn(() => textarea),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    execCommand: vi.fn(() => execResult),
  });
}

describe("copyToClipboard", () => {
  it("uses the modern Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const result = await copyToClipboard("hello");
    expect(result).toEqual({ success: true });
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("returns success without side effects for an empty value", async () => {
    const writeText = vi.fn();
    stubClipboard(writeText);
    const result = await copyToClipboard("");
    expect(result.success).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to the legacy path when the modern API is missing", async () => {
    stubClipboard(undefined);
    stubLegacyDocument(true);
    const result = await copyToClipboard("legacy");
    expect(result).toEqual({ success: true });
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("reports a failure when no clipboard is available at all", async () => {
    stubClipboard(undefined);
    vi.stubGlobal("document", undefined);
    const result = await copyToClipboard("nope");
    expect(result.success).toBe(false);
    expect(result.error).toBe("clipboard-unavailable");
  });

  it("reports a failure when the legacy copy is rejected", async () => {
    stubClipboard(undefined);
    stubLegacyDocument(false);
    const result = await copyToClipboard("nope");
    expect(result.success).toBe(false);
  });

  it("falls back when the Clipboard API rejects", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("permission denied")));
    stubLegacyDocument(true);
    const result = await copyToClipboard("retry");
    expect(result.success).toBe(true);
  });
});