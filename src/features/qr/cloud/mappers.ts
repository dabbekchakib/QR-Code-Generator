import type { CreateQRCodeRecord, QRCodeRecord } from "../storage/types";
import { validateCloudRow } from "./schemas";
import type { CloudProfileRow, CloudQRRow } from "./types";

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  return validateCloudRow({
    id: record.id ?? generateId(),
    user_id: userId,
    name: record.name,
    type: record.type,
    values: record.values,
    customization: record.customization,
    favorite: record.favorite ?? false,
    is_dynamic: record.isDynamic ?? false,
    created_at: hasTimestamps ? (record as QRCodeRecord).createdAt : now,
    updated_at: hasTimestamps ? (record as QRCodeRecord).updatedAt : now,
  });
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