import type { QRCodeRecord, QRSortOption, QRStatusFilter } from "./types";
import type { QRType } from "@/types";

export interface QRSearchOptions {
  search?: string;
  status: QRStatusFilter;
  type?: QRType | "all";
  sort: QRSortOption;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function matchesStatus(record: QRCodeRecord, status: QRStatusFilter): boolean {
  switch (status) {
    case "all":
      return true;
    case "static":
      return !record.isDynamic;
    case "favorites":
      return record.favorite;
  }
}

function matchesType(record: QRCodeRecord, type: QRType | "all"): boolean {
  return type === "all" || record.type === type;
}

function matchesSearch(record: QRCodeRecord, search: string): boolean {
  if (!search) return true;
  const needle = normalizeSearch(search);
  return (
    record.name.toLowerCase().includes(needle) ||
    record.type.toLowerCase().includes(needle)
  );
}

export function filterAndSortRecords(
  records: QRCodeRecord[],
  options: QRSearchOptions
): QRCodeRecord[] {
  const filtered = records.filter(
    (r) =>
      matchesStatus(r, options.status) &&
      matchesType(r, options.type ?? "all") &&
      matchesSearch(r, options.search ?? "")
  );

  switch (options.sort) {
    case "updated":
      return filtered.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case "created":
      return filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "name-asc":
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return filtered.sort((a, b) => b.name.localeCompare(a.name));
  }
}

export function duplicateRecord(record: QRCodeRecord): QRCodeRecord {
  const now = new Date().toISOString();
  const base = record.name.replace(/\s+Copy(\s+\d+)?$/, "");
  const existing = base;
  return {
    ...record,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: `${existing} Copy`,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function formatUpdatedAt(iso: string, locale: string = "en"): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}