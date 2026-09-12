import { Globe } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, urlField, neutralValues } from "./common";
import { websiteTemplateSchema } from "../schemas";

export const websiteTemplate: QRTemplate = {
  id: "website",
  nameKey: "templates.templates.website.name",
  descriptionKey: "templates.templates.website.desc",
  category: "business",
  icon: Globe,
  qrType: "website",
  defaultMode: "static",
  defaultName: "Website",
  defaultValues: neutralValues({ name: "", url: "" }),
  fields: [NAME_FIELD, urlField("templates.fields.url", "templates.placeholders.url")],
  schema: websiteTemplateSchema,
  presetId: "classic",
  toPayload: (values) => ({ url: String(values.url ?? "").trim() }),
};