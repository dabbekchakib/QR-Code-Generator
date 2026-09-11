import type {
  CreateQRCodeRecord,
  QRCodeRecord,
  QRRepository,
} from "./types";
import type { QRType } from "@/types";
import { getDefaultValues } from "../types";
import { DB_STORE, createRecord, getDB, normalizeRecord } from "./db";

export { DB_NAME, DB_STORE, DB_VERSION } from "./db";

export class IndexedDBQRRepository implements QRRepository {
  async create(input: CreateQRCodeRecord): Promise<QRCodeRecord> {
    const db = await getDB();
    const record = createRecord({
      id: input.id,
      name: input.name,
      type: input.type,
      values: input.values,
      customization: input.customization,
      isDynamic: input.isDynamic,
      favorite: input.favorite,
      shortCode: input.shortCode,
      destinationUrl: input.destinationUrl,
      status: input.status,
    });
    await db.add(DB_STORE, record);
    return record;
  }

  async get(id: string): Promise<QRCodeRecord | null> {
    const db = await getDB();
    const record = await db.get(DB_STORE, id);
    return record ? normalizeRecord(record) : null;
  }

  async list(): Promise<QRCodeRecord[]> {
    const db = await getDB();
    const records = await db.getAll(DB_STORE);
    return records
      .map(normalizeRecord)
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  async update(record: QRCodeRecord): Promise<QRCodeRecord> {
    const db = await getDB();
    const updated = {
      ...normalizeRecord(record),
      updatedAt: new Date().toISOString(),
    };
    await db.put(DB_STORE, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(DB_STORE, id);
  }

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear(DB_STORE);
  }

  async saveAll(records: QRCodeRecord[]): Promise<void> {
    const db = await getDB();
    for (const record of records) {
      await db.put(DB_STORE, normalizeRecord(record));
    }
  }
}

export function createQRRepository(): QRRepository {
  return new IndexedDBQRRepository();
}

export function getDefaultName(type: QRType): string {
  switch (type) {
    case "website": return "Website";
    case "wifi": return "WiFi";
    case "phone": return "Phone";
    case "email": return "Email";
    case "whatsapp": return "WhatsApp";
    case "vcard": return "Business Card";
    case "text": return "Text";
  }
}

export function getDefaultValuesForType(type: QRType) {
  return getDefaultValues(type);
}