"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  fetchAnalyticsPayload,
  fetchDynamicQRs,
} from "../repository";
import { getPeriodRange } from "../utils/periods";
import type {
  AnalyticsPayload,
  AnalyticsPeriod,
  DynamicQRItem,
  ScanSummary,
} from "../types";

function browserOffsetMinutes(): number {
  return -(new Date().getTimezoneOffset() || 0);
}

/**
 * Loads the combined analytics payload for one (period, QR) filter. A single
 * RPC serves every widget, so all of them always share the identical window
 * and QR filter. Returns loading/error/empty states; offline is handled by the
 * caller (no stale data is served).
 */
export function useAnalytics(
  qrId: string | null,
  period: AnalyticsPeriod
): {
  payload: AnalyticsPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const supabase = useMemo(() => createClient(), []);
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      setLoading(true);
      setError(null);

      if (status !== "authenticated" || !online) {
        setPayload(null);
        setLoading(false);
        return;
      }

      const offsetMinutes = browserOffsetMinutes();
      const range = getPeriodRange(period, offsetMinutes);

      (async () => {
        try {
          const data = await fetchAnalyticsPayload(supabase, {
            qrId,
            start: range.start,
            end: range.end,
            offsetMinutes,
          });
          if (!cancelled) {
            setPayload(data);
            setError(null);
          }
        } catch {
          if (!cancelled) {
            setPayload(null);
            setError("load_failed");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [supabase, status, online, qrId, period, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { payload, loading, error, refresh };
}

/** The owner's dynamic QR codes (filter dropdown). */
export function useDynamicQRs(enabled: boolean) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<DynamicQRItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const id = setTimeout(() => {
      setLoading(true);
      (async () => {
        try {
          const list = await fetchDynamicQRs(supabase);
          if (!cancelled) setItems(list);
        } catch {
          if (!cancelled) setItems([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [supabase, enabled]);

  return { items, loading };
}

/** All-time scan summary for the dashboard / detail widgets (needs 1 RPC). */
export function useScanSummary(): {
  summary: ScanSummary | null;
  loading: boolean;
} {
  const supabase = useMemo(() => createClient(), []);
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (status !== "authenticated" || !online) {
        setSummary(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      (async () => {
        try {
          const data = await fetchAnalyticsPayload(supabase, {
            qrId: null,
            start: null,
            end: null,
            offsetMinutes: browserOffsetMinutes(),
          });
          if (!cancelled) setSummary(data.summary);
        } catch {
          if (!cancelled) setSummary(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [supabase, status, online]);

  return { summary, loading };
}