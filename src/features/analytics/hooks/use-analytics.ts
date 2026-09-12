"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  fetchAnalyticsPayload,
  fetchDynamicQRs,
  fetchQRComparison,
  fetchQRPerformance,
  fetchScansExport,
} from "../repository";
import { localOffsetMinutes, selectionToRange } from "../utils/analytics-filters";
import type {
  AnalyticsPayload,
  AnalyticsPeriod,
  AnalyticsSelection,
  ComparisonRow,
  DynamicQRItem,
  ExportResult,
  PerformanceRow,
  ScanSummary,
} from "../types";

/** Stable identity for a selection/deps array that can be used in effects. */
function keyOf(...parts: (string | number | null | undefined)[]): string {
  return parts.map((p) => String(p ?? "")).join("|");
}

/**
 * Loads the combined analytics payload for one selection (period + QR +
 * optional custom range). A single RPC serves every widget, so all of them
 * always share the identical window and QR filter. Offline / anonymous are
 * handled by the caller (no stale data is served); `lastUpdated` reflects a
 * genuine, successful server fetch only.
 */
export function useAnalytics(
  qrId: string | null,
  period: AnalyticsPeriod
) {
  return useAnalyticsSelection({ period, qrId, custom: null });
}

export function useAnalyticsSelection(selection: AnalyticsSelection): {
  payload: AnalyticsPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: string | null;
} {
  const supabase = useMemo(() => createClient(), []);
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const selectionKey = keyOf(
    selection.period,
    selection.qrId,
    selection.custom?.from ?? null,
    selection.custom?.to ?? null
  );

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      setError(null);
      if (status !== "authenticated" || !online) {
        setPayload(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const offsetMinutes = localOffsetMinutes();
      const range = selectionToRange(selection, offsetMinutes);

      (async () => {
        try {
          const data = await fetchAnalyticsPayload(supabase, {
            qrId: selection.qrId,
            start: range.start,
            end: range.end,
            offsetMinutes,
          });
          if (!cancelled) {
            setPayload(data);
            setLastUpdated(new Date().toISOString());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, status, online, selectionKey, selection.qrId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { payload, loading, error, refresh, lastUpdated };
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

/** Per-QR performance rows (Dynamic QR codes only) for the selected window. */
export function useQRPerformance(selection: AnalyticsSelection): {
  rows: PerformanceRow[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: string | null;
} {
  const supabase = useMemo(() => createClient(), []);
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [rows, setRows] = useState<PerformanceRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const selectionKey = keyOf(
    selection.period,
    selection.qrId,
    selection.custom?.from ?? null,
    selection.custom?.to ?? null
  );

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (status !== "authenticated" || !online) {
        setRows(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const offsetMinutes = localOffsetMinutes();
      const range = selectionToRange(selection, offsetMinutes);

      (async () => {
        try {
          const data = await fetchQRPerformance(supabase, {
            qrId: selection.qrId,
            start: range.start,
            end: range.end,
            offsetMinutes,
          });
          if (!cancelled) {
            setRows(data);
            setLastUpdated(new Date().toISOString());
          }
        } catch {
          if (!cancelled) {
            setRows(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, status, online, selectionKey, selection.qrId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { rows, loading, error, refresh, lastUpdated };
}

/** 2..5 QR comparison over the same window as the dashboard. */
export function useQRComparison(
  qrIds: string[],
  selection: AnalyticsSelection
): {
  rows: ComparisonRow[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const supabase = useMemo(() => createClient(), []);
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [rows, setRows] = useState<ComparisonRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const idsKey = keyOf(...qrIds);
  const selectionKey = keyOf(
    selection.period,
    selection.qrId,
    selection.custom?.from ?? null,
    selection.custom?.to ?? null
  );

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (status !== "authenticated" || !online || qrIds.length < 2) {
        setRows(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const offsetMinutes = localOffsetMinutes();
      const range = selectionToRange(selection, offsetMinutes);

      (async () => {
        try {
          const data = await fetchQRComparison(supabase, {
            qrIds,
            start: range.start,
            end: range.end,
            offsetMinutes,
          });
          if (!cancelled) setRows(data);
        } catch {
          if (!cancelled) {
            setRows(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, status, online, idsKey, selectionKey, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { rows, loading, error, refresh };
}

/** Raw audit rows for CSV / JSON export under the active filters. */
export function useScansExport(selection: AnalyticsSelection): {
  result: ExportResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const supabase = useMemo(() => createClient(), []);
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [result, setResult] = useState<ExportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const selectionKey = keyOf(
    selection.period,
    selection.qrId,
    selection.custom?.from ?? null,
    selection.custom?.to ?? null
  );

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (status !== "authenticated" || !online) {
        setResult(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const offsetMinutes = localOffsetMinutes();
      const range = selectionToRange(selection, offsetMinutes);

      (async () => {
        try {
          const data = await fetchScansExport(supabase, {
            qrId: selection.qrId,
            start: range.start,
            end: range.end,
            offsetMinutes,
          });
          if (!cancelled) setResult(data);
        } catch {
          if (!cancelled) {
            setResult(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, status, online, selectionKey, selection.qrId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { result, loading, error, refresh };
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
            offsetMinutes: localOffsetMinutes(),
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