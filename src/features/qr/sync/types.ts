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
}

export function createSyncOperation(
  operation: SyncOperationType,
  recordId: string,
  payload?: unknown
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
  };
}

export const MAX_RETRY_COUNT = 5;