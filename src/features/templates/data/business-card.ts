import { Contact } from "lucide-react";
import type { QRTemplate, TemplateValues } from "../types";
import { textField, neutralValues } from "./common";
import { businessCardTemplateSchema } from "../schemas";

const FIELDS = [
  textField("firstName", "templates.fields.firstName", true),
  textField("lastName", "templates.fields.lastName"),
  textField("organization", "templates.fields.organization"),
  textField("jobTitle", "templates.fields.jobTitle"),
  { ...textField("phone", "templates.fields.phone"), type: "phone" as const, placeholderKey: "templates.placeholders.phone" },
  { ...textField("email", "templates.fields.email"), type: "email" as const, placeholderKey: "templates.placeholders.email" },
  { ...textField("website", "templates.fields.website"), type: "url" as const, placeholderKey: "templates.placeholders.url" },
  textField("address", "templates.fields.address"),
];

function computeName(values: TemplateValues): string | null {
  const first = String(values.firstName ?? "").trim();
  const last = String(values.lastName ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ");
  return full || null;
}

export const businessCardTemplate: QRTemplate = {
  id: "business-card",
  nameKey: "templates.templates.businessCard.name",
  descriptionKey: "templates.templates.businessCard.desc",
  category: "business",
  icon: Contact,
  qrType: "vcard",
  defaultMode: "static",
  defaultName: "Business Card",
  defaultValues: neutralValues({
    firstName: "",
    lastName: "",
    organization: "",
    jobTitle: "",
    phone: "",
    email: "",
    website: "",
    address: "",
  }),
  fields: FIELDS,
  schema: businessCardTemplateSchema,
  presetId: "classic",
  computeName,
  toPayload: (values) => ({
    firstName: String(values.firstName ?? "").trim(),
    lastName: String(values.lastName ?? "").trim(),
    organization: String(values.organization ?? "").trim(),
    jobTitle: String(values.jobTitle ?? "").trim(),
    phone: String(values.phone ?? "").trim(),
    email: String(values.email ?? "").trim(),
    website: String(values.website ?? "").trim(),
    address: String(values.address ?? "").trim(),
    city: "",
    country: "",
    note: "",
  }),
};