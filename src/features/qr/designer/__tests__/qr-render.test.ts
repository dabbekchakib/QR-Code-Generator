import { describe, it, expect } from "vitest";
import { buildQRSVG } from "../qr-render-svg";
import { buildQRShapeCommands, getFrameTextStyle, isRtlText } from "../qr-shapes";
import { computeGeometry, getQRMatrix } from "../qr-matrix";
import type { ResolvedCustomization } from "../../types";

const CONTENT = "https://example.com";

const BASE: ResolvedCustomization = {
  size: 256,
  margin: 4,
  foreground: "#000000",
  background: "#FFFFFF",
  errorCorrection: "M",
  style: "square",
  eyeStyle: "square",
  eyeColor: null,
  frame: "none",
  frameText: "",
  logo: null,
  transparentBackground: false,
  preset: null,
};

describe("buildQRSVG", () => {
  it("emits a square viewBox with a background rect and module rects for the classic design", () => {
    const svg = buildQRSVG(CONTENT, BASE);
    const geometry = computeGeometry(BASE, getQRMatrix(CONTENT, "M").matrixSize);
    expect(svg).toContain(`viewBox="0 0 ${geometry.totalWidth} ${geometry.totalHeight}"`);
    expect(
      svg
    ).toContain(
      `<rect x="0" y="0" width="${geometry.totalWidth}" height="${geometry.totalHeight}" fill="#FFFFFF"/>`
    );
    expect(svg).toContain('fill="#000000"');
    expect(svg).not.toContain("<text");
    expect(svg).not.toContain("clipPath");
    expect(svg).toContain("</svg>");
  });

  it("escapes frame text and keeps it plain", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, frame: "badge", frameText: 'SCAN "ME" <now>' });
    expect(svg).toContain("SCAN &quot;ME&quot; &lt;now>");
  });

  it("renders rounded modules with a radius", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, style: "rounded", eyeStyle: "rounded" });
    expect(svg).toContain('rx="');
    expect(svg).toContain('fill-rule="evenodd"');
  });

  it("renders dots as circles", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, style: "dots", eyeStyle: "dots" });
    expect((svg.match(/<circle /g) || []).length).toBeGreaterThan(1);
  });

  it("draws a border for the simple frame", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, frame: "simple" });
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000000"');
  });

  it("adds plate, border and centered text for the badge frame", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, frame: "badge", frameText: "MENU" });
    expect(svg).toContain('<text ');
    expect(svg).toContain(">MENU</text>");
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('direction="ltr"');
  });

  it("renders RTL frame text with direction=rtl", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, frame: "scan", frameText: "مرحبا" });
    expect(svg).toContain('direction="rtl"');
    expect(svg).toContain("مرحبا");
  });

  it("emits no background rect for transparent designs", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, transparentBackground: true });
    const geometry = computeGeometry({ ...BASE, transparentBackground: true }, getQRMatrix(CONTENT, "M").matrixSize);
    expect(svg).not.toContain('fill="#FFFFFF"');
    expect(svg).toContain(`viewBox="0 0 ${geometry.totalWidth} ${geometry.totalHeight}"`);
  });

  it("keeps the plate but drops the background rect for transparent badge designs", () => {
    const svg = buildQRSVG(CONTENT, {
      ...BASE,
      frame: "badge",
      frameText: "MENU",
      transparentBackground: true,
    });
    expect(svg).not.toContain('fill="#FFFFFF"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000000"');
  });

  it("embeds a clipped logo image on a white plate", () => {
    const svg = buildQRSVG(CONTENT, {
      ...BASE,
      logo: {
        dataUrl: "data:image/png;base64,iVBORw0KGgo=",
        size: 15,
        margin: 6,
        shape: "circle",
      },
    });
    expect(svg).toContain('<clipPath id="qr-logo-clip"><circle');
    expect(svg).toContain('<image href="data:image/png;base64');
    expect(svg).toContain('<defs>');
  });

  it("uses an eye color for the finder pattern when set", () => {
    const svg = buildQRSVG(CONTENT, { ...BASE, eyeColor: "#1E40AF" });
    expect(svg).toContain('fill="#1E40AF"');
  });
});

describe("isRtlText", () => {
  it("detects arabic and hebrew scripts", () => {
    expect(isRtlText("مرحبا")).toBe(true);
    expect(isRtlText("שלום")).toBe(true);
    expect(isRtlText("HELLO")).toBe(false);
    expect(isRtlText("MENU 2026")).toBe(false);
  });
});

describe("buildQRShapeCommands", () => {
  it("produces commands whose geometry matches the SVG dimensions", () => {
    const { geometry, commands } = buildQRShapeCommands(CONTENT, { ...BASE });
    expect(commands.length).toBeGreaterThan(0);
    for (const cmd of commands) {
      const x = "x" in cmd ? (cmd as { x?: number }).x ?? 0 : "cx" in cmd ? (cmd as { cx: number }).cx - ((cmd as { r?: number }).r ?? 0) : 0;
      const y = "y" in cmd ? (cmd as { y?: number }).y ?? 0 : "cy" in cmd ? (cmd as { cy: number }).cy - ((cmd as { r?: number }).r ?? 0) : 0;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    }
    expect(geometry.totalWidth).toBe(256);
  });
});

describe("getFrameTextStyle", () => {
  it("returns null without a badge/scan frame or text", () => {
    const geometry = computeGeometry(BASE, getQRMatrix(CONTENT, "M").matrixSize);
    expect(getFrameTextStyle(geometry, { ...BASE })).toBeNull();
  });

  it("clamps the font size to the frame band", () => {
    const geometry = computeGeometry({ ...BASE, frame: "badge" }, getQRMatrix(CONTENT, "M").matrixSize);
    const style = getFrameTextStyle(geometry, { ...BASE, frame: "badge", frameText: "MENU" });
    expect(style).not.toBeNull();
    expect(style!.fontSize).toBeLessThanOrEqual(geometry.framePad.top * 0.85 + 1e-9);
  });
});