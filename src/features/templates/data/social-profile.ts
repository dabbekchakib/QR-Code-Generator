import { Share2 } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, urlField, neutralValues } from "./common";
import { socialProfileTemplateSchema } from "../schemas";

export const socialProfileTemplate: QRTemplate = {
  id: "social-profile",
  nameKey: "templates.templates.socialProfile.name",
  descriptionKey: "templates.templates.socialProfile.desc",
  category: "social",
  icon: Share2,
  qrType: "website",
  defaultMode: "static",
  defaultName: "Social Profile",
  defaultValues: neutralValues({ name: "", url: "" }),
  fields: [NAME_FIELD, urlField("templates.fields.profileUrl", "templates.placeholders.profileUrl")],
  schema: socialProfileTemplateSchema,
  presetId: "classic",
  toPayload: (values) => ({ url: String(values.url ?? "").trim() }),
};