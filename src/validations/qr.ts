import { z } from "zod";

export const websiteSchema = z.object({
  content: z.string().url("Please enter a valid URL"),
});

export const wifiSchema = z.object({
  ssid: z.string().min(1, "SSID is required"),
  password: z.string().optional(),
  encryption: z.enum(["WPA", "WEP", "none"]),
});

export const phoneSchema = z.object({
  content: z.string().min(1, "Phone number is required"),
});

export const emailSchema = z.object({
  content: z.string().email("Please enter a valid email address"),
});

export const whatsappSchema = z.object({
  content: z.string().min(1, "Phone number is required"),
});

export const textSchema = z.object({
  content: z.string().min(1, "Text is required").max(2000, "Text is too long"),
});

export const vCardSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  organization: z.string().optional(),
  title: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional(),
});

export const qrLabelSchema = z.object({
  label: z.string().min(1, "Label is required").max(100, "Label is too long"),
  isDynamic: z.boolean().default(false),
});

export type WebsiteInput = z.infer<typeof websiteSchema>;
export type WifiInput = z.infer<typeof wifiSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type WhatsAppInput = z.infer<typeof whatsappSchema>;
export type TextInput = z.infer<typeof textSchema>;
export type VCardInput = z.infer<typeof vCardSchema>;
export type QRLabelInput = z.infer<typeof qrLabelSchema>;
