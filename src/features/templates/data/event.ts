import { Calendar } from "lucide-react";
import type { QRTemplate } from "../types";
import { NAME_FIELD, neutralValues } from "./common";
import { eventTemplateSchema } from "../schemas";
import { buildCalendarUrl } from "../utils/links";

export const eventTemplate: QRTemplate = {
  id: "event",
  nameKey: "templates.templates.event.name",
  descriptionKey: "templates.templates.event.desc",
  category: "events",
  icon: Calendar,
  qrType: "website",
  defaultMode: "static",
  defaultName: "Event",
  defaultValues: neutralValues({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
  }),
  fields: [
    NAME_FIELD,
    {
      key: "date",
      type: "date",
      labelKey: "templates.fields.date",
      required: true,
      default: "",
    },
    {
      key: "startTime",
      type: "time",
      labelKey: "templates.fields.startTime",
      required: true,
      default: "",
    },
    {
      key: "endTime",
      type: "time",
      labelKey: "templates.fields.endTime",
      default: "",
    },
    {
      key: "location",
      type: "text",
      labelKey: "templates.fields.location",
      default: "",
    },
    {
      key: "description",
      type: "textarea",
      labelKey: "templates.fields.description",
      default: "",
    },
  ],
  schema: eventTemplateSchema,
  presetId: "classic",
  toPayload: (values) => ({
    url: buildCalendarUrl({
      name: String(values.name ?? "").trim(),
      date: String(values.date ?? ""),
      startTime: String(values.startTime ?? ""),
      endTime: String(values.endTime ?? ""),
      location: String(values.location ?? ""),
      description: String(values.description ?? ""),
    }),
  }),
};