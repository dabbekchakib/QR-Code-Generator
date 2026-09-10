import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { QRCodeRecord } from "./types";
import type { SyncOperation } from "../sync/types";

export const DB_NAME = "qr-manager";
export const DB_STORE = "qr-codes";
export const DB_QUEUE_STORE = "sync-queue";
export const DB_VERSION = 2;

interface QRManagerDB extends DBSchema {
  "qr-codes": {
    key: string;
    value: QRCodeRecord;
  };
  "sync-queue": {
    key: string;
    value: SyncOperation;
  };
}

let dbPromise: Promise<IDBPDatabase<QRManagerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<QRManagerDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB<QRManagerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(DB_QUEUE_STORE)) {
          db.createObjectStore(DB_QUEUE_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export function resetDBForTests(): void {
  dbPromise = null;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRecord(input: {
  id?: string;
  name: string;
  type: QRCodeRecord["type"];
  values: QRCodeRecord["values"];
  customization: QRCodeRecord["customization"];
  isDynamic?: boolean;
  favorite?: boolean;
}): QRCodeRecord {
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