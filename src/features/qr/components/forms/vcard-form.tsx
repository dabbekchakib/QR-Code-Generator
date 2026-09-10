"use client";

import { Input } from "@/components/ui/input";
import type { VCardValues } from "../../types";

interface VCardFormProps {
  values: VCardValues;
  onChange: (values: VCardValues) => void;
  errors?: Record<string, string>;
}

export function VCardForm({ values, onChange, errors }: VCardFormProps) {
  const update = (field: keyof VCardValues, val: string) =>
    onChange({ ...values, [field]: val });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-first" className="text-sm font-medium">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="vc-first"
            placeholder="John"
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
            Last Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="vc-last"
            placeholder="Doe"
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
            Organization
          </label>
          <Input
            id="vc-org"
            placeholder="Acme Inc."
            value={values.organization}
            onChange={(e) => update("organization", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-title" className="text-sm font-medium">
            Job Title
          </label>
          <Input
            id="vc-title"
            placeholder="Software Engineer"
            value={values.jobTitle}
            onChange={(e) => update("jobTitle", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-phone" className="text-sm font-medium">
            Phone
          </label>
          <Input
            id="vc-phone"
            type="tel"
            placeholder="+216 24 246 619"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="vc-email"
            type="email"
            placeholder="john@acme.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vc-website" className="text-sm font-medium">
          Website
        </label>
        <Input
          id="vc-website"
          type="url"
          placeholder="https://acme.com"
          value={values.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="vc-address" className="text-sm font-medium">
          Address
        </label>
        <Input
          id="vc-address"
          placeholder="123 Main Street"
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="vc-city" className="text-sm font-medium">
            City
          </label>
          <Input
            id="vc-city"
            placeholder="Paris"
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="vc-country" className="text-sm font-medium">
            Country
          </label>
          <Input
            id="vc-country"
            placeholder="France"
            value={values.country}
            onChange={(e) => update("country", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vc-note" className="text-sm font-medium">
          Note
        </label>
        <textarea
          id="vc-note"
          placeholder="Additional info..."
          rows={2}
          value={values.note}
          onChange={(e) => update("note", e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>
    </div>
  );
}
