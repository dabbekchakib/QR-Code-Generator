import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * Lightweight local preferences for templates (favorites + recently used).
 * Lives in its own small database so it never touches QR data and a privacy
 * wipe ("Clear all data") stays scoped to QR Codes. Templates keep working
 * even when this layer is unavailable (in-memory fallback).
 */

export const TEMPLATE_PREFS_DB = "qr-manager-template-prefs";
export const TEMPLATE_PREFS_STORE = "template-preferences";
const PREFS_VERSION = 1;

export interface TemplatePreference {
  id: string;
  favorite: boolean;
  lastUsedAt: number; // epoch ms, 0 = never used
}

interface TemplatePrefsDB extends DBSchema {
  "template-preferences": {
    key: string;
    value: TemplatePreference;
  };
}

let dbPromise: Promise<IDBPDatabase<TemplatePrefsDB>> | null = null;

function getPrefDB(): Promise<IDBPDatabase<TemplatePrefsDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (!dbPromise) {
    dbPromise = openDB<TemplatePrefsDB>(TEMPLATE_PREFS_DB, PREFS_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TEMPLATE_PREFS_STORE)) {
          db.createObjectStore(TEMPLATE_PREFS_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export function resetTemplatePrefsForTests(): void {
  dbPromise = null;
}

export async function getAllTemplatePreferences(): Promise<
  Record<string, TemplatePreference>
> {
  try {
    const db = await getPrefDB();
    const all = await db.getAll(TEMPLATE_PREFS_STORE);
    const map: Record<string, TemplatePreference> = {};
    for (const pref of all) map[pref.id] = pref;
    return map;
  } catch {
    return {};
  }
}

export async function setTemplateFavorite(
  id: string,
  favorite: boolean
): Promise<void> {
  try {
    const db = await getPrefDB();
    const existing = await db.get(TEMPLATE_PREFS_STORE, id);
    await db.put(TEMPLATE_PREFS_STORE, {
      id,
      favorite,
      lastUsedAt: existing?.lastUsedAt ?? 0,
    });
  } catch {
    // Preferences are non-essential: never let them break templates.
  }
}

export async function markTemplateUsed(id: string, at = Date.now()): Promise<void> {
  try {
    const db = await getPrefDB();
    const existing = await db.get(TEMPLATE_PREFS_STORE, id);
    await db.put(TEMPLATE_PREFS_STORE, {
      id,
      favorite: existing?.favorite ?? false,
      lastUsedAt: existing && existing.lastUsedAt > at ? existing.lastUsedAt : at,
    });
  } catch {
    // no-op
  }
}