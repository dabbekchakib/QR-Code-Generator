import type { LucideIcon } from "lucide-react";
import type { z } from "zod";
import type { QRType } from "@/types";
import type { AnyFormValues } from "@/features/qr/types";

export type TemplateCategory =
  | "business"
  | "restaurant"
  | "social"
  | "events"
  | "contact"
  | "marketing"
  | "other";

export type TemplateFieldValue = string | boolean;

/** Loose values map used by every template form. All values are strings
 *  except boolean toggles (e.g. "hidden" WiFi). Numbers stay strings until
 *  validated by the template schema. */
export type TemplateValues = Record<string, TemplateFieldValue>;

export type TemplateFieldType =
  | "text"
  | "url"
  | "email"
  | "phone"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "time"
  | "checkbox";

export interface TemplateFieldDescriptor {
  /** Field key: must match the template schema key. */
  key: string;
  type: TemplateFieldType;
  labelKey: string;
  placeholderKey?: string;
  helperKey?: string;
  required?: boolean;
  /** Default value injected when the field "asks" for it (never dummy data). */
  default: TemplateFieldValue;
  /** Select options (used by e.g. the WiFi security field). */
  options?: Array<{ value: string; labelKey: string }>;
  /** Hide the field while another field equals this value (e.g. password
   *  hidden when security is "none"). */
  hiddenWhen?: { key: string; value: string };
}

export interface QRTemplate {
  /** Stable template id referenced by /create?template=<id>. */
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: TemplateCategory;
  icon: LucideIcon;
  /** Existing QR engine type the template drives. */
  qrType: QRType;
  /** Static by default; some templates (menu, review) default to Dynamic. */
  defaultMode: "static" | "dynamic";
  /** Neutral fallback record name (English). The create flow prefers the
   *  translated template name. */
  defaultName: string;
  /** Neutral starter values. Never contains fictional personal data. */
  defaultValues: TemplateValues;
  fields: TemplateFieldDescriptor[];
  /** Per-template Zod schema (name + template fields). */
  schema: z.ZodType<TemplateValues>;
  /** Map validated template values to the QR engine payload. */
  toPayload: (values: TemplateValues) => AnyFormValues;
  /** Design preset applied when the template loads. */
  presetId: "classic" | "midnight" | "minimal" | "soft" | "bold";
  /** For Dynamic templates: the field key holding the destination URL. */
  dynamicField?: string;
  /** Optional derived record name (e.g. Business Card "John Smith"). */
  computeName?: (values: TemplateValues) => string | null;
}

export type TemplatePreset =
  | "classic"
  | "midnight"
  | "minimal"
  | "soft"
  | "bold";