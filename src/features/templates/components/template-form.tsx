"use client";

import { Input } from "@/components/ui/input";
import type { QRTemplate, TemplateFieldValue, TemplateValues } from "../types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

interface TemplateFormProps {
  template: QRTemplate;
  values: TemplateValues;
  onChange: (values: TemplateValues) => void;
  errors?: Record<string, string>;
}

const inputClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TemplateForm({ template, values, onChange, errors }: TemplateFormProps) {
  const { t } = useI18n();
  const visibleFields = template.fields.filter((field) => {
    if (!field.hiddenWhen) return true;
    const current = String(values[field.hiddenWhen.key] ?? "");
    return current !== field.hiddenWhen.value;
  });

  const setValue = (key: string, value: TemplateFieldValue) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      {visibleFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label htmlFor={`tpl-${field.key}`} className="text-sm font-medium">
            {t(field.labelKey)}
            {field.required && <span className="text-destructive"> *</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={`tpl-${field.key}`}
              rows={3}
              value={String(values[field.key] ?? "")}
              onChange={(e) => setValue(field.key, e.target.value)}
              aria-invalid={!!errors?.[field.key]}
              aria-describedby={
                errors?.[field.key] ? `tpl-${field.key}-error` : undefined
              }
              className={cn(inputClass, "resize-none")}
            />
          ) : field.type === "select" ? (
            <select
              id={`tpl-${field.key}`}
              value={String(values[field.key] ?? "")}
              onChange={(e) => setValue(field.key, e.target.value)}
              className={cn(inputClass, "h-8")}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <button
              type="button"
              role="switch"
              aria-checked={values[field.key] === true}
              aria-label={t(field.labelKey)}
              onClick={() => setValue(field.key, !(values[field.key] === true))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                values[field.key] === true ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 rounded-full bg-white transition-transform",
                  values[field.key] === true ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          ) : (
            <Input
              id={`tpl-${field.key}`}
              type={
                field.type === "url"
                  ? "url"
                  : field.type === "email"
                    ? "email"
                    : field.type === "phone"
                      ? "tel"
                      : field.type === "number"
                        ? "number"
                        : field.type === "date"
                          ? "date"
                          : field.type === "time"
                            ? "time"
                            : "text"
              }
              inputMode={
                field.type === "number" ? "decimal" : field.type === "phone" ? "tel" : undefined
              }
              step={field.type === "number" ? "any" : undefined}
              placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
              value={String(values[field.key] ?? "")}
              onChange={(e) => setValue(field.key, e.target.value)}
              aria-invalid={!!errors?.[field.key]}
              aria-describedby={
                errors?.[field.key] ? `tpl-${field.key}-error` : undefined
              }
            />
          )}

          {errors?.[field.key] && (
            <p id={`tpl-${field.key}-error`} className="text-xs text-destructive" role="alert">
              {errors[field.key]}
            </p>
          )}

          {field.helperKey && (
            <p className="text-xs text-muted-foreground">{t(field.helperKey)}</p>
          )}
        </div>
      ))}
    </div>
  );
}