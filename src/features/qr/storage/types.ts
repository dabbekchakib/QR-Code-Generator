import type { QRType } from "@/types";
import type { AnyFormValues, QRCustomization } from "../types";

export interface QRCodeRecord {
  id: string;
  name: string;
  type: QRType;
  values: AnyFormValues;
  customization: QRCustomization;
  isDynamic: boolean;
  favorite: boolean;
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
export type QRStatusFilter = "all" | "static" | "favorites";