import type { QRType } from "@/types";
import type {
  URLValues,
  WiFiValues,
  PhoneValues,
  EmailValues,
  WhatsAppValues,
  VCardValues,
  TextValues,
} from "../types";

function escapeWifiField(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/;/g, "\\;")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,");
}

function escapeVCard(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().*]/g, "");
}

function normalizeWhatsAppPhone(phone: string): string {
  const clean = phone.replace(/[\s\-().*]/g, "");
  return clean.startsWith("+") ? clean.slice(1) : clean;
}

function encodeQueryParam(val: string): string {
  return encodeURIComponent(val);
}

export function generateURLData(values: URLValues): string {
  let url = values.url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

export function generatePhoneData(values: PhoneValues): string {
  const clean = normalizePhone(values.phone);
  return `tel:${clean}`;
}

export function generateEmailData(values: EmailValues): string {
  const parts: string[] = [];
  if (values.subject.trim()) {
    parts.push(`subject=${encodeQueryParam(values.subject)}`);
  }
  if (values.message.trim()) {
    parts.push(`body=${encodeQueryParam(values.message)}`);
  }
  const query = parts.length > 0 ? `?${parts.join("&")}` : "";
  return `mailto:${values.email}${query}`;
}

export function generateWhatsAppData(values: WhatsAppValues): string {
  const phone = normalizeWhatsAppPhone(values.phone);
  const base = `https://wa.me/${phone}`;
  if (values.message.trim()) {
    return `${base}?text=${encodeQueryParam(values.message)}`;
  }
  return base;
}

export function generateWiFiData(values: WiFiValues): string {
  const security = values.security === "none" ? "nopass" : values.security;
  const ssid = escapeWifiField(values.ssid);
  const password = values.security === "none" ? "" : escapeWifiField(values.password);
  let result = `WIFI:T:${security};S:${ssid};`;
  if (password) {
    result += `P:${password};`;
  }
  if (values.hidden) {
    result += `H:true;`;
  }
  result += ";";
  return result;
}

export function generateVCardData(values: VCardValues): string {
  const fn = `${values.firstName} ${values.lastName}`.trim();
  const n = `${escapeVCard(values.lastName)};${escapeVCard(values.firstName)};;;`;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fn}`,
    `N:${n}`,
  ];
  if (values.organization) lines.push(`ORG:${escapeVCard(values.organization)}`);
  if (values.jobTitle) lines.push(`TITLE:${escapeVCard(values.jobTitle)}`);
  if (values.phone) lines.push(`TEL:${values.phone}`);
  if (values.email) lines.push(`EMAIL:${values.email}`);
  if (values.website) lines.push(`URL:${values.website}`);
  if (values.address || values.city || values.country) {
    const adr = `${escapeVCard(values.address)};${escapeVCard(values.city)};;;${escapeVCard(values.country)}`;
    lines.push(`ADR:${adr}`);
  }
  if (values.note) lines.push(`NOTE:${escapeVCard(values.note)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function generateTextData(values: TextValues): string {
  return values.text;
}

export function generateQRContent(
  type: QRType,
  values: URLValues | WiFiValues | PhoneValues | EmailValues | WhatsAppValues | VCardValues | TextValues
): string {
  switch (type) {
    case "website":
      return generateURLData(values as URLValues);
    case "wifi":
      return generateWiFiData(values as WiFiValues);
    case "phone":
      return generatePhoneData(values as PhoneValues);
    case "email":
      return generateEmailData(values as EmailValues);
    case "whatsapp":
      return generateWhatsAppData(values as WhatsAppValues);
    case "vcard":
      return generateVCardData(values as VCardValues);
    case "text":
      return generateTextData(values as TextValues);
  }
}

export function getCopyLabel(type: QRType): string {
  switch (type) {
    case "website":
      return "Copy URL";
    case "wifi":
      return "Copy WiFi data";
    case "phone":
      return "Copy phone number";
    case "email":
      return "Copy email";
    case "whatsapp":
      return "Copy WhatsApp link";
    case "vcard":
      return "Copy vCard";
    case "text":
      return "Copy text";
  }
}
