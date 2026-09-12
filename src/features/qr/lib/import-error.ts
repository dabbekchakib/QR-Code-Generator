/**
 * Maps a backup-import failure (the English exceptions thrown by
 * `parseBackupJson`) to an i18n key, so user-facing toasts are translated and
 * internal messages never leak into the UI.
 */
const IMPORT_ERROR_KEYS: Record<string, string> = {
  "Empty backup file": "library.importEmpty",
  "Backup file too large": "library.importTooLarge",
  "Invalid JSON file": "library.importInvalidJson",
  "Invalid backup structure": "library.importInvalidStructure",
};

export function importErrorKey(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return IMPORT_ERROR_KEYS[message] ?? "library.importInvalidFile";
}