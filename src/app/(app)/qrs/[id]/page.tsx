import type { Metadata } from "next";
import { QRDetailContent } from "@/features/qr/components/detail/qr-detail-content";

export const metadata: Metadata = {
  title: "QR Code Detail",
  description: "Preview, download, edit and manage your QR Code.",
  robots: { index: false, follow: false },
};

export default function QRDetailPage() {
  return <QRDetailContent />;
}