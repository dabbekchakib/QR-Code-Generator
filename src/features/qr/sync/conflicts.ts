import type { QRCodeRecord } from "../storage/types";

/**
 * Conflict rule (spec §19): the most recently modified version wins.
 */
export function resolveConflict(local: QRCodeRecord, cloud: QRCodeRecord): QRCodeRecord {
  if (new Date(cloud.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
    return cloud;
  }
  return local;
}

export function isCloudNewer(localUpdatedAt: string, cloudUpdatedAt: string): boolean {
  return new Date(cloudUpdatedAt).getTime() > new Date(localUpdatedAt).getTime();
}

/**
 * Merge a local list with the cloud rows. Cloud-only records are added,
 * common records follow the newest-`updatedAt` rule, local-only records are
 * kept (they are pending offline creations backed by the sync queue).
 */
export function reconcileRecords(
  local: QRCodeRecord[],
  cloud: QRCodeRecord[]
): QRCodeRecord[] {
  const localById = new Map(local.map((r) => [r.id, r]));
  const cloudById = new Map(cloud.map((r) => [r.id, r]));
  const merged = new Map<string, QRCodeRecord>();

  for (const record of local) {
    const cloudRecord = cloudById.get(record.id);
    merged.set(
      record.id,
      cloudRecord ? resolveConflict(record, cloudRecord) : record
    );
  }
  for (const record of cloud) {
    if (!localById.has(record.id)) {
      merged.set(record.id, record);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}