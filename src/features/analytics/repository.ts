import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalyticsPayload,
  BreakdownItem,
  DynamicQRItem,
  ScanMetadata,
  TimeseriesPoint,
  TopQRItem,
} from "./types";
import { toCount } from "./utils/format";
import type { ResolvedDynamicQR } from "@/features/qr/cloud/types";

export interface AnalyticsQueryOptions {
  /** Optional QR to filter by (must belong to the caller; validated in SQL). */
  qrId?: string | null;
  /** Inclusive window start (null = all time). */
  start?: Date | null;
  /** Exclusive window end (null = all time). */
  end?: Date | null;
  /** Minutes ahead of UTC (getTimezoneOffset() negated). */
  offsetMinutes: number;
}

function single<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] ?? null) as T | null;
  if (data && typeof data === "object") return data as T;
  return null;
}

function rows<T>(data: unknown): T[] {
  return (Array.isArray(data) ? data : []) as T[];
}

function breakdown(data: unknown): BreakdownItem[] {
  return rows<{ label?: unknown; count?: unknown }>(data)
    .map((item) => ({ label: String(item.label ?? "Unknown"), count: toCount(item.count) }))
    .filter((item) => item.count > 0);
}

function timeseries(data: unknown): TimeseriesPoint[] {
  return rows<{ bucket?: unknown; count?: unknown }>(data).map((item) => ({
    bucket: String(item.bucket ?? ""),
    count: toCount(item.count),
  }));
}

function topQrs(data: unknown): TopQRItem[] {
  return rows<{ id?: unknown; name?: unknown; count?: unknown }>(data)
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? "Unknown"),
      count: toCount(item.count),
    }))
    .filter((item) => item.id && item.count > 0);
}

/** Resolve a dynamic short code (public, allows anonymous). */
export async function resolveDynamicQR(
  client: SupabaseClient,
  shortCode: string
): Promise<ResolvedDynamicQR | null> {
  const { data, error } = await client
    .rpc("resolve_dynamic_qr", { p_short_code: shortCode });
  if (error) throw new Error(error.message);
  return single<ResolvedDynamicQR>(data as unknown);
}

/**
 * Best-effort scan recording. Server-side only: the short code is resolved to
 * a qr_code_id inside record_qr_scan(); the visitor never supplies an id, and
 * the function only creates a scan for an active dynamic QR with a destination.
 */
export async function recordScan(
  client: SupabaseClient,
  shortCode: string,
  metadata: ScanMetadata
): Promise<void> {
  const { error } = await client.rpc("record_qr_scan", {
    p_short_code: shortCode,
    p_device_type: metadata.deviceType,
    p_operating_system: metadata.operatingSystem,
    p_browser: metadata.browser,
  });
  // Tracking is best-effort: a failure is intentionally surfaced so the caller
  // can log it and keep the redirect going.
  if (error) throw new Error(error.message);
}

/** Full analytics payload for one (period, QR) filter. Ownership enforced in SQL. */
export async function fetchAnalyticsPayload(
  client: SupabaseClient,
  options: AnalyticsQueryOptions
): Promise<AnalyticsPayload> {
  const { data, error } = await client.rpc("get_qr_analytics", {
    p_qr_id: options.qrId ?? null,
    p_start: options.start?.toISOString() ?? null,
    p_end: options.end?.toISOString() ?? null,
    p_offset_minutes: options.offsetMinutes || 0,
  });
  if (error) throw new Error(error.message);

  const payload = (data as unknown) as {
    summary?: { total?: unknown; today?: unknown; thisWeek?: unknown; thisMonth?: unknown };
    timeseries?: unknown;
    topQrs?: unknown;
    devices?: unknown;
    operatingSystems?: unknown;
    browsers?: unknown;
  };

  return {
    summary: {
      total: toCount(payload.summary?.total),
      today: toCount(payload.summary?.today),
      thisWeek: toCount(payload.summary?.thisWeek),
      thisMonth: toCount(payload.summary?.thisMonth),
    },
    timeseries: timeseries(payload.timeseries),
    topQrs: topQrs(payload.topQrs),
    devices: breakdown(payload.devices),
    operatingSystems: breakdown(payload.operatingSystems),
    browsers: breakdown(payload.browsers),
  };
}

/** The owner's dynamic QR codes, for the filter dropdown. */
export async function fetchDynamicQRs(client: SupabaseClient): Promise<DynamicQRItem[]> {
  const { data, error } = await client.rpc("list_dynamic_qrs");
  if (error) throw new Error(error.message);
  return rows<{ id?: unknown; name?: unknown }>(data as unknown).map((item) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? "Unknown"),
  }));
}