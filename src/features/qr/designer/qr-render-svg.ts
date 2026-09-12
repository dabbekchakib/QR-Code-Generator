/**
 * Pure SVG renderer. Node-safe (no DOM/canvas): given the content and a
 * customization it returns the full `<svg>` string so the exported SVG stays
 * a true vector graphic. Shares its geometry with the canvas renderer via
 * `qr-shapes`, so PNG and SVG match pixel for pixel.
 */
import type { QRCustomization } from "../types";
import { normalizeCustomization } from "../types";
import {
  buildQRShapeCommands,
  type DrawCommand,
  getFrameTextStyle,
} from "./qr-shapes";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function roundRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M ${x + radius},${y} ` +
    `H ${x + w - radius} ` +
    `A ${radius},${radius} 0 0 1 ${x + w},${y + radius} ` +
    `V ${y + h - radius} ` +
    `A ${radius},${radius} 0 0 1 ${x + w - radius},${y + h} ` +
    `H ${x + radius} ` +
    `A ${radius},${radius} 0 0 1 ${x},${y + h - radius} ` +
    `V ${y + radius} ` +
    `A ${radius},${radius} 0 0 1 ${x + radius},${y} ` +
    "Z"
  );
}

function circlePath(cx: number, cy: number, r: number): string {
  return (
    `M ${cx + r},${cy} ` +
    `A ${r},${r} 0 1,1 ${cx - r},${cy} ` +
    `A ${r},${r} 0 1,1 ${cx + r},${cy} ` +
    "Z"
  );
}

function commandToSvg(cmd: DrawCommand): string {
  switch (cmd.kind) {
    case "rect":
      return `<rect x="${cmd.x}" y="${cmd.y}" width="${cmd.w}" height="${cmd.h}" fill="${esc(cmd.fill)}"/>`;
    case "roundRect":
      return `<rect x="${cmd.x}" y="${cmd.y}" width="${cmd.w}" height="${cmd.h}" rx="${cmd.r}" fill="${esc(cmd.fill)}"/>`;
    case "circle":
      return `<circle cx="${cmd.cx}" cy="${cmd.cy}" r="${cmd.r}" fill="${esc(cmd.fill)}"/>`;
    case "ring": {
      const d =
        circlePath(cmd.cx, cmd.cy, cmd.rOuter) + " " + circlePath(cmd.cx, cmd.cy, cmd.rInner);
      return `<path fill-rule="evenodd" d="${d}" fill="${esc(cmd.fill)}"/>`;
    }
    case "roundRing": {
      const inner = 1;
      const innerRadius = Math.max(0, cmd.r - inner);
      const d =
        roundRectPath(cmd.x, cmd.y, cmd.w, cmd.h, cmd.r) +
        " " +
        roundRectPath(cmd.x + inner, cmd.y + inner, cmd.w - 2 * inner, cmd.h - 2 * inner, innerRadius);
      return `<path fill-rule="evenodd" d="${d}" fill="${esc(cmd.fill)}"/>`;
    }
  }
}

export function buildQRSVG(
  content: string,
  customization: QRCustomization
): string {
  const c = normalizeCustomization(customization);
  const { geometry, commands } = buildQRShapeCommands(content, c);
  const { totalWidth: w, totalHeight: h } = geometry;
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="QR Code">`);

  if (!c.transparentBackground) {
    parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="${esc(c.background)}"/>`);
  }

  // Decorative frame.
  const borderWidth = Math.max(2, geometry.modulePx * 0.12);
  const frameRadius = 0.75 * geometry.modulePx;
  if (c.frame === "badge" || c.frame === "scan") {
    const plate =
      !c.transparentBackground
        ? `<path fill="${esc(c.background)}" d="${roundRectPath(
            borderWidth / 2,
            borderWidth / 2,
            w - borderWidth,
            h - borderWidth,
            frameRadius
          )}"/>`
        : "";
    parts.push(
      plate +
        `<path fill="none" stroke="${esc(c.foreground)}" stroke-width="${borderWidth}" d="${roundRectPath(
          borderWidth / 2,
          borderWidth / 2,
          w - borderWidth,
          h - borderWidth,
          frameRadius
        )}"/>`
    );
  } else if (c.frame === "simple") {
    parts.push(
      `<rect x="${borderWidth / 2}" y="${borderWidth / 2}" width="${w - borderWidth}" height="${h - borderWidth}" fill="none" stroke="${esc(c.foreground)}" stroke-width="${borderWidth}"/>`
    );
  } else if (c.frame === "rounded") {
    parts.push(
      `<rect x="${borderWidth / 2}" y="${borderWidth / 2}" width="${w - borderWidth}" height="${h - borderWidth}" rx="${frameRadius}" fill="none" stroke="${esc(c.foreground)}" stroke-width="${borderWidth}"/>`
    );
  }

  for (const cmd of commands) {
    parts.push(commandToSvg(cmd));
  }

  // Center logo.
  const textStyle = getFrameTextStyle(geometry, c);
  if (c.logo) {
    const logoBox = (w * c.logo.size) / 100;
    const plateBox = logoBox + 2 * c.logo.margin;
    const cx = w / 2;
    const cy = h / 2;
    const plateX = cx - plateBox / 2;
    const plateY = cy - plateBox / 2;
    const clipId = "qr-logo-clip";
    let clip = "";
    if (c.logo.shape === "circle") {
      clip = `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${plateBox / 2}"/></clipPath>`;
    } else if (c.logo.shape === "rounded") {
      clip = `<clipPath id="${clipId}"><rect x="${plateX}" y="${plateY}" width="${plateBox}" height="${plateBox}" rx="${Math.min(plateBox * 0.18, 24)}"/></clipPath>`;
    } else {
      clip = `<clipPath id="${clipId}"><rect x="${plateX}" y="${plateY}" width="${plateBox}" height="${plateBox}"/></clipPath>`;
    }
    parts.push(`<defs>${clip}</defs>`);
    parts.push(
      `<rect x="${plateX}" y="${plateY}" width="${plateBox}" height="${plateBox}" rx="${Math.min(plateBox * 0.18, 24)}" fill="#FFFFFF"/>` +
        `<g clip-path="url(#${clipId})"><image href="${esc(c.logo.dataUrl)}" x="${plateX + c.logo.margin}" y="${plateY + c.logo.margin}" width="${logoBox}" height="${logoBox}" preserveAspectRatio="xMidYMid meet"/></g>`
    );
  }

  // Frame text (badge / scan).
  if (textStyle) {
    const dir = textStyle.rtl ? "rtl" : "ltr";
    parts.push(
      `<text x="${textStyle.centerX}" y="${textStyle.centerY}" text-anchor="middle" dominant-baseline="middle" direction="${dir}" font-family="sans-serif" font-size="${textStyle.fontSize}" font-weight="700" fill="${esc(textStyle.color)}">${esc(textStyle.text)}</text>`
    );
  }

  parts.push("</svg>");
  return parts.join("");
}