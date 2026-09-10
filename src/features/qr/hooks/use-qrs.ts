"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { qrRepository } from "../storage";
import type { QRCodeRecord } from "../storage";

interface UseQRsResult {
  records: QRCodeRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useQRs(): UseQRsResult {
  const [records, setRecords] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (showLoader: boolean) => {
    if (showLoader) setLoading(true);
    try {
      const data = await qrRepository.list();
      if (mounted.current) {
        setRecords(data);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error ? err.message : "Unable to load QR codes"
        );
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    mounted.current = true;
    const id = setTimeout(() => {
      void load(false);
    }, 0);
    return () => {
      clearTimeout(id);
      mounted.current = false;
    };
  }, [load]);

  return { records, loading, error, refresh };
}