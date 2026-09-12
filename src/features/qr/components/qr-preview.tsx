"use client";

import { useEffect, useRef, useState } from "react";
import { renderQRToCanvas } from "../lib/qr-renderer";
import { useI18n } from "@/i18n/provider";
import type { QRCustomization } from "../types";

interface QRPreviewProps {
  content: string;
  customization: QRCustomization;
}

export function QRPreview({ content, customization }: QRPreviewProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !content) return;
    let cancelled = false;
    setHasError(false);
    renderQRToCanvas(content, canvasRef.current, customization).catch(() => {
      if (!cancelled) {
        setHasError(true);
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
          {t("create.previewEmpty")}
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8"
      >
        <p className="text-sm text-destructive text-center">
          {t("create.previewError")}
        </p>
      </div>
    );
  }

  const transparent = !!customization.transparentBackground;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{
          backgroundColor: transparent ? "transparent" : customization.background,
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t("create.previewAria")}
          className="block max-w-full h-auto"
          style={{ width: Math.min(customization.size, 320), height: "auto" }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {t("create.previewLocalNote")}
      </p>
    </div>
  );
}