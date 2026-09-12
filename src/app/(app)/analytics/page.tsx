import { Suspense } from "react";
import type { Metadata } from "next";
import { AnalyticsContent } from "@/features/analytics/components/analytics-content";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Track and analyze your QR Code scan statistics.",
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsContent />
    </Suspense>
  );
}