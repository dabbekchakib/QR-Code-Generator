import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncOperation } from "./types";
import { MAX_RETRY_COUNT } from "./types";
import { addOperation, listOperations, removeOperation, clearQueue } from "./queue-store";
import { SupabaseQRRow } from "../cloud/supabase-repository";

export type ApplyResult = "ok" | "skipped" | "failed";

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
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
    return "ok";
  }
  return "skipped";
}

export interface ProcessQueueResult {
  processed: number;
  failed: boolean;
}

export async function processQueue(
  client: SupabaseClient,
  userId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessQueueResult> {
  const ops = await listOperations();
  let processed = 0;

  for (const op of ops) {
    try {
      await applyOperation(client, userId, op);
      await removeOperation(op.id);
      processed++;
      onProgress?.(processed, ops.length);
    } catch {
      if (op.retryCount + 1 >= MAX_RETRY_COUNT) {
        await removeOperation(op.id);
      } else {
        await addOperation({ ...op, retryCount: op.retryCount + 1 });
      }
      return { processed, failed: true };
    }
  }

  return { processed, failed: false };
}

export async function clearSyncQueue(): Promise<void> {
  return clearQueue();
}