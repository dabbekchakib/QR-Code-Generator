export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";
export type SyncEntity = "qr_codes";

export interface SyncOperation {
  id: string;
  entity: SyncEntity;
  operation: SyncOperationType;
  recordId: string;
  payload?: unknown;
  createdAt: string;
  retryCount: number;
  /**
   * The cloud account this operation belongs to. The queue is per-device and
   * per-user: a queued mutation must never be replayed into another account
   * when a different user signs in on the same device. `null` marks a legacy
   * operation enqueued before this field existed; it is attributed to whoever
   * processes it next.
   */
  userId: string | null;
}

export function createSyncOperation(
  operation: SyncOperationType,
  recordId: string,
  payload?: unknown,
  userId?: string | null
): SyncOperation {
  const now = new Date().toISOString();
  return {
    id: `${operation}-${recordId}-${Date.now()}`,
    entity: "qr_codes",
    operation,
    recordId,
    payload,
    createdAt: now,
    retryCount: 0,
    userId: userId ?? null,
  };
}

export const MAX_RETRY_COUNT = 5;