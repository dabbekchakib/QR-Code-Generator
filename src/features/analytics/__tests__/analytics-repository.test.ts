import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchAnalyticsPayload,
  fetchDynamicQRs,
  recordScan,
  resolveDynamicQR,
} from "../repository";

type RpcFn = (fn: string, args?: Record<string, unknown>) => Promise<{
  data: unknown;
  error: { message: string } | null;
}>;

function client(rpc: RpcFn): SupabaseClient {
  return { rpc } as unknown as SupabaseClient;
}

function payloadRow(overrides: Record<string, unknown> = {}) {
  return {
    summary: { total: 250, today: 12, thisWeek: 40, thisMonth: 90 },
    timeseries: [
      { bucket: "2026-08-15", count: 10 },
      { bucket: "2026-08-14", count: 5 },
    ],
    topQrs: [
      { id: "qr-1", name: "Menu", count: 120 },
      { id: "qr-2", name: "WiFi", count: 30 },
    ],
    devices: [
      { label: "mobile", count: 160 },
      { label: "desktop", count: 90 },
    ],
    operatingSystems: [{ label: "Android", count: 100 }],
    browsers: [
      { label: "Chrome", count: 150 },
      { label: "Safari", count: 0 }, // zero rows must be dropped
    ],
    ...overrides,
  };
}

describe("fetchAnalyticsPayload", () => {
  it("forwards the QR, period and timezone window to the RPC", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const supabase = client(async (fn, args) => {
      if (fn === "get_qr_analytics") {
        calls.push(args ?? {});
        return { data: payloadRow(), error: null };
      }
      return { data: null, error: { message: "unknown fn" } };
    });

    await fetchAnalyticsPayload(supabase, {
      qrId: "qr-1",
      start: new Date("2026-08-15T00:00:00Z"),
      end: new Date("2026-08-15T23:59:00Z"),
      offsetMinutes: 240,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      p_qr_id: "qr-1",
      p_start: "2026-08-15T00:00:00.000Z",
      p_end: "2026-08-15T23:59:00.000Z",
      p_offset_minutes: 240,
    });
  });

  it("passes null boundaries for all time", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const supabase = client(async (fn, args) => {
      calls.push(args ?? {});
      return { data: payloadRow(), error: null };
    });
    await fetchAnalyticsPayload(supabase, { qrId: null, start: null, end: null, offsetMinutes: 0 });
    expect(calls[0].p_qr_id).toBeNull();
    expect(calls[0].p_start).toBeNull();
    expect(calls[0].p_end).toBeNull();
  });

  it("maps the payload into typed structures", async () => {
    const supabase = client(async () => ({ data: payloadRow(), error: null }));
    const payload = await fetchAnalyticsPayload(supabase, {
      qrId: null,
      start: null,
      end: null,
      offsetMinutes: 0,
    });

    expect(payload.summary).toEqual({ total: 250, today: 12, thisWeek: 40, thisMonth: 90 });
    expect(payload.timeseries).toHaveLength(2);
    expect(payload.timeseries[0]).toEqual({ bucket: "2026-08-15", count: 10 });
    expect(payload.topQrs).toHaveLength(2);
    expect(payload.topQrs[0]).toEqual({ id: "qr-1", name: "Menu", count: 120 });
    expect(payload.devices.map((d) => d.label)).toEqual(["mobile", "desktop"]);
    expect(payload.operatingSystems).toEqual([{ label: "Android", count: 100 }]);
    expect(payload.browsers).toEqual([{ label: "Chrome", count: 150 }]);
  });

  it("normalizes missing/zero data to 0 — never NaN or Infinity", async () => {
    const supabase = client(async () => ({
      data: {
        summary: null,
        timeseries: [],
        topQrs: null,
        devices: [],
        operatingSystems: null,
        browsers: null,
      },
      error: null,
    }));
    const payload = await fetchAnalyticsPayload(supabase, {
      qrId: null,
      start: null,
      end: null,
      offsetMinutes: 0,
    });

    expect(payload.summary.total).toBe(0);
    expect(payload.summary.today).toBe(0);
    expect(payload.summary.thisWeek).toBe(0);
    expect(payload.summary.thisMonth).toBe(0);
    expect(Number.isNaN(payload.summary.total)).toBe(false);
    expect(Number.isFinite(payload.summary.total)).toBe(true);
    expect(payload.timeseries).toEqual([]);
    expect(payload.topQrs).toEqual([]);
    expect(payload.devices).toEqual([]);
    expect(payload.operatingSystems).toEqual([]);
    expect(payload.browsers).toEqual([]);
  });

  it("throws when the RPC errors", async () => {
    const supabase = client(async () => ({ data: null, error: { message: "boom" } }));
    await expect(
      fetchAnalyticsPayload(supabase, { qrId: null, start: null, end: null, offsetMinutes: 0 })
    ).rejects.toThrow("boom");
  });
});

describe("resolveDynamicQR", () => {
  it("returns a resolved dynamic QR", async () => {
    const supabase = client(async () => ({
      data: {
        short_code: "abc123",
        destination_url: "https://example.com",
        status: "active",
        is_dynamic: true,
      },
      error: null,
    }));
    const result = await resolveDynamicQR(supabase, "abc123");
    expect(result?.short_code).toBe("abc123");
    expect(result?.is_dynamic).toBe(true);
  });

  it("returns null when nothing resolves", async () => {
    const supabase = client(async () => ({ data: [], error: null }));
    expect(await resolveDynamicQR(supabase, "abc123")).toBeNull();
  });

  it("throws on resolver errors", async () => {
    const supabase = client(async () => ({ data: null, error: { message: "fail" } }));
    await expect(resolveDynamicQR(supabase, "abc123")).rejects.toThrow("fail");
  });
});

describe("recordScan", () => {
  it("records one scan with the given metadata", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const supabase = client(async (fn, args) => {
      calls.push(args ?? {});
      return { data: null, error: null };
    });
    await recordScan(supabase, "abc123", {
      deviceType: "mobile",
      operatingSystem: "iOS",
      browser: "Safari",
    });
    expect(calls).toEqual([
      {
        p_short_code: "abc123",
        p_device_type: "mobile",
        p_operating_system: "iOS",
        p_browser: "Safari",
      },
    ]);
  });

  it("surfaces failures so the caller can keep the redirect going", async () => {
    const supabase = client(async () => ({ data: null, error: { message: "down" } }));
    await expect(
      recordScan(supabase, "abc123", {
        deviceType: "desktop",
        operatingSystem: "Windows",
        browser: "Chrome",
      })
    ).rejects.toThrow("down");
  });
});

describe("fetchDynamicQRs", () => {
  it("maps ids and names", async () => {
    const supabase = client(async () => ({
      data: [
        { id: "a", name: "Menu" },
        { id: "b", name: "WiFi" },
      ],
      error: null,
    }));
    const items = await fetchDynamicQRs(supabase);
    expect(items).toEqual([
      { id: "a", name: "Menu" },
      { id: "b", name: "WiFi" },
    ]);
  });

  it("returns an empty list on null data", async () => {
    const supabase = client(async () => ({ data: null, error: null }));
    expect(await fetchDynamicQRs(supabase)).toEqual([]);
  });

  it("throws on errors", async () => {
    const supabase = client(async () => ({ data: null, error: { message: "nope" } }));
    await expect(fetchDynamicQRs(supabase)).rejects.toThrow("nope");
  });
});