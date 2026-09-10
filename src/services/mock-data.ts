import type { DashboardStats, ScanStats } from "@/types";

export function getDashboardStats(): DashboardStats {
  return {
    totalQRCodes: 47,
    totalScans: 12482,
    todayScans: 328,
  };
}

export function getScanStats(): ScanStats {
  return {
    totalScans: 12482,
    todayScans: 328,
    topQR: [
      { id: "1", label: "Website", scans: 4821 },
      { id: "2", label: "Menu", scans: 3120 },
      { id: "3", label: "WhatsApp", scans: 2841 },
      { id: "4", label: "Contact", scans: 1700 },
    ],
    dailyScans: [
      { date: "Mon", scans: 280 },
      { date: "Tue", scans: 320 },
      { date: "Wed", scans: 410 },
      { date: "Thu", scans: 380 },
      { date: "Fri", scans: 520 },
      { date: "Sat", scans: 350 },
      { date: "Sun", scans: 328 },
    ],
  };
}
