"use client";

import type { TextValues } from "../../types";

interface TextFormProps {
  values: TextValues;
  onChange: (values: TextValues) => void;
  errors?: Record<string, string>;
}

const MAX_CHARS = 4296;

export function TextForm({ values, onChange, errors }: TextFormProps) {
  const charCount = values.text.length;

  return (
    <div className="space-y-2">
      <label htmlFor="qr-text" className="text-sm font-medium">
        Text Content <span className="text-destructive">*</span>
      </label>
      <textarea
        id="qr-text"
        placeholder="Enter your text here..."
        rows={5}
        maxLength={MAX_CHARS}
        value={values.text}
        onChange={(e) => onChange({ ...values, text: e.target.value })}
        aria-invalid={!!errors?.text}
        aria-describedby={errors?.text ? "qr-text-error" : "qr-text-count"}
        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
      />
      <div className="flex items-center justify-between">
        {errors?.text ? (
          <p id="qr-text-error" className="text-xs text-destructive" role="alert">
            {errors.text}
          </p>
        ) : (
          <span />
        )}
        <p
          id="qr-text-count"
          className={`text-xs ${charCount > MAX_CHARS * 0.9 ? "text-amber-500" : "text-muted-foreground"}`}
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Supports Unicode: French, Arabic, English, emojis, and all other languages.
      </p>
    </div>
  );
}
