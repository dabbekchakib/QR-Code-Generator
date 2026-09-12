"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import type { URLValues } from "../../types";

interface URLFormProps {
  values: URLValues;
  onChange: (values: URLValues) => void;
  errors?: Record<string, string>;
}

export function URLForm({ values, onChange, errors }: URLFormProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <label htmlFor="qr-url" className="text-sm font-medium">
        {t("templates.fields.url")} <span className="text-destructive">*</span>
      </label>
      <Input
        id="qr-url"
        type="url"
        placeholder={t("templates.placeholders.url")}
        value={values.url}
        onChange={(e) => onChange({ ...values, url: e.target.value })}
        aria-invalid={!!errors?.url}
        aria-describedby={errors?.url ? "qr-url-error" : undefined}
      />
      {errors?.url && (
        <p id="qr-url-error" className="text-xs text-destructive" role="alert">
          {errors.url}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("templates.helpers.urlScheme")}
      </p>
    </div>
  );
}
