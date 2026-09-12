import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../lib/qr-download";

describe("sanitizeFilename", () => {
  it("keeps letters, digits, `-` and `_`", () => {
    expect(sanitizeFilename("My Menu 2026_v1")).toBe("My-Menu-2026_v1");
  });

  it("collapses disallowed characters into single dashes and trims", () => {
    expect(sanitizeFilename('Mon "Super" QR! (final).png')).toBe("Mon-Super-QR-final-png");
  });

  it("strips leading and trailing dashes", () => {
    expect(sanitizeFilename("--hello--")).toBe("hello");
  });

  it("caps the length at 60 characters", () => {
    expect(sanitizeFilename("a".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("falls back to `qr` on empty input", () => {
    expect(sanitizeFilename("")).toBe("qr");
    expect(sanitizeFilename("   ")).toBe("qr");
    expect(sanitizeFilename("!!!")).toBe("qr");
  });

  it("handles non-ASCII accents by stripping diacritics", () => {
    expect(sanitizeFilename("Café")).toBe("Cafe");
  });
});