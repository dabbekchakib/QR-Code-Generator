import type { CreateQRCodeRecord, QRCodeRecord } from "../storage/types";
import type { CloudQRRowParsed } from "./schemas";
import { validateCloudRow } from "./schemas";
import type { CloudProfileRow, CloudQRRow } from "./types";

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Normalize a parsed/validated cloud row (whose Phase 5 fields are optional at
 * the schema level) into the full CloudQRRow type used across the app.
 */
export function normalizeCloudRow(parsed: CloudQRRowParsed): CloudQRRow {
  return {
    ...parsed,
    short_code: parsed.short_code ?? null,
    destination_url: parsed.destination_url ?? null,
    status: parsed.status ?? "active",
  } as CloudQRRow;
}

export function cloudRowToLocalRecord(row: CloudQRRow): QRCodeRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    values: row.values,
    customization: row.customization,
    isDynamic: row.is_dynamic,
    favorite: row.favorite,
    shortCode: row.short_code ?? null,
    destinationUrl: row.destination_url ?? null,
    status: row.status ?? "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function localRecordToCloudRow(
  record: QRCodeRecord | CreateQRCodeRecord,
  userId: string
): CloudQRRow {
  const now = new Date().toISOString();
  const hasTimestamps = "createdAt" in record && "updatedAt" in record;
  return normalizeCloudRow(
    validateCloudRow({
      id: record.id ?? generateId(),
      user_id: userId,
      name: record.name,
      type: record.type,
      values: record.values,
      customization: record.customization,
      favorite: record.favorite ?? false,
      is_dynamic: record.isDynamic ?? false,
      short_code: record.shortCode ?? null,
      destination_url: record.destinationUrl ?? null,
      status: record.status ?? "active",
      created_at: hasTimestamps ? (record as QRCodeRecord).createdAt : now,
      updated_at: hasTimestamps ? (record as QRCodeRecord).updatedAt : now,
    })
  );
}

export function mapCloudProfile(row: unknown): CloudProfileRow {
  const profile = row as CloudProfileRow;
  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name || null,
    avatar_url: profile.avatar_url || null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}