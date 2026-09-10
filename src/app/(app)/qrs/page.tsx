import type { Metadata } from "next";
import { QRListContent } from "@/features/qr/qr-list-content";

export const metadata: Metadata = {
  title: "My QR Codes",
  description: "Manage all your QR Codes in one place.",
};

export default function QRsPage() {
  return <QRListContent />;
}
