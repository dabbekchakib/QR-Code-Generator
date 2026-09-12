import type { QRType } from "@/types";

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type OperatingSystem =
  | "iOS"
  | "Android"
  | "Windows"
  | "macOS"
  | "Linux"
  | "ChromeOS"
  | "Other"
  | "Unknown";

export type Browser =
  | "Chrome"
  | "Safari"
  | "Firefox"
  | "Edge"
  | "Samsung Internet"
  | "Other"
  | "Unknown";

export const ANALYTICS_PERIODS = [
  "today",
  "7d",
  "30d",
  "90d",
  "all",
] as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

/** Selectable range keys: the five named periods plus a custom from/to range. */
export type AnalyticsRangeKey = AnalyticsPeriod | "custom";

/** Local calendar dates ("YYYY-MM-DD") of a custom period. */
export interface CustomRange {
  from: string;
  to: string;
}

/** The validated analytics filter state (period + optional QR + custom range). */
export interface AnalyticsSelection {
  period: AnalyticsRangeKey;
  qrId: string | null;
  custom: CustomRange | null;
}

/** Derived server-side from the User-Agent. No raw UA, no IP, no location. */
export interface ScanMetadata {
  deviceType: DeviceType;
  operatingSystem: OperatingSystem;
  browser: Browser;
}

export interface ScanSummary {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface TimeseriesPoint {
  bucket: string;
  count: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface TopQRItem {
  id: string;
  name: string;
  count: number;
}

/** Single payload served by get_qr_analytics for one (period, QR) filter. */
export interface AnalyticsPayload {
  summary: ScanSummary;
  timeseries: TimeseriesPoint[];
  topQrs: TopQRItem[];
  devices: BreakdownItem[];
  operatingSystems: BreakdownItem[];
  browsers: BreakdownItem[];
}

export interface DynamicQRItem {
  id: string;
  name: string;
}

export interface PeriodRange {
  /** Inclusive start (null = unbounded). */
  start: Date | null;
  /** Exclusive end (null = unbounded). */
  end: Date | null;
}

/** One row of the per-QR performance table (Dynamic QR codes only). */
export interface PerformanceRow {
  id: string;
  name: string;
  type: QRType;
  total: number;
  today: number;
  last7: number;
  last30: number;
  lastScannedAt: string | null;
}

/** One row of the 2..5 QR comparison. */
export interface ComparisonRow {
  id: string;
  name: string;
  type: QRType;
  total: number;
  lastScannedAt: string | null;
  timeseries: TimeseriesPoint[];
}

/** Audit row exposed by the export RPC (privacy-safe columns only). */
export interface ExportRow {
  qrName: string;
  qrType: string;
  scannedAt: string;
  device: string;
  operatingSystem: string;
  browser: string;
}

export interface ExportResult {
  rows: ExportRow[];
  total: number;
}