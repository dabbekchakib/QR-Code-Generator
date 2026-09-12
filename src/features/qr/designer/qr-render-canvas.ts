/**
 * Canvas renderer (browser). Draws the same command list as the SVG renderer
 * onto an HTMLCanvasElement so the live preview and the PNG export are
 * pixel-identical to the SVG export.
 */
import type { QRCustomization } from "../types";
import { normalizeCustomization } from "../types";
import {
  buildQRShapeCommands,
  type DrawCommand,
  getFrameTextStyle,
} from "./qr-shapes";
import { roundRectPath } from "./qr-matrix";
import { decodeLogoImage } from "./qr-logo";

function drawCommand(ctx: CanvasRenderingContext2D, cmd: DrawCommand): void {
  ctx.fillStyle = cmd.fill;
  switch (cmd.kind) {
    case "rect":
      ctx.fillRect(cmd.x, cmd.y, cmd.w, cmd.h);
      break;
    case "roundRect":
      roundRectPath(ctx, cmd.x, cmd.y, cmd.w, cmd.h, cmd.r);
      ctx.fill();
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(cmd.cx, cmd.cy, cmd.r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ring":
      ctx.beginPath();
      ctx.arc(cmd.cx, cmd.cy, cmd.rOuter, 0, Math.PI * 2);
      ctx.arc(cmd.cx, cmd.cy, cmd.rInner, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      break;
    case "roundRing": {
      ctx.beginPath();
      roundRectPath(ctx, cmd.x, cmd.y, cmd.w, cmd.h, cmd.r);
      roundRectPath(ctx, cmd.x + 1, cmd.y + 1, cmd.w - 2, cmd.h - 2, Math.max(0, cmd.r - 1));
      ctx.fill("evenodd");
      break;
    }
  }
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  dataUrl: string,
  logoBox: number,
  margin: number,
  shape: "square" | "rounded" | "circle",
  width: number,
  height: number,
  cx: number,
  cy: number
): Promise<void> {
  const img = await decodeLogoImage(dataUrl);
  const plateBox = logoBox + 2 * margin;
  const plateX = cx - plateBox / 2;
  const plateY = cy - plateBox / 2;
  const plateRadius = Math.min(plateBox * 0.18, 24);

  // White contrast plate so the logo never blends into busy module data.
  ctx.fillStyle = "#FFFFFF";
  roundRectPath(ctx, plateX, plateY, plateBox, plateBox, plateRadius);
  ctx.fill();

  if (!img) return;

  // Contain-fit within the logo box, preserving the source aspect ratio.
  let drawW = logoBox;
  let drawH = logoBox;
  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspect = img.naturalWidth / img.naturalHeight;
    if (aspect > 1) {
      drawH = logoBox / aspect;
    } else {
      drawW = logoBox * aspect;
    }
  }
  const imgX = plateX + margin + (logoBox - drawW) / 2;
  const imgY = plateY + margin + (logoBox - drawH) / 2;

  ctx.save();
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, plateBox / 2, 0, Math.PI * 2);
  } else if (shape === "rounded") {
    roundRectPath(ctx, plateX, plateY, plateBox, plateBox, plateRadius);
  } else {
    ctx.rect(plateX, plateY, plateBox, plateBox);
  }
  ctx.clip();
  ctx.drawImage(img, imgX, imgY, drawW, drawH);
  ctx.restore();
}

async function drawToContext(
  ctx: CanvasRenderingContext2D,
  content: string,
  customization: QRCustomization
): Promise<void> {
  const c = normalizeCustomization(customization);
  const { geometry, commands } = buildQRShapeCommands(content, c);
  const { totalWidth: w, totalHeight: h } = geometry;

  ctx.clearRect(0, 0, w, h);

  if (!c.transparentBackground) {
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, w, h);
  }

  const borderWidth = Math.max(2, geometry.modulePx * 0.12);
  const frameRadius = 0.75 * geometry.modulePx;
  if (c.frame === "badge" || c.frame === "scan") {
    if (!c.transparentBackground) {
      ctx.fillStyle = c.background;
      roundRectPath(ctx, borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth, frameRadius);
      ctx.fill();
    }
    ctx.strokeStyle = c.foreground;
    ctx.lineWidth = borderWidth;
    roundRectPath(ctx, borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth, frameRadius);
    ctx.stroke();
  } else if (c.frame === "simple" || c.frame === "rounded") {
    ctx.strokeStyle = c.foreground;
    ctx.lineWidth = borderWidth;
    if (c.frame === "rounded") {
      roundRectPath(ctx, borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth, frameRadius);
    } else {
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);
    }
    ctx.stroke();
  }

  for (const cmd of commands) {
    drawCommand(ctx, cmd);
  }

  const textStyle = getFrameTextStyle(geometry, c);
  if (c.logo) {
    const logoBox = (w * c.logo.size) / 100;
    await drawLogo(
      ctx,
      c.logo.dataUrl,
      logoBox,
      c.logo.margin,
      c.logo.shape,
      w,
      h,
      w / 2,
      h / 2
    );
  }

  if (textStyle) {
    ctx.fillStyle = textStyle.color;
    ctx.font = `700 ${textStyle.fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = textStyle.rtl ? "rtl" : "ltr";
    ctx.fillText(textStyle.text, textStyle.centerX, textStyle.centerY);
  }
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Render onto a provided canvas (used by the live preview). */
export async function renderDesignToCanvas(
  content: string,
  canvas: HTMLCanvasElement,
  customization: QRCustomization
): Promise<void> {
  if (!content) return;
  const c = normalizeCustomization(customization);
  const { geometry } = buildQRShapeCommands(content, c);
  const { totalWidth: w, totalHeight: h } = geometry;

  if (canvas.width !== Math.round(w) || canvas.height !== Math.round(h)) {
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  await drawToContext(ctx, content, c);
}

/** Render to a PNG data URL (used by previews and exports). */
export async function renderDesignToDataURL(
  content: string,
  customization: QRCustomization
): Promise<string> {
  const c = normalizeCustomization(customization);
  const { geometry } = buildQRShapeCommands(content, c);
  const canvas = makeCanvas(Math.round(geometry.totalWidth), Math.round(geometry.totalHeight));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  await drawToContext(ctx, content, c);
  return canvas.toDataURL("image/png");
}