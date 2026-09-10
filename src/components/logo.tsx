"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const iconSize = {
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  }[size];

  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative flex items-center justify-center rounded-xl bg-primary p-1.5 transition-transform group-hover:scale-105">
        <QrCode className={`${iconSize} text-primary-foreground`} strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${textSize} font-bold tracking-tight text-foreground`}>
          QR Manager
        </span>
      )}
    </Link>
  );
}
