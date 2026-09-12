import { describe, it, expect } from "vitest";
import { parseSafeUrl, isSafeUrl } from "../lib/open-safe-url";

describe("parseSafeUrl", () => {
  it("accepts https URLs", () => {
    expect(parseSafeUrl("https://example.com/path?q=1")).toEqual({
      ok: true,
      url: "https://example.com/path?q=1",
    });
  });

  it("accepts http URLs", () => {
    const result = parseSafeUrl("http://example.com");
    expect(result.ok).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    const result = parseSafeUrl("javascript:alert(1)");
    expect(result).toEqual({ ok: false, reason: "unsupported-scheme" });
  });

  it("rejects data: URLs", () => {
    expect(parseSafeUrl("data:text/html,<script>alert(1)</script>")).toEqual({
      ok: false,
      reason: "unsupported-scheme",
    });
  });

  it("rejects file: URLs", () => {
    expect(parseSafeUrl("file:///etc/passwd")).toEqual({
      ok: false,
      reason: "unsupported-scheme",
    });
  });

  it("rejects vbscript: URLs", () => {
    expect(parseSafeUrl("vbscript:msgbox(1)")).toEqual({
      ok: false,
      reason: "unsupported-scheme",
    });
  });

  it("rejects mixed-case dangerous schemes (Scheme normalization)", () => {
    expect(parseSafeUrl("JaVaScRiPt:alert(1)")).toEqual({
      ok: false,
      reason: "unsupported-scheme",
    });
  });

  it("rejects empty / whitespace values", () => {
    expect(parseSafeUrl("")).toEqual({ ok: false, reason: "empty" });
    expect(parseSafeUrl("   ")).toEqual({ ok: false, reason: "empty" });
    expect(parseSafeUrl(null)).toEqual({ ok: false, reason: "empty" });
    expect(parseSafeUrl(undefined)).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects malformed URLs", () => {
    expect(parseSafeUrl("not a url")).toEqual({
      ok: false,
      reason: "unsupported-scheme",
    });
  });
});

describe("isSafeUrl", () => {
  it("true for http(s), false for anything else", () => {
    expect(isSafeUrl("https://a.com")).toBe(true);
    expect(isSafeUrl("http://a.com")).toBe(true);
    expect(isSafeUrl("javascript:void(0)")).toBe(false);
    expect(isSafeUrl("data:image/png;base64,x")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});