import { MessageCircle } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, neutralValues } from "./common";
import { whatsappTemplateSchema } from "../schemas";

export const whatsappTemplate: QRTemplate = {
  id: "whatsapp",
  nameKey: "templates.templates.whatsapp.name",
  descriptionKey: "templates.templates.whatsapp.desc",
  category: "social",
  icon: MessageCircle,
  qrType: "whatsapp",
  defaultMode: "static",
  defaultName: "WhatsApp",
  defaultValues: neutralValues({ name: "", phone: "", message: "" }),
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
      key: "message",
      type: "textarea",
      labelKey: "templates.fields.message",
      required: false,
      default: "",
    },
  ],
  schema: whatsappTemplateSchema,
  presetId: "classic",
  toPayload: (values) => ({
    phone: String(values.phone ?? "").trim(),
    message: String(values.message ?? ""),
  }),
};