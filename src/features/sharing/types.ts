import type { QRType } from "@/types";
import type { QRCustomization } from "@/features/qr/types";

/** What a share action works on: a record (from the library) or a draft
 *  (create page, no permanent URL / no DB id yet). */
export interface ShareTarget {
  name: string;
  isDynamic: boolean;
  /** The exact string the QR graphic encodes. */
  content: string;
  customization?: QRCustomization | null;
  /** QR type — used for a sensible download file name fallback. */
  type?: QRType;
  /** Dynamic QR codes: the public URL behind /qr/<shortCode>. */
  permanentUrl?: string | null;
  /** Dynamic QR codes only: is the public URL actually live yet? */
  published?: boolean;
  /** Optional context line shown in the share dialog (type, host…). */
  description?: string;
}