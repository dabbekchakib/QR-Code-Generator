import { create } from "zustand";

export type SyncStatusValue = "idle" | "syncing" | "synced" | "error";

interface FirstSyncPrompt {
  cloudCount: number;
  resolve: (action: "push" | "keep" | "cancel") => void;
}

interface SyncState {
  status: SyncStatusValue;
  pendingCount: number;
  firstSyncPrompt: FirstSyncPrompt | null;
  lastSyncAt: string | null;
  online: boolean;
  /** True when IndexedDB is failing; the UI shows a user-facing message. */
  storageError: boolean;
  setStatus(status: SyncStatusValue): void;
  setPendingCount(count: number): void;
  setFirstSyncPrompt(prompt: FirstSyncPrompt | null): void;
  clearFirstSyncPrompt(): void;
  touchLastSync(): void;
  setOnline(online: boolean): void;
  setStorageError(hasError: boolean): void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",
  pendingCount: 0,
  firstSyncPrompt: null,
  lastSyncAt: null,
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  storageError: false,
  setStatus(status) {
    set({ status });
  },
  setPendingCount(count) {
    set({ pendingCount: count });
  },
  setFirstSyncPrompt(prompt) {
    set({ firstSyncPrompt: prompt });
  },
  clearFirstSyncPrompt() {
    set({ firstSyncPrompt: null });
  },
  touchLastSync() {
    set({ lastSyncAt: new Date().toISOString() });
  },
  setOnline(online) {
    set({ online });
  },
  setStorageError(hasError) {
    set({ storageError: hasError });
  },
}));