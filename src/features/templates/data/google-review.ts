import { Star } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, urlField, neutralValues } from "./common";
import { googleReviewTemplateSchema } from "../schemas";

export const googleReviewTemplate: QRTemplate = {
  id: "google-review",
  nameKey: "templates.templates.googleReview.name",
  descriptionKey: "templates.templates.googleReview.desc",
  category: "marketing",
  icon: Star,
  qrType: "website",
  // Reviews change; allow editing the destination without reprinting.
  defaultMode: "dynamic",
  defaultName: "Google Review",
  defaultValues: neutralValues({ name: "", url: "" }),
  fields: [NAME_FIELD, urlField("templates.fields.reviewUrl", "templates.placeholders.reviewUrl")],
  schema: googleReviewTemplateSchema,
  presetId: "classic",
  dynamicField: "url",
  toPayload: (values) => ({ url: String(values.url ?? "").trim() }),
};