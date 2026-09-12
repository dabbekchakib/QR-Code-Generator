"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import type { VCardValues } from "../../types";

interface VCardFormProps {
  values: VCardValues;
  onChange: (values: VCardValues) => void;
  errors?: Record<string, string>;
}

export function VCardForm({ values, onChange, errors }: VCardFormProps) {
  const { t } = useI18n();
  const update = (field: keyof VCardValues, val: string) =>
    onChange({ ...values, [field]: val });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-first" className="text-sm font-medium">
            {t("templates.fields.firstName")} <span className="text-destructive">*</span>
          </label>
          <Input
            id="vc-first"
            placeholder={t("templates.placeholders.firstName")}
            value={values.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            aria-invalid={!!errors?.firstName}
            aria-describedby={errors?.firstName ? "vc-first-error" : undefined}
          />
          {errors?.firstName && (
            <p id="vc-first-error" className="text-xs text-destructive" role="alert">
              {errors.firstName}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-last" className="text-sm font-medium">
            {t("templates.fields.lastName")} <span className="text-destructive">*</span>
          </label>
          <Input
            id="vc-last"
            placeholder={t("templates.placeholders.lastName")}
            value={values.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            aria-invalid={!!errors?.lastName}
            aria-describedby={errors?.lastName ? "vc-last-error" : undefined}
          />
          {errors?.lastName && (
            <p id="vc-last-error" className="text-xs text-destructive" role="alert">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-org" className="text-sm font-medium">
            {t("templates.fields.organization")}
          </label>
          <Input
            id="vc-org"
            placeholder={t("templates.placeholders.organization")}
            value={values.organization}
            onChange={(e) => update("organization", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-title" className="text-sm font-medium">
            {t("templates.fields.jobTitle")}
          </label>
          <Input
            id="vc-title"
            placeholder={t("templates.placeholders.jobTitle")}
            value={values.jobTitle}
            onChange={(e) => update("jobTitle", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-phone" className="text-sm font-medium">
            {t("templates.fields.phone")}
          </label>
          <Input
            id="vc-phone"
            type="tel"
            placeholder={t("templates.placeholders.phone")}
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-email" className="text-sm font-medium">
            {t("templates.fields.email")}
          </label>
          <Input
            id="vc-email"
            type="email"
            placeholder={t("templates.placeholders.email")}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vc-website" className="text-sm font-medium">
          {t("templates.fields.website")}
        </label>
        <Input
          id="vc-website"
          type="url"
          placeholder={t("templates.placeholders.website")}
          value={values.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="vc-address" className="text-sm font-medium">
          {t("templates.fields.address")}
        </label>
        <Input
          id="vc-address"
          placeholder={t("templates.placeholders.address")}
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-city" className="text-sm font-medium">
            {t("templates.fields.city")}
          </label>
          <Input
            id="vc-city"
            placeholder={t("templates.placeholders.city")}
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-country" className="text-sm font-medium">
            {t("templates.fields.country")}
          </label>
          <Input
            id="vc-country"
            placeholder={t("templates.placeholders.country")}
            value={values.country}
            onChange={(e) => update("country", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vc-note" className="text-sm font-medium">
          {t("templates.fields.note")}
        </label>
        <textarea
          id="vc-note"
          placeholder={t("templates.placeholders.note")}
          rows={2}
          value={values.note}
          onChange={(e) => update("note", e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>
    </div>
  );
}