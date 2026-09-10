import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  CreateQRCodeRecord,
  QRCodeRecord,
  QRRepository,
} from "./types";
import type { QRType } from "@/types";
import { getDefaultValues } from "../types";

export const DB_NAME = "qr-manager";
export const DB_STORE = "qr-codes";
export const DB_VERSION = 1;

interface QRManagerDB extends DBSchema {
  "qr-codes": {
    key: string;
    value: QRCodeRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<QRManagerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<QRManagerDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB<QRManagerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRecord(
  input: CreateQRCodeRecord
): QRCodeRecord {
  const now = new Date().toISOString();
  return {
    id: input.id ?? generateId(),
    name: input.name.trim(),
    type: input.type,
    values: input.values,
    customization: input.customization,
    isDynamic: input.isDynamic ?? false,
    favorite: input.favorite ?? false,
    createdAt: now,
    updatedAt: now,
  };
}

export class IndexedDBQRRepository implements QRRepository {
  async create(input: CreateQRCodeRecord): Promise<QRCodeRecord> {
    const db = await getDB();
    const record = createRecord(input);
    await db.add(DB_STORE, record);
    return record;
  }

  async get(id: string): Promise<QRCodeRecord | null> {
    const db = await getDB();
    return (await db.get(DB_STORE, id)) ?? null;
  }

  async list(): Promise<QRCodeRecord[]> {
    const db = await getDB();
    const records = await db.getAll(DB_STORE);
    return records.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async update(record: QRCodeRecord): Promise<QRCodeRecord> {
    const db = await getDB();
    const updated = { ...record, updatedAt: new Date().toISOString() };
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