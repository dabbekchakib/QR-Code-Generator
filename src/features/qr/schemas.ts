import { z } from "zod";

function autoProtocolUrl() {
  return z
    .string()
    .min(1, "URL is required")
    .refine(
      (val) => {
        if (/^https?:\/\//i.test(val)) {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      },
      { message: "Please enter a valid URL (e.g., https://example.com)" }
    );
}

export const urlSchema = z.object({
  url: autoProtocolUrl(),
});

export const wifiSchema = z.object({
  ssid: z.string().min(1, "SSID is required"),
  password: z.string().default(""),
  security: z.enum(["WPA", "WEP", "none"]),
  hidden: z.boolean().default(false),
});

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-+().*#]+$/, "Invalid phone number characters"),
});

export const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  subject: z.string().default(""),
  message: z.string().default(""),
});

export const whatsappSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-+().*#]+$/, "Invalid phone number characters"),
  message: z.string().default(""),
});

export const vcardSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organization: z.string().default(""),
  jobTitle: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  website: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default(""),
  note: z.string().default(""),
});

export const textSchema = z.object({
  text: z.string().min(1, "Text is required").max(4296, "Text is too long"),
});

export type URLSchema = z.infer<typeof urlSchema>;
export type WiFiSchema = z.infer<typeof wifiSchema>;
export type PhoneSchema = z.infer<typeof phoneSchema>;
export type EmailSchema = z.infer<typeof emailSchema>;
export type WhatsAppSchema = z.infer<typeof whatsappSchema>;
export type VCardSchema = z.infer<typeof vcardSchema>;
export type TextSchema = z.infer<typeof textSchema>;
