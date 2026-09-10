"use client";

import { Input } from "@/components/ui/input";
import type { URLValues } from "../../types";

interface URLFormProps {
  values: URLValues;
  onChange: (values: URLValues) => void;
  errors?: Record<string, string>;
}

export function URLForm({ values, onChange, errors }: URLFormProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="qr-url" className="text-sm font-medium">
        Website URL <span className="text-destructive">*</span>
      </label>
      <Input
        id="qr-url"
        type="url"
        placeholder="https://example.com"
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
        Include https:// or http:// — if omitted, https:// will be added automatically.
      </p>
    </div>
  );
}
