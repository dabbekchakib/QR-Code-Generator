import { UserRound } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, neutralValues } from "./common";
import { contactTemplateSchema } from "../schemas";

export const contactTemplate: QRTemplate = {
  id: "contact",
  nameKey: "templates.templates.contact.name",
  descriptionKey: "templates.templates.contact.desc",
  category: "contact",
  icon: UserRound,
  qrType: "vcard",
  defaultMode: "static",
  defaultName: "Contact",
  defaultValues: neutralValues({ name: "", phone: "", email: "" }),
  fields: [
    NAME_FIELD,
    {
      key: "phone",
      type: "phone",
      labelKey: "templates.fields.phone",
      placeholderKey: "templates.placeholders.phone",
      helperKey: "templates.helpers.phone",
      required: true,
      default: "",
    },
    {
      key: "email",
      type: "email",
      labelKey: "templates.fields.email",
      placeholderKey: "templates.placeholders.email",
      default: "",
    },
  ],
  schema: contactTemplateSchema,
  presetId: "classic",
  toPayload: (values) => ({
    firstName: String(values.name ?? "").trim(),
    lastName: "",
    organization: "",
    jobTitle: "",
    phone: String(values.phone ?? "").trim(),
    email: String(values.email ?? "").trim(),
    website: "",
    address: "",
    city: "",
    country: "",
    note: "",
  }),
};