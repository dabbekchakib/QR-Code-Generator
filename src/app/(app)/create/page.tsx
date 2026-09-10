import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateQRContent } from "@/features/qr/create-qr-content";

export const metadata: Metadata = {
  title: "Create QR Code",
  description: "Create a new QR Code. Choose type, customize and generate.",
};

export default function CreateQRPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12 text-sm text-muted-foreground">Loading...</div>}>
      <CreateQRContent />
    </Suspense>
  );
}
