import type { Metadata } from "next";
import { QRDetailContent } from "@/features/qr/components/detail/qr-detail-content";

export const metadata: Metadata = {
  title: "QR Code Detail",
  description: "Preview, download, edit and manage your QR Code.",
};

export default function QRDetailPage() {
  return <QRDetailContent />;
}