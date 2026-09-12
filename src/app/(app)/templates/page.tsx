import type { Metadata } from "next";
import { TemplatesGallery } from "@/features/templates/components/templates-gallery";

export const metadata: Metadata = {
  title: "Templates",
  description: "Pre-built QR Code templates for quick creation.",
};

export default function TemplatesPage() {
  return <TemplatesGallery />;
}