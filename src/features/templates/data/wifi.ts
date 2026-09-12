import { Wifi } from "lucide-react";
import type { QRTemplate } from "../types";
import { neutralValues } from "./common";
import { wifiTemplateSchema } from "../schemas";

export const wifiTemplate: QRTemplate = {
  id: "wifi",
  nameKey: "templates.templates.wifi.name",
  descriptionKey: "templates.templates.wifi.desc",
  category: "other",
  icon: Wifi,
  qrType: "wifi",
  defaultMode: "static",
  defaultName: "WiFi",
  defaultValues: neutralValues({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  }),
  fields: [
    {
      key: "ssid",
      type: "text",
      labelKey: "templates.fields.ssid",
      placeholderKey: "templates.placeholders.ssid",
      required: true,
      default: "",
    },
    {
      key: "security",
      type: "select",
      labelKey: "templates.fields.security",
      required: true,
      default: "WPA",
      options: [
        { value: "WPA", labelKey: "templates.fields.securityWPA" },
        { value: "WEP", labelKey: "templates.fields.securityWEP" },
        { value: "none", labelKey: "templates.fields.securityNone" },
      ],
    },
    {
      key: "password",
      type: "text",
      labelKey: "templates.fields.password",
      default: "",
      hiddenWhen: { key: "security", value: "none" },
    },
    {
      key: "hidden",
      type: "checkbox",
      labelKey: "templates.fields.hidden",
      default: false,
    },
  ],
  schema: wifiTemplateSchema,
  presetId: "classic",
  toPayload: (values) => {
    const security = String(values.security ?? "WPA") as "WPA" | "WEP" | "none";
    return {
      ssid: String(values.ssid ?? "").trim(),
      password: security === "none" ? "" : String(values.password ?? ""),
      security,
      hidden: values.hidden === true,
    };
  },
};