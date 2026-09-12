"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { qrService } from "@/features/qr/service/qr-service";
import { useSyncStore } from "@/features/qr/sync/sync-store";
import { pendingCountForUser } from "@/features/qr/sync/queue-store";

function getPromptKey(userId: string): string {
  return `qr-sync-prompt-v1-${userId}`;
}

export function syncPromptAlreadyShown(userId: string): boolean {
  try {
    return localStorage.getItem(getPromptKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markSyncPromptShown(userId: string): void {
  try {
    localStorage.setItem(getPromptKey(userId), "1");
  } catch {
    /* ignore */
  }
}

export function SyncManager() {
  const { status, user } = useAuth();
  const online = useSyncStore((s) => s.online);
  const promptedFor = useRef<string | null>(null);

  // Track browser online/offline state.
  useEffect(() => {
    const setOnline = () => useSyncStore.getState().setOnline(true);
    const setOffline = () => useSyncStore.getState().setOnline(false);
    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  // On first authenticated render, refresh pending count and possibly show
  // the first-login sync dialog when the user has local records.
  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    void pendingCountForUser(user.id)
      .then((count) => useSyncStore.getState().setPendingCount(count))
      .catch(() => useSyncStore.getState().setStorageError(true));

    if (promptedFor.current === user.id) return;
    promptedFor.current = user.id;

    void (async () => {
      const storedVersion = localStorage.getItem("qr-sync-prompt-v1");
      if (storedVersion === user.id) return;
      try {
        const records = await qrService.list();
        if (records.length === 0) {
          markSyncPromptShown(user.id);
          return;
        }
        useSyncStore.getState().setFirstSyncPrompt({
          cloudCount: records.length,
          resolve: (action) => {
            if (action === "push") {
              void qrService.pushLocalToCloud().then(() => {
                void qrService.syncNow();
              });
            }
            markSyncPromptShown(user.id);
            useSyncStore.getState().clearFirstSyncPrompt();
          },
        });
      } catch {
        useSyncStore.getState().setStorageError(true);
        markSyncPromptShown(user.id);
      }
    })();
  }, [status, user]);

  // Sync whenever the app comes back online while authenticated.
  useEffect(() => {
    if (status !== "authenticated" || !online) return;
    void qrService.syncNow().catch(() => {});
  }, [status, online]);

  return null;
}