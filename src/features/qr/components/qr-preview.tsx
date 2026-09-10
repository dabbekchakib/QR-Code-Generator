"use client";

import { useEffect, useRef } from "react";
import { renderQRToCanvas } from "../lib/qr-renderer";
import type { QRCustomization } from "../types";

interface QRPreviewProps {
  content: string;
  customization: QRCustomization;
}

export function QRPreview({ content, customization }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !content) return;
    let cancelled = false;
    renderQRToCanvas(content, canvasRef.current, customization).catch(() => {
      if (!cancelled) {
        // QR generation failed — content might be invalid
      }
    });
    return () => {
      cancelled = true;
    };
  }, [content, customization]);

  if (!content) {
    return (
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8">
        <p className="text-sm text-muted-foreground text-center">
          Fill in the form to see your QR code
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{ backgroundColor: customization.background }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Generated QR code"
          className="block max-w-full h-auto"
          style={{ width: Math.min(customization.size, 320), height: "auto" }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Generated locally in your browser
      </p>
    </div>
  );
}
