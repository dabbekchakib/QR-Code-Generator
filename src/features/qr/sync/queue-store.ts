import { DB_QUEUE_STORE, getDB } from "../storage/db";
import type { SyncOperation } from "./types";

export async function addOperation(op: SyncOperation): Promise<void> {
  const db = await getDB();
  await db.put(DB_QUEUE_STORE, op);
}

export async function removeOperation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DB_QUEUE_STORE, id);
}

export async function listOperations(): Promise<SyncOperation[]> {
  const db = await getDB();
  const ops = await db.getAll(DB_QUEUE_STORE);
  return ops.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.id.localeCompare(b.id)
  );
}

/**
 * Operations that belong to the given account. Legacy operations without a
 * `userId` (queued before user scoping existed) are attributed to the current
 * account so pre-upgrade pending changes are not lost.
 */
export async function listOperationsForUser(
  userId: string
): Promise<SyncOperation[]> {
  const all = await listOperations();
  return all.filter((op) => !op.userId || op.userId === userId);
}

export async function pendingCount(): Promise<number> {
  const db = await getDB();
  return db.count(DB_QUEUE_STORE);
}

/** Count of queued mutations for the given account (see listOperationsForUser). */
export async function pendingCountForUser(userId: string): Promise<number> {
  const all = await listOperations();
  return all.filter((op) => !op.userId || op.userId === userId).length;
}

/** Is there at least one queued mutation for a specific record? Used to tell a
 *  record with unsent changes (pending) from one that is fully published. */
export async function hasPendingOperations(recordId: string): Promise<boolean> {
  const db = await getDB();
  const all = await db.getAll(DB_QUEUE_STORE);
  return all.some((op) => op.recordId === recordId);
}

/**
 * Queue a mutation, coalescing against operations already queued for the same
 * record so we never replay an outdated value after a newer one.
 */
export async function enqueue(
  operation: SyncOperation
): Promise<void> {
  const db = await getDB();
  const existing = await db.getAll(DB_QUEUE_STORE);

  for (const op of existing) {
    if (op.recordId !== operation.recordId) continue;

    if (op.operation === "DELETE") {
      // A new CREATE/UPDATE after a queued DELETE means the record was
      // re-created locally: keep it within the same device by replacing the
      // DELETE with the newer operation.
      if (operation.operation === "DELETE") return; // duplicate delete
      await db.delete(DB_QUEUE_STORE, op.id);
      continue;
    }

    if (operation.operation === "DELETE") {
      // Deleting a record with queued CREATE/UPDATE supersedes them.
      await db.delete(DB_QUEUE_STORE, op.id);
      continue;
    }

    if (op.operation === "CREATE") {
      // Keep the CREATE but refresh its payload to the newest state so the
      // row is created with the latest values when it is replayed.
      await db.put(DB_QUEUE_STORE, {
        ...op,
        payload: operation.payload,
      });
      return;
    }

    // UPDATE supersedes a previous UPDATE.
    await db.delete(DB_QUEUE_STORE, op.id);
  }

  await db.put(DB_QUEUE_STORE, operation);
}

export async function discardOperationsForRecord(recordId: string): Promise<void> {
  const db = await getDB();
  const ops = await db.getAll(DB_QUEUE_STORE);
  for (const op of ops) {
    if (op.recordId === recordId) {
      await db.delete(DB_QUEUE_STORE, op.id);
    }
  }
}

export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(DB_QUEUE_STORE);
}