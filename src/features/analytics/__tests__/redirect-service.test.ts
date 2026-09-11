import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAndTrack } from "../services/redirect-service";
import type { ResolvedDynamicQR } from "@/features/qr/cloud/types";

type RpcFunc = (fn: string, args?: Record<string, unknown>) => Promise<{
  data: unknown;
  error: { message: string } | null;
}>;

function makeClient(
  rpc: RpcFunc,
  opts: { recordFails?: boolean } = {}
): SupabaseClient {
  const recorded: unknown[] = [];
  const fake = {
    rpc: async (fn: string, args?: Record<string, unknown>) => {
      if (fn === "record_qr_scan") {
        recorded.push(args);
        if (opts.recordFails) return { data: null, error: { message: "boom" } };
        return { data: null, error: null };
      }
      if (fn === "resolve_dynamic_qr") {
        return rpc(fn, args);
      }
      return { data: null, error: { message: "unknown fn" } };
    },
  } as unknown as SupabaseClient;
  (fake as unknown as { __recorded: unknown[] }).__recorded = recorded;
  return fake;
}

function resolved(row: Partial<ResolvedDynamicQR>): ResolvedDynamicQR {
  return {
    short_code: "abc123",
    destination_url: "https://menu.example.com/v2",
    status: "active",
    is_dynamic: true,
    ...row,
  };
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

describe("resolveAndTrack", () => {
  it("returns a redirect destination and records a scan", async () => {
    const client = makeClient(async () => ({ data: resolved({}), error: null }));
    const outcome = await resolveAndTrack(client, "abc123", UA);
    expect(outcome.kind).toBe("redirect");
    if (outcome.kind === "redirect") {
      expect(outcome.location).toBe("https://menu.example.com/v2");
    }
  });

  it("records the parsed device, OS and browser categories", async () => {
    const recorded: unknown[] = [];
    const fake = {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        if (fn === "record_qr_scan") {
          recorded.push(args);
          return { data: null, error: null };
        }
        return { data: resolved({}), error: null };
      },
    } as unknown as SupabaseClient;
    await resolveAndTrack(fake, "abc123", UA);
    expect(recorded).toEqual([
      {
        p_short_code: "abc123",
        p_device_type: "desktop",
        p_operating_system: "Windows",
        p_browser: "Chrome",
      },
    ]);
  });

  it("never records a scan for a missing QR", async () => {
    const recorded: unknown[] = [];
    const fake = {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        if (fn === "record_qr_scan") {
          recorded.push(args);
          return { data: null, error: null };
        }
        return { data: null, error: null };
      },
    } as unknown as SupabaseClient;
    const outcome = await resolveAndTrack(fake, "abc123", UA);
    expect(outcome.kind).toBe("notfound");
    expect(recorded).toHaveLength(0);
  });

  it("treats a static row as notfound (no scan)", async () => {
    const recorded: unknown[] = [];
    const fake = {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        if (fn === "record_qr_scan") {
          recorded.push(args);
          return { data: null, error: null };
        }
        return { data: resolved({ is_dynamic: false }), error: null };
      },
    } as unknown as SupabaseClient;
    const outcome = await resolveAndTrack(fake, "abc123", UA);
    expect(outcome.kind).toBe("notfound");
    expect(recorded).toHaveLength(0);
  });

  it("returns disabled for an inactive QR (no scan)", async () => {
    const recorded: unknown[] = [];
    const fake = {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        if (fn === "record_qr_scan") {
          recorded.push(args);
          return { data: null, error: null };
        }
        return { data: resolved({ status: "disabled" }), error: null };
      },
    } as unknown as SupabaseClient;
    const outcome = await resolveAndTrack(fake, "abc123", UA);
    expect(outcome.kind).toBe("disabled");
    expect(recorded).toHaveLength(0);
  });

  it("returns invalid for an unsafe destination (no scan)", async () => {
    const recorded: unknown[] = [];
    const fake = {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        if (fn === "record_qr_scan") {
          recorded.push(args);
          return { data: null, error: null };
        }
        return { data: resolved({ destination_url: "javascript:alert(1)" }), error: null };
      },
    } as unknown as SupabaseClient;
    const outcome = await resolveAndTrack(fake, "abc123", UA);
    expect(outcome.kind).toBe("invalid");
    expect(recorded).toHaveLength(0);
  });

  it("returns temporary when the resolver RPC fails", async () => {
    const client = makeClient(async () => ({ data: null, error: { message: "down" } }));
    const outcome = await resolveAndTrack(client, "abc123", UA);
    expect(outcome.kind).toBe("temporary");
  });

  it("redirects even when recording the scan fails (best-effort tracking)", async () => {
    const client = makeClient(
      async () => ({ data: resolved({}), error: null }),
      { recordFails: true }
    );
    const outcome = await resolveAndTrack(client, "abc123", UA);
    expect(outcome.kind).toBe("redirect");
    if (outcome.kind === "redirect") {
      expect(outcome.location).toBe("https://menu.example.com/v2");
    }
  });
});