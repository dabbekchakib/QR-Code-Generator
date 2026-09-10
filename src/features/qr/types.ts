import type { QRType } from "@/types";

export interface URLValues {
  url: string;
}

export interface WiFiValues {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "none";
  hidden: boolean;
}

export interface PhoneValues {
  phone: string;
}

export interface EmailValues {
  email: string;
  subject: string;
  message: string;
}

export interface WhatsAppValues {
  phone: string;
  message: string;
}

export interface VCardValues {
  firstName: string;
  lastName: string;
  organization: string;
  jobTitle: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  note: string;
}

export interface TextValues {
  text: string;
}

export type AnyFormValues =
  | URLValues
  | WiFiValues
  | PhoneValues
  | EmailValues
  | WhatsAppValues
  | VCardValues
  | TextValues;

export type QRFormValues =
  | { type: "website"; values: URLValues }
  | { type: "wifi"; values: WiFiValues }
  | { type: "phone"; values: PhoneValues }
  | { type: "email"; values: EmailValues }
  | { type: "whatsapp"; values: WhatsAppValues }
  | { type: "vcard"; values: VCardValues }
  | { type: "text"; values: TextValues };

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QRStyle = "square" | "rounded" | "dots";

export interface QRCustomization {
  size: number;
  margin: number;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrectionLevel;
  style: QRStyle;
}

export const DEFAULT_CUSTOMIZATION: QRCustomization = {
  size: 512,
  margin: 4,
  foreground: "#000000",
  background: "#FFFFFF",
  errorCorrection: "M",
  style: "square",
};

export const SIZE_OPTIONS = [256, 512, 768, 1024] as const;

export const ERROR_CORRECTION_INFO: Record<ErrorCorrectionLevel, string> = {
  L: "Low (~7% recovery)",
  M: "Medium (~15% recovery)",
  Q: "Quartile (~25% recovery)",
  H: "High (~30% recovery)",
};

export function getDefaultValues(type: QRType) {
  switch (type) {
    case "website":
      return { url: "" };
    case "wifi":
      return { ssid: "", password: "", security: "WPA" as const, hidden: false };
    case "phone":
      return { phone: "" };
    case "email":
      return { email: "", subject: "", message: "" };
    case "whatsapp":
      return { phone: "", message: "" };
    case "vcard":
      return {
        firstName: "",
        lastName: "",
        organization: "",
        jobTitle: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "",
        country: "",
        note: "",
      };
    case "text":
      return { text: "" };
  }
}
