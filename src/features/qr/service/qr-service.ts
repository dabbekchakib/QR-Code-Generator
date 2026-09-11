import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseQRRepository } from "../cloud/supabase-repository";
import type { CloudQRRow } from "../cloud/types";
import { IndexedDBQRRepository } from "../storage/indexeddb";
import type { QRCodeRecord, CreateQRCodeRecord, QRStatus } from "../storage/types";
import { useSyncStore, type SyncStatusValue } from "../sync/sync-store";
import { processQueue } from "../sync/sync-engine";
import { createSyncOperation, type SyncOperation } from "../sync/types";
import {
  enqueue,
  pendingCount,
  discardOperationsForRecord,
  clearQueue,
} from "../sync/queue-store";
import { reconcileRecords } from "../sync/conflicts";
import {
  generateShortCode,
  MAX_SHORT_CODE_ATTEMPTS,
  DynamicQRError,
  isUniqueViolation,
  validateDynamicDestination,
} from "../dynamic";

const localRepo = new IndexedDBQRRepository();

let authClient: SupabaseClient | null = null;
let authUserId: string | null = null;
let cloudRepo: SupabaseQRRepository | null = null;

function setAuth(client: SupabaseClient | null, userId: string | null) {
  authClient = client;
  authUserId = userId;
  cloudRepo = client && userId
    ? new SupabaseQRRepository(client, userId)
    : null;
}

function isAuthed(): boolean {
  return !!authClient && !!authUserId && !!cloudRepo;
}

function toCloudRow(record: QRCodeRecord): CloudQRRow {
  return {
    id: record.id,
    user_id: authUserId!,
    name: record.name,
    type: record.type,
    values: record.values,
    customization: record.customization,
    favorite: record.favorite,
    is_dynamic: record.isDynamic,
    short_code: record.shortCode ?? null,
    destination_url: record.destinationUrl ?? null,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

async function updateStatus(status: SyncStatusValue) {
  useSyncStore.getState().setStatus(status);
}

async function refreshPendingCount() {
  const count = await pendingCount();
  useSyncStore.getState().setPendingCount(count);
}

async function pushMutation(op: SyncOperation) {
  if (!isAuthed()) return;
  const online = useSyncStore.getState().online;
  if (!online) {
    await enqueue(op);
    await refreshPendingCount();
    return;
  }
  try {
    await processSingleOp(op);
    await refreshPendingCount();
  } catch {
    await enqueue(op);
    await refreshPendingCount();
  }
}

async function processSingleOp(op: SyncOperation) {
  if (!isAuthed()) return;
  if (op.operation === "DELETE") {
    await cloudRepo!.delete(op.recordId);
  } else if (op.operation === "CREATE" && op.payload) {
    const row = op.payload as CloudQRRow;
    const existing = await cloudRepo!.get(op.recordId);
    if (existing) {
      await cloudRepo!.update({
        ...existing,
        name: row.name,
        type: row.type,
        values: row.values,
        customization: row.customization,
        favorite: row.favorite,
        isDynamic: row.is_dynamic,
        shortCode: row.short_code,
        destinationUrl: row.destination_url,
        status: row.status,
        updatedAt: row.updated_at,
      });
    } else {
      await cloudRepo!.create({
        id: op.recordId,
        name: row.name,
        type: row.type,
        values: row.values,
        customization: row.customization,
        favorite: row.favorite,
        isDynamic: row.is_dynamic,
        shortCode: row.short_code,
        destinationUrl: row.destination_url,
        status: row.status,
      });
    }
  } else if (op.operation === "UPDATE" && op.payload) {
    const row = op.payload as CloudQRRow;
    const existing = await cloudRepo!.get(op.recordId);
    if (existing) {
      await cloudRepo!.update({
        ...existing,
        name: row.name,
        type: row.type,
        values: row.values,
        customization: row.customization,
        favorite: row.favorite,
        isDynamic: row.is_dynamic,
        shortCode: row.short_code,
        destinationUrl: row.destination_url,
        status: row.status,
        updatedAt: row.updated_at,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

export const qrService = {
  bindAuth,
  clearAuth,
  list,
  get,
  refresh,
  create,
  createDynamic,
  update,
  updateDynamicDestination,
  setDynamicStatus,
  deleteRecord,
  pushLocalToCloud,
  syncNow,
  clearAll,
};

function bindAuth(client: SupabaseClient, userId: string) {
  setAuth(client, userId);
}

function clearAuth() {
  setAuth(null, null);
}

/** Return all local records, unconditionally. */
async function list(): Promise<QRCodeRecord[]> {
  return localRepo.list();
}

/** Get a single local record (cache-first). */
async function get(id: string): Promise<QRCodeRecord | null> {
  return localRepo.get(id);
}

/**
 * Cache-first: read local first, reconcile with cloud when authenticated and
 * online, then persist any cloud changes back to local storage.
 */
async function refresh(): Promise<QRCodeRecord[]> {
  const local = await localRepo.list();
  if (!isAuthed() || !useSyncStore.getState().online) return local;

  updateStatus("syncing");
  try {
    const cloud = await cloudRepo!.list();
    const merged = reconcileRecords(local, cloud);
    const changed = merged.filter((record) => {
      const existing = local.find((r) => r.id === record.id);
      return !existing || existing.updatedAt !== record.updatedAt;
    });
    if (changed.length > 0) {
      await localRepo.saveAll(merged);
    }
    updateStatus("synced");
    useSyncStore.getState().touchLastSync();
    await refreshPendingCount();
    return merged;
  } catch {
    updateStatus("error");
    return local;
  }
}

async function create(input: CreateQRCodeRecord): Promise<QRCodeRecord> {
  const local = await localRepo.create(input);
  if (isAuthed()) {
    const op = createSyncOperation("CREATE", local.id, toCloudRow(local));
    await pushMutation(op);
  }
  return local;
}

async function update(record: QRCodeRecord): Promise<QRCodeRecord> {
  const updated = await localRepo.update(record);
  if (isAuthed()) {
    const op = createSyncOperation("UPDATE", updated.id, toCloudRow(updated));
    await pushMutation(op);
  }
  return updated;
}

async function deleteRecord(id: string): Promise<void> {
  await localRepo.delete(id);
  if (isAuthed()) {
    await discardOperationsForRecord(id);
    const op = createSyncOperation("DELETE", id);
    await pushMutation(op);
  }
}

/** Push all local records to cloud, skipping any cloud id that already exists. */
async function pushLocalToCloud(
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (!isAuthed()) return 0;
  const local = await localRepo.list();
  let pushed = 0;

  for (let i = 0; i < local.length; i++) {
    const record = local[i];
    const existing = await cloudRepo!.get(record.id).catch(() => null);
    if (!existing) {
      try {
        await cloudRepo!.create({
          id: record.id,
          name: record.name,
          type: record.type,
          values: record.values,
          customization: record.customization,
          isDynamic: record.isDynamic,
          favorite: record.favorite,
          shortCode: record.shortCode,
          destinationUrl: record.destinationUrl,
          status: record.status,
        });
        pushed++;
      } catch {
        // Skip records that fail to push (will appear as local-only).
      }
    }
    onProgress?.(i + 1, local.length);
  }

  return pushed;
}

/** Process any pending queue entries, then refresh the local cache. */
async function syncNow(): Promise<QRCodeRecord[]> {
  if (!isAuthed()) return localRepo.list();
  updateStatus("syncing");
  await processQueue(authClient!, authUserId!);
  await refreshPendingCount();
  const merged = await refresh();
  return merged;
}

/**
 * Create a Dynamic QR code. Generates a fresh short code (cryptographically
 * random), stores the record locally first (offline cache-first), then pushes
 * it to Supabase when authenticated and online — retrying with a new code on a
 * unique-constraint collision. The destination is validated before anything is
 * written.
 *
 * @param preferredShortCode Optional code to try first (used so the on-screen
 * preview matches what is printed). Collisions transparently fall back to a
 * fresh code.
 */
async function createDynamic(
  input: {
    name: string;
    destinationUrl: string;
    customization: QRCodeRecord["customization"];
    favorite?: boolean;
    preferredShortCode?: string;
  }
): Promise<QRCodeRecord> {
  const destination = validateDynamicDestination(input.destinationUrl);

  for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt++) {
    const shortCode = attempt === 0 && input.preferredShortCode
      ? input.preferredShortCode
      : generateShortCode();

    const candidate: CreateQRCodeRecord = {
      name: input.name,
      type: "website",
      values: { url: destination },
      customization: input.customization,
      isDynamic: true,
      favorite: input.favorite ?? false,
      shortCode,
      destinationUrl: destination,
      status: "active",
    };

    try {
      const local = await localRepo.create(candidate);
      if (!isAuthed()) return local;

      if (!useSyncStore.getState().online) {
        const op = createSyncOperation("CREATE", local.id, toCloudRow(local));
        await enqueue(op);
        await refreshPendingCount();
        return local;
      }

      try {
        await processSingleOp(createSyncOperation("CREATE", local.id, toCloudRow(local)));
        await refreshPendingCount();
        return local;
      } catch (err) {
        if (isUniqueViolation(err) && attempt < MAX_SHORT_CODE_ATTEMPTS - 1) {
          // Short code collision on the cloud: undo the local write and retry
          // with a fresh code before the user ever sees the record.
          await localRepo.delete(local.id).catch(() => {});
          continue;
        }
        if (isUniqueViolation(err)) {
          await localRepo.delete(local.id).catch(() => {});
          throw new DynamicQRError("SHORT_CODE_GENERATION_FAILED");
        }
        // Any other cloud failure: keep the local record and let the sync
        // queue replay it later.
        const op = createSyncOperation("CREATE", local.id, toCloudRow(local));
        await enqueue(op);
        await refreshPendingCount();
        return local;
      }
    } catch (err) {
      if (isUniqueViolation(err) && attempt < MAX_SHORT_CODE_ATTEMPTS - 1) {
        continue;
      }
      if (isUniqueViolation(err)) {
        throw new DynamicQRError("SHORT_CODE_GENERATION_FAILED");
      }
      throw err instanceof DynamicQRError ? err : new DynamicQRError("SYNC_REQUIRED");
    }
  }

  throw new DynamicQRError("SHORT_CODE_GENERATION_FAILED");
}

/**
 * Edit the destination of a Dynamic QR code. The short code is preserved: the
 * same printed QR keeps redirecting to the new destination (updated_at is
 * refreshed so conflict resolution favours the newest edit, never the code).
 */
async function updateDynamicDestination(
  record: QRCodeRecord,
  destinationUrl: string
): Promise<QRCodeRecord> {
  if (!record.isDynamic) {
    throw new DynamicQRError("INVALID_DESTINATION", "Not a dynamic QR code");
  }
  const destination = validateDynamicDestination(destinationUrl);
  const updated: QRCodeRecord = {
    ...record,
    values: { url: destination } as QRCodeRecord["values"],
    destinationUrl: destination,
  };
  const saved = await update(updated);
  return saved;
}

/** Enable or disable a Dynamic QR (active <-> disabled). Short code never changes. */
async function setDynamicStatus(
  record: QRCodeRecord,
  status: QRStatus
): Promise<QRCodeRecord> {
  if (!record.isDynamic) return update(record);
  const updated: QRCodeRecord = { ...record, status };
  return update(updated);
}

/** For testing: clear local + cloud + sync queue. */
async function clearAll(): Promise<void> {
  if (isAuthed()) {
    await cloudRepo!.clear().catch(() => {});
    await clearQueue();
  }
  await localRepo.clear();
}
