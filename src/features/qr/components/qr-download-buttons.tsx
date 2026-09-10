"use client";

import { useState } from "react";
import { Image as ImageIcon, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPNG, downloadSVG } from "../lib/qr-download";
import type { QRType } from "@/types";
import type { QRCustomization } from "../types";

interface QRDownloadButtonsProps {
  content: string;
  type: QRType;
  customization: QRCustomization;
}

export function QRDownloadButtons({
  content,
  type,
  customization,
}: QRDownloadButtonsProps) {
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);

  const handleDownloadPNG = async () => {
    setDownloading("png");
    try {
      await downloadPNG(content, type, customization);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadSVG = async () => {
    setDownloading("svg");
    try {
      await downloadSVG(content, type, customization);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPNG}
        disabled={downloading !== null}
      >
        <ImageIcon className="size-4" />
        {downloading === "png" ? "Saving..." : "Download PNG"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadSVG}
        disabled={downloading !== null}
      >
        <FileCode className="size-4" />
        {downloading === "svg" ? "Saving..." : "Download SVG"}
      </Button>
    </div>
  );
}
