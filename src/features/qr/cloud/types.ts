import type { AnyFormValues, QRCustomization } from "../types";
import type { QRType } from "@/types";
import type { QRStatus } from "../storage/types";

export interface CloudQRRow {
  id: string;
  user_id: string;
  name: string;
  type: QRType;
  values: AnyFormValues;
  customization: QRCustomization;
  favorite: boolean;
  is_dynamic: boolean;
  short_code: string | null;
  destination_url: string | null;
  status: QRStatus;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Minimal projection returned by the public resolver RPC. */
export interface ResolvedDynamicQR {
  short_code: string;
  destination_url: string;
  status: string;
  is_dynamic: boolean;
}

export interface CloudProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}