import type { QRCustomization } from "../types";
import { renderDesignToCanvas, renderDesignToDataURL } from "../designer/qr-render-canvas";
import { buildQRSVG } from "../designer/qr-render-svg";

/** Kept for API compatibility. Rendered output is produced by the designer
 *  renderers (which honour module/eye styles, frames, logos and transparency)
 *  instead of the qrcode library's direct drawing. */
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
  await renderDesignToCanvas(content, canvas, customization);
}

export async function renderQRToDataURL(
  content: string,
  customization: QRCustomization
): Promise<string> {
  return renderDesignToDataURL(content, customization);
}

export async function renderQRToSVG(
  content: string,
  customization: QRCustomization
): Promise<string> {
  return buildQRSVG(content, customization);
}