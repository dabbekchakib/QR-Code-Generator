"use client";

import { useEffect, useMemo, useState } from "react";
import { renderQRToDataURL } from "../lib/qr-renderer";
import { generateQRContent } from "../lib/qr-generator";
import type { QRCodeRecord } from "../storage";
import type { QRType } from "@/types";
import { useI18n } from "@/i18n/provider";

const PREVIEW_SIZE = 320;

export function useQRContent(record: QRCodeRecord | null): string {
  return useMemo(() => {
    if (!record) return "";
    try {
      return generateQRContent(record.type, record.values);
    } catch {
      return "";
    }
  }, [record]);
}

function previewToken(
  content: string,
  customization: QRCodeRecord["customization"] | null
): string {
  if (!content || !customization) return "";
  return [
    content,
    customization.size,
    customization.margin,
    customization.foreground,
    customization.background,
    customization.errorCorrection,
    customization.style,
  ].join("|");
}

export function useQRPreviewDataUrl(
  content: string,
  customization: QRCodeRecord["customization"] | null
): string | null {
  const token = useMemo(
    () => previewToken(content, customization),
    [content, customization]
  );
  const [preview, setPreview] = useState<{
    token: string;
    dataUrl: string | null;
  }>({ token: "", dataUrl: null });

  useEffect(() => {
    if (token === "" || !customization) return;
    let cancelled = false;
    renderQRToDataURL(content, { ...customization, size: PREVIEW_SIZE })
      .then((url) => {
        if (!cancelled) setPreview({ token, dataUrl: url });
      })
      .catch(() => {
        if (!cancelled) setPreview({ token, dataUrl: null });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return preview.token === token ? preview.dataUrl : null;
}

export function useQRTypeName(type: QRCodeRecord["type"] | null): string {
  const { t } = useI18n();
  return type ? t(`qrTypes.${type}.name`) : "";
}

export type { QRType };