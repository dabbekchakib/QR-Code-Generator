export type QRType =
  | "website"
  | "wifi"
  | "phone"
  | "email"
  | "whatsapp"
  | "vcard"
  | "text";

export interface QRCode {
  id: string;
  userId: string;
  type: QRType;
  label: string;
  data: QRData;
  isDynamic: boolean;
  shortUrl?: string;
  createdAt: string;
  updatedAt: string;
  scanCount: number;
}

export interface QRData {
  content: string;
  [key: string]: string | undefined;
}

export interface WifiData extends QRData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "none";
}

export interface VCardData extends QRData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization?: string;
  title?: string;
  website?: string;
}

export interface ScanStats {
  totalScans: number;
  todayScans: number;
  topQR: Array<{
    id: string;
    label: string;
    scans: number;
  }>;
  dailyScans: Array<{
    date: string;
    scans: number;
  }>;
}

export interface DashboardStats {
  totalQRCodes: number;
  totalScans: number;
  todayScans: number;
}
