"use client";

import { Input } from "@/components/ui/input";
import type { PhoneValues } from "../../types";

interface PhoneFormProps {
  values: PhoneValues;
  onChange: (values: PhoneValues) => void;
  errors?: Record<string, string>;
}

export function PhoneForm({ values, onChange, errors }: PhoneFormProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="qr-phone" className="text-sm font-medium">
        Phone Number <span className="text-destructive">*</span>
      </label>
      <Input
        id="qr-phone"
        type="tel"
        placeholder="+216 24 246 619"
        value={values.phone}
        onChange={(e) => onChange({ ...values, phone: e.target.value })}
        aria-invalid={!!errors?.phone}
        aria-describedby={errors?.phone ? "qr-phone-error" : undefined}
      />
      {errors?.phone && (
        <p id="qr-phone-error" className="text-xs text-destructive" role="alert">
          {errors.phone}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Include country code for international numbers.
      </p>
    </div>
  );
}
