import QRCode from "qrcode";
import type { QRType } from "@/types";
import type { QRCustomization } from "../types";

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function getFilename(type: QRType, ext: string): string {
  return `qr-manager-${type}-${getTimestamp()}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPNG(
  content: string,
  type: QRType,
  customization: QRCustomization
): Promise<void> {
  const dataURL = await QRCode.toDataURL(content, {
    width: customization.size,
    margin: customization.margin,
    color: {
      dark: customization.foreground,
      light: customization.background,
    },
    errorCorrectionLevel: customization.errorCorrection,
  });
  const res = await fetch(dataURL);
  const blob = await res.blob();
  triggerDownload(blob, getFilename(type, "png"));
}

export async function downloadSVG(
  content: string,
  type: QRType,
  customization: QRCustomization
): Promise<void> {
  const svgString = await QRCode.toString(content, {
    type: "svg",
    width: customization.size,
    margin: customization.margin,
    color: {
      dark: customization.foreground,
      light: customization.background,
    },
    errorCorrectionLevel: customization.errorCorrection,
  });
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, getFilename(type, "svg"));
}
