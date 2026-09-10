"use client";

import { URLForm } from "./forms/url-form";
import { WiFiForm } from "./forms/wifi-form";
import { PhoneForm } from "./forms/phone-form";
import { EmailForm } from "./forms/email-form";
import { WhatsAppForm } from "./forms/whatsapp-form";
import { VCardForm } from "./forms/vcard-form";
import { TextForm } from "./forms/text-form";
import type { QRType } from "@/types";
import type {
  URLValues,
  WiFiValues,
  PhoneValues,
  EmailValues,
  WhatsAppValues,
  VCardValues,
  TextValues,
} from "../types";

type AnyValues = URLValues | WiFiValues | PhoneValues | EmailValues | WhatsAppValues | VCardValues | TextValues;

interface QRFormProps {
  type: QRType;
  values: AnyValues;
  onChange: (values: AnyValues) => void;
  errors?: Record<string, string>;
}

export function QRForm({ type, values, onChange, errors }: QRFormProps) {
  switch (type) {
    case "website":
      return <URLForm values={values as URLValues} onChange={onChange} errors={errors} />;
    case "wifi":
      return <WiFiForm values={values as WiFiValues} onChange={onChange} errors={errors} />;
    case "phone":
      return <PhoneForm values={values as PhoneValues} onChange={onChange} errors={errors} />;
    case "email":
      return <EmailForm values={values as EmailValues} onChange={onChange} errors={errors} />;
    case "whatsapp":
      return <WhatsAppForm values={values as WhatsAppValues} onChange={onChange} errors={errors} />;
    case "vcard":
      return <VCardForm values={values as VCardValues} onChange={onChange} errors={errors} />;
    case "text":
      return <TextForm values={values as TextValues} onChange={onChange} errors={errors} />;
  }
}
