import type { AnyFormValues, QRCustomization } from "../types";
import type { QRType } from "@/types";

export interface CloudQRRow {
  id: string;
  user_id: string;
  name: string;
  type: QRType;
  values: AnyFormValues;
  customization: QRCustomization;
  favorite: boolean;
  is_dynamic: boolean;
  created_at: string;
  updated_at: string;
}

export interface CloudProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}