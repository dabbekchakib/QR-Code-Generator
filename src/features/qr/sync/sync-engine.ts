import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncOperation } from "./types";
import { MAX_RETRY_COUNT } from "./types";
import { addOperation, listOperationsForUser, removeOperation, clearQueue } from "./queue-store";
import { isPermanentSyncError } from "./retry";
import { SupabaseQRRow } from "../cloud/supabase-repository";

export type ApplyResult = "ok" | "skipped" | "failed";

/** Throw the raw Postgrest error so recovery can inspect code/status/message. */
function toError(error: { message: string }): Error {
  return error as Error;
}

async function applyOperation(
  client: SupabaseClient,
  userId: string,
  op: SyncOperation
): Promise<ApplyResult> {
  if (op.operation === "DELETE") {
    const { error } = await client
      .from("qr_codes")
      .delete()
      .eq("id", op.recordId)
      .eq("user_id", userId);
    if (error) throw toError(error);
    return "ok";
  }
  if (op.operation === "UPDATE" && op.payload) {
    const payload = op.payload as Partial<SupabaseQRRow>;
    const { data, error } = await client
      .from("qr_codes")
      .update({
        name: payload.name,
        type: payload.type,
        values: payload.values,
        customization: payload.customization,
        favorite: payload.favorite,
        is_dynamic: payload.is_dynamic,
        short_code: payload.short_code,
        destination_url: payload.destination_url,
        status: payload.status,
        template_id: payload.template_id,
      } as never)
      .eq("id", op.recordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw toError(error);
    return data ? "ok" : "skipped";
  }
  if (op.operation === "CREATE" && op.payload) {
    const payload = op.payload as SupabaseQRRow;
    const { error } = await client
      .from("qr_codes")
      .upsert(
        {
          id: op.recordId,
          user_id: userId,
          name: payload.name,
          type: payload.type,
          values: payload.values,
          customization: payload.customization,
          favorite: payload.favorite,
          is_dynamic: payload.is_dynamic,
          short_code: payload.short_code,
          destination_url: payload.destination_url,
          status: payload.status,
          template_id: payload.template_id,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
        } as never,
        { onConflict: "id" }
      );
    if (error) throw toError(error);
    return "ok";
  }
  return "skipped";
}

export interface ProcessQueueResult {
  processed: number;
  failed: boolean;
  /** True when the failing operation can never succeed (dropped, no retry). */
  permanent?: boolean;
}

export async function processQueue(
  client: SupabaseClient,
  userId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessQueueResult> {
  // Only replay operations that belong to this account (legacy ops without a
  // userId are attributed to the current user). A queued mutation from another
  // account on the same device must never be written into this one.
  const ops = await listOperationsForUser(userId);
  let processed = 0;

  for (const op of ops) {
    try {
      await applyOperation(client, userId, op);
      await removeOperation(op.id);
      processed++;
      onProgress?.(processed, ops.length);
    } catch (error) {
      if (isPermanentSyncError(error)) {
        // Never retry: the entry is dropped and the UI is told it failed.
        await removeOperation(op.id);
        return { processed, failed: true, permanent: true };
      }
      if (op.retryCount + 1 >= MAX_RETRY_COUNT) {
        await removeOperation(op.id);
      } else {
        await addOperation({ ...op, retryCount: op.retryCount + 1 });
      }
      return { processed, failed: true, permanent: false };
    }
  }

  return { processed, failed: false };
}

export async function clearSyncQueue(): Promise<void> {
  return clearQueue();
}