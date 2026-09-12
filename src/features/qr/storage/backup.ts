import { z } from "zod";
import {
  urlSchema,
  wifiSchema,
  phoneSchema,
  emailSchema,
  whatsappSchema,
  vcardSchema,
  textSchema,
} from "../schemas";
import type { QRCodeRecord } from "./types";

export const customizationSchema = z.object({
  size: z.number().int().min(64).max(2048),
  margin: z.number().int().min(0).max(32),
  foreground: z.string().min(1),
  background: z.string().min(1),
  errorCorrection: z.enum(["L", "M", "Q", "H"]),
  style: z.enum(["square", "rounded", "dots"]),
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
 * Phase 5 defaults for fields that older backup files do not contain.
 */
export function recordFromBackup(record: QRRecordInput): QRCodeRecord {
  return {
    ...record,
    shortCode: record.shortCode ?? null,
    destinationUrl: record.destinationUrl ?? null,
    status: record.status ?? "active",
    templateId: record.templateId ?? null,
  };
}

export const backupFileSchema = z.object({
  app: z.literal("qr-manager"),
  version: z.literal(1),
  exportedAt: z.string().optional(),
  qrCodeVersion: z.literal(1).optional(),
  qrCodes: z.array(qrRecordSchema),
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