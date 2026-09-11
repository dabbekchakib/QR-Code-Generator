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
import { customizationSchema } from "../storage/backup";

const rowBase = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  name: z.string().min(1).max(200),
  customization: customizationSchema,
  favorite: z.boolean(),
  is_dynamic: z.boolean(),
  short_code: z.string().min(1).nullable().optional(),
  destination_url: z.string().min(1).nullable().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Phase 5 extension: a dynamic QR must carry a short code and a destination.
 * Static QR codes leave them null. status defaults to "active" so legacy rows
 * pass validation unchanged.
 */
export const cloudQRRowSchema = z
  .discriminatedUnion("type", [
    rowBase.extend({ type: z.literal("website"), values: urlSchema }),
    rowBase.extend({ type: z.literal("wifi"), values: wifiSchema }),
    rowBase.extend({ type: z.literal("phone"), values: phoneSchema }),
    rowBase.extend({ type: z.literal("email"), values: emailSchema }),
    rowBase.extend({ type: z.literal("whatsapp"), values: whatsappSchema }),
    rowBase.extend({ type: z.literal("vcard"), values: vcardSchema }),
    rowBase.extend({ type: z.literal("text"), values: textSchema }),
  ])
  .superRefine((row, ctx) => {
    if (row.is_dynamic) {
      if (!row.short_code) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["short_code"],
          message: "Dynamic QR codes require a short_code",
        });
      }
      if (!row.destination_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destination_url"],
          message: "Dynamic QR codes require a destination_url",
        });
      }
    }
  });

export type CloudQRRowParsed = z.infer<typeof cloudQRRowSchema>;
export type CloudQRRowInfer = z.output<typeof cloudQRRowSchema>;

export const cloudProfileRowSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  display_name: z.union([z.string().min(1), z.null(), z.literal("")]).nullable(),
  avatar_url: z.union([z.string().min(1), z.null(), z.literal("")]).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CloudProfileRowParsed = z.infer<typeof cloudProfileRowSchema>;

export function validateCloudRow(row: unknown): CloudQRRowParsed {
  const parsed = cloudQRRowSchema.safeParse(row);
  if (!parsed.success) {
    throw new Error(`Invalid cloud QR record (${(row as { id?: string })?.id ?? "unknown"})`);
  }
  return parsed.data;
}