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

/** Decorative frame around the QR code. */
export type QRFrameType = "none" | "simple" | "rounded" | "badge" | "scan";

/** Center logo: a local image (never uploaded) drawn over the matrix. */
export interface QRDesignLogo {
  dataUrl: string;
  /** Logo width as a percentage of the QR width (default 15, warn above ~25). */
  size: number;
  /** White padding (px) around the logo inside its plate. */
  margin: number;
  shape: "square" | "rounded" | "circle";
}

export interface QRCustomization {
  size: number;
  margin: number;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrectionLevel;
  style: QRStyle;
  /** Phase 8 designer fields. Optional so records created before Phase 8 keep
   *  validating and rendering — `normalizeCustomization` fills safe defaults
   *  wherever the app actually reads them. */
  eyeStyle?: QRStyle;
  eyeColor?: string | null;
  frame?: QRFrameType;
  frameText?: string;
  logo?: QRDesignLogo | null;
  transparentBackground?: boolean;
  preset?: string | null;
}

/** A QRCustomization where every Phase 8 field is guaranteed to exist. */
export type ResolvedCustomization = QRCustomization & {
  eyeStyle: QRStyle;
  eyeColor: string | null;
  frame: QRFrameType;
  frameText: string;
  logo: QRDesignLogo | null;
  transparentBackground: boolean;
  preset: string | null;
};

export const DEFAULT_CUSTOMIZATION: ResolvedCustomization = {
  size: 512,
  margin: 4,
  foreground: "#000000",
  background: "#FFFFFF",
  errorCorrection: "M",
  style: "square",
  eyeStyle: "square",
  eyeColor: null,
  frame: "none",
  frameText: "",
  logo: null,
  transparentBackground: false,
  preset: "classic",
};

/**
 * Fill every Phase 8 field with a safe default. Applies to records written
 * before Phase 8 (and to any partially-edited customization) so the rest of
 * the app can read the fields without guards.
 */
export function normalizeCustomization(
  customization: QRCustomization
): ResolvedCustomization {
  return {
    ...customization,
    eyeStyle: customization.eyeStyle ?? "square",
    eyeColor: customization.eyeColor ?? null,
    frame: customization.frame ?? "none",
    frameText: customization.frameText ?? "",
    logo: customization.logo ?? null,
    transparentBackground: customization.transparentBackground ?? false,
    preset: customization.preset ?? null,
  };
}

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
