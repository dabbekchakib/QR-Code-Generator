import { Utensils } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, urlField, neutralValues } from "./common";
import { restaurantMenuTemplateSchema } from "../schemas";

export const restaurantMenuTemplate: QRTemplate = {
  id: "restaurant-menu",
  nameKey: "templates.templates.restaurantMenu.name",
  descriptionKey: "templates.templates.restaurantMenu.desc",
  category: "restaurant",
  icon: Utensils,
  qrType: "website",
  // The menu can change without reprinting the QR — Dynamic by default.
  defaultMode: "dynamic",
  defaultName: "Restaurant Menu",
  defaultValues: neutralValues({ name: "", url: "" }),
  fields: [NAME_FIELD, urlField("templates.fields.menuUrl", "templates.placeholders.menuUrl")],
  schema: restaurantMenuTemplateSchema,
  presetId: "classic",
  dynamicField: "url",
  toPayload: (values) => ({ url: String(values.url ?? "").trim() }),
};