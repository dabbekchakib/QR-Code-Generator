import QRCode from "qrcode";
import type { QRCustomization } from "../types";

export function getCanvasOptions(customization: QRCustomization) {
  return {
    width: customization.size,
    margin: customization.margin,
    color: {
      dark: customization.foreground,
      light: customization.background,
    },
    errorCorrectionLevel: customization.errorCorrection,
  };
}

export async function renderQRToCanvas(
  content: string,
  canvas: HTMLCanvasElement,
  customization: QRCustomization
): Promise<void> {
  await QRCode.toCanvas(canvas, content, getCanvasOptions(customization));
}

export async function renderQRToDataURL(
  content: string,
  customization: QRCustomization
): Promise<string> {
  return QRCode.toDataURL(content, {
    width: customization.size,
    margin: customization.margin,
    color: {
      dark: customization.foreground,
      light: customization.background,
    },
    errorCorrectionLevel: customization.errorCorrection,
  });
}

export async function renderQRToSVG(
  content: string,
  customization: QRCustomization
): Promise<string> {
  return QRCode.toString(content, {
    type: "svg",
    width: customization.size,
    margin: customization.margin,
    color: {
      dark: customization.foreground,
      light: customization.background,
    },
    errorCorrectionLevel: customization.errorCorrection,
  });
}
