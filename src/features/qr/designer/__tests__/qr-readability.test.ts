import { describe, it, expect } from "vitest";
import {
  assessQRDesign,
  checkQRContrast,
  LOGO_SAFE_ZONE_PERCENT,
  MIN_QUIET_ZONE_MODULES,
} from "../qr-readability";
import type { QRCustomization } from "../../types";

const BASE: QRCustomization = {
  size: 256,
  margin: 4,
  foreground: "#000000",
  background: "#FFFFFF",
  errorCorrection: "M",
  style: "square",
};

describe("checkQRContrast", () => {
  it("rates black on white as good and valid", () => {
    const r = checkQRContrast("#000000", "#FFFFFF");
    expect(r.valid).toBe(true);
    expect(r.level).toBe("good");
    expect(r.ratio).toBeCloseTo(21, 0);
  });

  it("rates mid-grey (#808080) on white as warning but still valid", () => {
    const r = checkQRContrast("#808080", "#FFFFFF");
    expect(r.valid).toBe(true);
    expect(r.level).toBe("warning");
    expect(r.ratio).toBeGreaterThanOrEqual(3);
    expect(r.ratio).toBeLessThan(4.5);
  });

  it("rates light-grey (#999999) on white as danger (invalid)", () => {
    const r = checkQRContrast("#999999", "#FFFFFF");
    expect(r.valid).toBe(false);
    expect(r.level).toBe("danger");
    expect(r.ratio).toBeLessThan(3);
  });
});

describe("assessQRDesign", () => {
  it("rates a clean classic design as good", () => {
    const a = assessQRDesign(BASE);
    expect(a.quality).toBe("good");
    expect(a.warnings.map((w) => w.code)).toEqual(["contrast"]);
    expect(a.warnings[0].level).toBe("good");
  });

  it("flags low margin, oversized logo and non-H correction", () => {
    const a = assessQRDesign({
      ...BASE,
      margin: 2,
      logo: { dataUrl: "data:image/png;base64,AA==", size: 30, margin: 6, shape: "square" },
    });
    const codes = a.warnings.map((w) => w.code);
    expect(codes).toContain("margin-low");
    expect(codes).toContain("logo-large");
    expect(codes).toContain("logo-without-high-correction");
    expect(a.quality).toBe("warning");
    expect(MIN_QUIET_ZONE_MODULES).toBe(4);
    expect(LOGO_SAFE_ZONE_PERCENT).toBe(25);
  });

  it("does not flag logo issues on a small logo with high correction", () => {
    const a = assessQRDesign({
      ...BASE,
      errorCorrection: "H",
      logo: { dataUrl: "data:image/png;base64,AA==", size: 15, margin: 6, shape: "rounded" },
    });
    const codes = a.warnings.map((w) => w.code);
    expect(codes).not.toContain("logo-large");
    expect(codes).not.toContain("logo-without-high-correction");
  });

  it("flags transparent backgrounds", () => {
    const a = assessQRDesign({ ...BASE, transparentBackground: true });
    expect(a.warnings.map((w) => w.code)).toContain("transparent-background");
    expect(a.quality).toBe("warning");
  });

  it("tags decorative styles as informational", () => {
    const a = assessQRDesign({ ...BASE, style: "dots", eyeStyle: "rounded", frame: "simple" });
    expect(a.warnings.map((w) => w.code)).toContain("decorative-style");
    expect(a.warnings.find((w) => w.code === "decorative-style")?.level).toBe("info");
  });

  it("degradrades to danger on unreadable contrast", () => {
    const a = assessQRDesign({ ...BASE, foreground: "#999999", margin: 0 });
    expect(a.quality).toBe("danger");
    expect(a.warnings.map((w) => w.code)).toContain("contrast");
  });
});