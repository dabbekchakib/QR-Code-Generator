import type { Metadata } from "next";
import { DashboardContent } from "@/features/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your QR Codes and analytics.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
