"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" aria-label="QR Manager home">
              <Logo size="lg" showText={false} />
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}