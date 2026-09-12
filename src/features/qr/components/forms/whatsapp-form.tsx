"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import type { WhatsAppValues } from "../../types";

interface WhatsAppFormProps {
  values: WhatsAppValues;
  onChange: (values: WhatsAppValues) => void;
  errors?: Record<string, string>;
}

export function WhatsAppForm({ values, onChange, errors }: WhatsAppFormProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="qr-wa-phone" className="text-sm font-medium">
          {t("templates.fields.phone")} <span className="text-destructive">*</span>
        </label>
        <Input
          id="qr-wa-phone"
          type="tel"
          placeholder={t("templates.placeholders.phone")}
          value={values.phone}
          onChange={(e) => onChange({ ...values, phone: e.target.value })}
          aria-invalid={!!errors?.phone}
          aria-describedby={errors?.phone ? "qr-wa-phone-error" : undefined}
        />
        {errors?.phone && (
          <p id="qr-wa-phone-error" className="text-xs text-destructive" role="alert">
            {errors.phone}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("templates.helpers.whatsappDigits")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="qr-wa-message" className="text-sm font-medium">
          {t("templates.fields.message")}
        </label>
        <textarea
          id="qr-wa-message"
          placeholder={t("templates.placeholders.waMessage")}
          rows={3}
          value={values.message}
          onChange={(e) => onChange({ ...values, message: e.target.value })}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {t("templates.helpers.whatsappOptional")}
        </p>
      </div>
    </div>
  );
}
