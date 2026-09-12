import { MapPin } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, neutralValues } from "./common";
import { locationTemplateSchema } from "../schemas";
import { buildMapsUrl } from "../utils/links";

export const locationTemplate: QRTemplate = {
  id: "location",
  nameKey: "templates.templates.location.name",
  descriptionKey: "templates.templates.location.desc",
  category: "business",
  icon: MapPin,
  qrType: "website",
  defaultMode: "static",
  defaultName: "Location",
  defaultValues: neutralValues({ name: "", url: "", latitude: "", longitude: "" }),
  fields: [
    NAME_FIELD,
    {
      key: "url",
      type: "url",
      labelKey: "templates.fields.mapsUrl",
      placeholderKey: "templates.placeholders.mapsUrl",
      helperKey: "templates.helpers.mapsEither",
      default: "",
    },
    {
      key: "latitude",
      type: "number",
      labelKey: "templates.fields.latitude",
      default: "",
    },
    {
      key: "longitude",
      type: "number",
      labelKey: "templates.fields.longitude",
      default: "",
    },
  ],
  schema: locationTemplateSchema,
  presetId: "classic",
  toPayload: (values) => {
    const url = String(values.url ?? "").trim();
    if (url) return { url };
    return {
      url: buildMapsUrl({
        latitude: String(values.latitude ?? ""),
        longitude: String(values.longitude ?? ""),
      }),
    };
  },
};