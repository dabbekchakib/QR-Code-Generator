"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "../lib/qr-clipboard";
import { getCopyLabel } from "../lib/qr-generator";
import type { QRType } from "@/types";

interface QRContentActionsProps {
  type: QRType;
  content: string;
}

export function QRContentActions({ type, content }: QRContentActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : getCopyLabel(type)}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-4" />
          {getCopyLabel(type)}
        </>
      )}
    </Button>
  );
}
