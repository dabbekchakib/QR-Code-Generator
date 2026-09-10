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
  created_at: z.string(),
  updated_at: z.string(),
});

export const cloudQRRowSchema = z.discriminatedUnion("type", [
  rowBase.extend({ type: z.literal("website"), values: urlSchema }),
  rowBase.extend({ type: z.literal("wifi"), values: wifiSchema }),
  rowBase.extend({ type: z.literal("phone"), values: phoneSchema }),
  rowBase.extend({ type: z.literal("email"), values: emailSchema }),
  rowBase.extend({ type: z.literal("whatsapp"), values: whatsappSchema }),
  rowBase.extend({ type: z.literal("vcard"), values: vcardSchema }),
  rowBase.extend({ type: z.literal("text"), values: textSchema }),
]);

export type CloudQRRowParsed = z.infer<typeof cloudQRRowSchema>;

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