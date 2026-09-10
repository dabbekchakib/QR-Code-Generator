"use client";

import { Input } from "@/components/ui/input";
import type { EmailValues } from "../../types";

interface EmailFormProps {
  values: EmailValues;
  onChange: (values: EmailValues) => void;
  errors?: Record<string, string>;
}

export function EmailForm({ values, onChange, errors }: EmailFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="qr-email" className="text-sm font-medium">
          Email Address <span className="text-destructive">*</span>
        </label>
        <Input
          id="qr-email"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(e) => onChange({ ...values, email: e.target.value })}
          aria-invalid={!!errors?.email}
          aria-describedby={errors?.email ? "qr-email-error" : undefined}
        />
        {errors?.email && (
          <p id="qr-email-error" className="text-xs text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="qr-email-subject" className="text-sm font-medium">
          Subject
        </label>
        <Input
          id="qr-email-subject"
          placeholder="Hello!"
          value={values.subject}
          onChange={(e) => onChange({ ...values, subject: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="qr-email-message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="qr-email-message"
          placeholder="Your message..."
          rows={3}
          value={values.message}
          onChange={(e) => onChange({ ...values, message: e.target.value })}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>
    </div>
  );
}
