"use client";

import { useEffect, useState } from "react";
import type { QRCodeRecord } from "../storage/types";
import { useSyncStore } from "../sync/sync-store";
import { hasPendingOperations } from "../sync/queue-store";
import { useAuth } from "@/lib/auth/use-auth";

export type PublicationStatus =
  | "not-published"
  | "pending"
  | "syncing"
  | "synced"
  | "offline";

export interface PublicationState {
  status: PublicationStatus;
  /** True only when a visitor can actually scan and open the public URL. */
  published: boolean;
}

/**
 * Tells whether a Dynamic QR code is live at its public URL.
 *
 * A record is considered published only when the user is signed in, online and
 * nothing is queued for that record. Offline/anonymous records are not live,
 * and queued (unsent) edits mean the public copy differs from what is shown.
 * Static QR codes always return `null`.
 */
export function useQRPublication(
  record: QRCodeRecord | null
): PublicationState | null {
  const { online, status: syncStatus } = useSyncStore();
  const { status: authStatus } = useAuth();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Not dynamic / offline / anonymous: nothing is queued for the record.
    if (!record?.isDynamic || !online || authStatus !== "authenticated") {
      queueMicrotask(() => {
        if (!cancelled) setPending(false);
      });
      return () => {
        cancelled = true;
      };
    }
    hasPendingOperations(record.id).then((has) => {
      if (!cancelled) setPending(has);
    });
    return () => {
      cancelled = true;
    };
  }, [record, online, authStatus]);

  if (!record?.isDynamic) return null;

  const status: PublicationStatus =
    !online
      ? "offline"
      : authStatus !== "authenticated"
        ? "not-published"
        : syncStatus === "syncing"
          ? "syncing"
          : pending
            ? "pending"
            : "synced";

  return { status, published: status === "synced" };
}