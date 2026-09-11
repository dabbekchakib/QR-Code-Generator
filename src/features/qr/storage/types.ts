import type { QRType } from "@/types";
import type { AnyFormValues, QRCustomization } from "../types";

/** Lifecycle of a QR Code. Extended by future phases (e.g. analytics). */
export type QRStatus = "active" | "disabled";

export interface QRCodeRecord {
  id: string;
  name: string;
  type: QRType;
  values: AnyFormValues;
  customization: QRCustomization;
  isDynamic: boolean;
  favorite: boolean;
  /**
   * Public short code for dynamic QR codes. Static QR codes leave it null.
   * The graphic never changes: editing a destination keeps the short code.
   */
  shortCode?: string | null;
  destinationUrl?: string | null;
  /** "active" | "disabled". Old local records without it are treated as active. */
  status: QRStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRCodeRecord {
  id?: string;
  name: string;
  type: QRType;
  values: AnyFormValues;
  customization: QRCustomization;
  isDynamic?: boolean;
  favorite?: boolean;
  shortCode?: string | null;
  destinationUrl?: string | null;
  status?: QRStatus;
}

export interface QRRepository {
  create(input: CreateQRCodeRecord): Promise<QRCodeRecord>;
  get(id: string): Promise<QRCodeRecord | null>;
  list(): Promise<QRCodeRecord[]>;
  update(record: QRCodeRecord): Promise<QRCodeRecord>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type QRSortOption = "updated" | "created" | "name-asc" | "name-desc";
export type QRStatusFilter = "all" | "static" | "dynamic" | "favorites";