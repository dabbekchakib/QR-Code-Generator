import { z } from "zod";
import type { TemplateValues } from "../types";
import { areValidCoordinates, isValidEventDateTime } from "../utils/links";

function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const PHONE_RE = /^[\d\s\-+().*#]+$/;

export const templateNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const requiredUrl = z
  .string()
  .trim()
  .min(1, "URL is required")
  .refine(isHttpUrl, "Please enter a valid URL (e.g., https://example.com)");

export const optionalUrl = z
  .string()
  .trim()
  .default("")
  .refine(
    (v) => v === "" || isHttpUrl(v),
    "Please enter a valid URL (e.g., https://example.com)"
  );

export const requiredPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(PHONE_RE, "Invalid phone number characters");

export const optionalPhone = z
  .string()
  .trim()
  .default("")
  .refine(
    (v) => v === "" || PHONE_RE.test(v),
    "Invalid phone number characters"
  );

export const optionalEmail = z
  .string()
  .trim()
  .default("")
  .refine(
    (v) => v === "" || z.string().email().safeParse(v).success,
    "Please enter a valid email address"
  );

export const requiredLatitude = z
  .string()
  .trim()
  .min(1, "Latitude is required")
  .refine(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= -90 && n <= 90;
    },
    "Latitude must be between -90 and 90"
  );

export const requiredLongitude = z
  .string()
  .trim()
  .min(1, "Longitude is required")
  .refine(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= -180 && n <= 180;
    },
    "Longitude must be between -180 and 180"
  );

/* ------------------------------------------------------------------------- */
/*  Per-template schemas. Each one is a TemplateValues-shaped object so the   */
/*  create flow can store `name` plus the template fields in one object.      */
/* ------------------------------------------------------------------------- */

export const websiteTemplateSchema = z.object({
  name: templateNameSchema,
  url: requiredUrl,
});

export const restaurantMenuTemplateSchema = z.object({
  name: templateNameSchema,
  url: requiredUrl,
});

export const whatsappTemplateSchema = z.object({
  name: templateNameSchema,
  phone: requiredPhone,
  message: z.string().default(""),
});

export const businessCardTemplateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().default(""),
  organization: z.string().trim().default(""),
  jobTitle: z.string().trim().default(""),
  phone: optionalPhone,
  email: optionalEmail,
  website: optionalUrl,
  address: z.string().trim().default(""),
});

export const contactTemplateSchema = z.object({
  name: templateNameSchema,
  phone: requiredPhone,
  email: optionalEmail,
});

export const wifiTemplateSchema = z.object({
  ssid: z.string().trim().min(1, "Network name is required"),
  password: z.string().trim().default(""),
  security: z.enum(["WPA", "WEP", "none"]),
  hidden: z.boolean().default(false),
});

export const locationTemplateSchema = z
  .object({
    name: templateNameSchema,
    url: optionalUrl,
    latitude: z.string().trim().default(""),
    longitude: z.string().trim().default(""),
  })
  .superRefine((row, ctx) => {
    const hasUrl = row.url.trim() !== "";
    const hasCoords = areValidCoordinates(row.latitude, row.longitude);
    if (!hasUrl && !hasCoords) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latitude"],
        message: "Enter coordinates or a Google Maps URL",
      });
    }
  });

export const eventTemplateSchema = z
  .object({
    name: templateNameSchema,
    date: z.string().trim().min(1, "Date is required"),
    startTime: z.string().trim().min(1, "Start time is required"),
    endTime: z.string().trim().default(""),
    location: z.string().trim().default(""),
    description: z.string().trim().default(""),
  })
  .superRefine((row, ctx) => {
    if (!isValidEventDateTime(row.date, row.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Enter a valid date (and start time)",
      });
    }
  });

export const socialProfileTemplateSchema = z.object({
  name: templateNameSchema,
  url: requiredUrl,
});

export const googleReviewTemplateSchema = z.object({
  name: templateNameSchema,
  url: requiredUrl,
});

export type { TemplateValues };
export { templateNameSchema as nameSchema };