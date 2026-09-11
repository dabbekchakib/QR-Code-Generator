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