import type { Metadata } from "next";
import { CreateQRContent } from "@/features/qr/create-qr-content";

export const metadata: Metadata = {
  title: "Create QR Code",
  description: "Create a new QR Code. Choose type, customize and generate.",
};

export default function CreateQRPage() {
  return <CreateQRContent />;
}
