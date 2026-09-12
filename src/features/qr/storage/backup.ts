import { z } from "zod";
import { LOGO_DATA_URL_MAX_LENGTH } from "../designer/qr-logo";
import {
  urlSchema,
  wifiSchema,
  phoneSchema,
  emailSchema,
  whatsappSchema,
  vcardSchema,
  textSchema,
} from "../schemas";
import { normalizeCustomization } from "../types";
import type { QRCodeRecord } from "./types";

/** Import caps (Phase 11 hardening): one massive or hostile backup file must
 *  not stall the app or blow past local storage quotas. */
export const MAX_IMPORT_QR_CODES = 250;
export const MAX_IMPORT_JSON_BYTES = 50 * 1024 * 1024;

export const customizationSchema = z.object({
  size: z.number().int().min(64).max(2048),
  margin: z.number().int().min(0).max(32),
  foreground: z.string().min(1),
  background: z.string().min(1),
  errorCorrection: z.enum(["L", "M", "Q", "H"]),
  style: z.enum(["square", "rounded", "dots"]),
  eyeStyle: z.enum(["square", "rounded", "dots"]).optional(),
  eyeColor: z.string().min(1).nullable().optional(),
  frame: z.enum(["none", "simple", "rounded", "badge", "scan"]).optional(),
  frameText: z.string().max(30).optional(),
  logo: z
    .object({
      dataUrl: z.string().min(1).max(LOGO_DATA_URL_MAX_LENGTH),
      size: z.number().min(1).max(45),
      margin: z.number().min(0).max(64),
      shape: z.enum(["square", "rounded", "circle"]),
    })
    .nullable()
    .optional(),
  transparentBackground: z.boolean().optional(),
  preset: z.string().min(1).nullable().optional(),
});

const recordBase = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  customization: customizationSchema,
  isDynamic: z.boolean(),
  favorite: z.boolean(),
  shortCode: z.string().min(1).nullable().optional(),
  destinationUrl: z.string().min(1).nullable().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  templateId: z.string().min(1).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const qrRecordSchema = z
  .discriminatedUnion("type", [
    recordBase.extend({
      type: z.literal("website"),
      values: urlSchema,
    }),
    recordBase.extend({
      type: z.literal("wifi"),
      values: wifiSchema,
    }),
    recordBase.extend({
      type: z.literal("phone"),
      values: phoneSchema,
    }),
    recordBase.extend({
      type: z.literal("email"),
      values: emailSchema,
    }),
    recordBase.extend({
      type: z.literal("whatsapp"),
      values: whatsappSchema,
    }),
    recordBase.extend({
      type: z.literal("vcard"),
      values: vcardSchema,
    }),
    recordBase.extend({
      type: z.literal("text"),
      values: textSchema,
    }),
  ])
  .superRefine((row, ctx) => {
    if (row.isDynamic) {
      if (!row.shortCode || !row.destinationUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dynamic QR codes require shortCode and destinationUrl",
        });
      }
    }
  });

/**
 * Normalize a parsed backup record back to a full QRCodeRecord, filling the
 * Phase 5 defaults for fields that older backup files do not contain and the
 * Phase 8 design defaults for older customizations.
 */
export function recordFromBackup(record: QRRecordInput): QRCodeRecord {
  return {
    ...record,
    shortCode: record.shortCode ?? null,
    destinationUrl: record.destinationUrl ?? null,
    status: record.status ?? "active",
    templateId: record.templateId ?? null,
    customization: normalizeCustomization(record.customization),
  };
}

export const backupFileSchema = z.object({
  app: z.literal("qr-manager"),
  version: z.literal(1),
  exportedAt: z.string().optional(),
  qrCodeVersion: z.literal(1).optional(),
  qrCodes: z.array(qrRecordSchema).max(MAX_IMPORT_QR_CODES),
});

export type QRBackup = z.infer<typeof backupFileSchema>;
export type QRRecordInput = z.infer<typeof qrRecordSchema>;

export function buildBackupFile(records: QRCodeRecord[]): QRBackup {
  return {
    app: "qr-manager",
    version: 1,
    exportedAt: new Date().toISOString(),
    qrCodeVersion: 1,
    qrCodes: records as unknown as QRBackup["qrCodes"],
  };
}

export function parseBackupJson(raw: string): QRBackup {
  if (raw.length === 0) {
    throw new Error("Empty backup file");
  }
  if (raw.length > MAX_IMPORT_JSON_BYTES) {
    throw new Error("Backup file too large");
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file");
  }
  const parsed = backupFileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid backup structure");
  }
  return parsed.data;
}

export function isQrBackup(data: unknown): data is QRBackup {
  return backupFileSchema.safeParse(data).success;
}