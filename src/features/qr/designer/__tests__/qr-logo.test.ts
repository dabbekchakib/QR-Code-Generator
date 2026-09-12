import { describe, it, expect } from "vitest";
import {
  isSafeSvg,
  validateLogoDataUrl,
  validateLogoFile,
  LOGO_DATA_URL_MAX_LENGTH,
} from "../qr-logo";

const SAFE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#2563EB"/></svg>';

function toDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

describe("isSafeSvg", () => {
  it("accepts plain vector markup", () => {
    expect(isSafeSvg(SAFE_SVG)).toBe(true);
  });

  it("rejects embedded scripts", () => {
    expect(
      isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    ).toBe(false);
  });

  it("rejects event handler attributes", () => {
    expect(
      isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)"/></svg>')
    ).toBe(false);
  });

  it("rejects javascript: and data:text/html references", () => {
    expect(isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">x</a></svg>')).toBe(false);
    expect(isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><image href="data:text/html;base64,PHNjcmlwdD4="/></svg>')).toBe(false);
  });

  it("rejects foreignObject smuggling and external resources", () => {
    expect(isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>x</div></foreignObject></svg>')).toBe(false);
    expect(isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.svg"/></svg>')).toBe(false);
  });
});

describe("validateLogoDataUrl", () => {
  it("accepts a safe SVG data URL", () => {
    expect(validateLogoDataUrl(toDataUrl(SAFE_SVG))).toEqual({ ok: true });
  });

  it("rejects a malicious SVG data URL", () => {
    expect(
      validateLogoDataUrl(
        toDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
      )
    ).toEqual({ ok: false, error: "CONTENT" });
  });

  it("rejects non-image data URLs and oversized payloads", () => {
    expect(validateLogoDataUrl("data:text/plain;base64,AAAA")).toEqual({
      ok: false,
      error: "TYPE",
    });
    const huge = `data:image/png;base64,${"A".repeat(LOGO_DATA_URL_MAX_LENGTH + 1)}`;
    expect(validateLogoDataUrl(huge)).toEqual({ ok: false, error: "SIZE" });
  });
});

describe("validateLogoFile", () => {
  it("accepts accepted mime types within the size cap", () => {
    const file = new File(["x"], "logo.png", { type: "image/png" });
    expect(validateLogoFile(file)).toEqual({ ok: true });
  });

  it("rejects unsupported types and oversized files", () => {
    const bad = new File(["x"], "x.gif", { type: "image/gif" });
    expect(validateLogoFile(bad)).toEqual({ ok: false, error: "TYPE" });
    const big = new File([new ArrayBuffer(3 * 1024 * 1024)], "logo.png", {
      type: "image/png",
    });
    expect(validateLogoFile(big)).toEqual({ ok: false, error: "SIZE" });
  });
});