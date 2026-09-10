"use client";

import { Input } from "@/components/ui/input";
import type { WiFiValues } from "../../types";

interface WiFiFormProps {
  values: WiFiValues;
  onChange: (values: WiFiValues) => void;
  errors?: Record<string, string>;
}

export function WiFiForm({ values, onChange, errors }: WiFiFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="qr-ssid" className="text-sm font-medium">
          Network Name (SSID) <span className="text-destructive">*</span>
        </label>
        <Input
          id="qr-ssid"
          placeholder="MyWiFiNetwork"
          value={values.ssid}
          onChange={(e) => onChange({ ...values, ssid: e.target.value })}
          aria-invalid={!!errors?.ssid}
          aria-describedby={errors?.ssid ? "qr-ssid-error" : undefined}
        />
        {errors?.ssid && (
          <p id="qr-ssid-error" className="text-xs text-destructive" role="alert">
            {errors.ssid}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="qr-wifi-security" className="text-sm font-medium">
          Security
        </label>
        <select
          id="qr-wifi-security"
          value={values.security}
          onChange={(e) =>
            onChange({
              ...values,
              security: e.target.value as WiFiValues["security"],
            })
          }
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="WPA">WPA / WPA2</option>
          <option value="WEP">WEP</option>
          <option value="none">None (Open network)</option>
        </select>
      </div>

      {values.security !== "none" && (
        <div className="space-y-2">
          <label htmlFor="qr-wifi-password" className="text-sm font-medium">
            Password <span className="text-destructive">*</span>
          </label>
          <Input
            id="qr-wifi-password"
            type="password"
            placeholder="Enter password"
            value={values.password}
            onChange={(e) => onChange({ ...values, password: e.target.value })}
            aria-invalid={!!errors?.password}
            aria-describedby={errors?.password ? "qr-wifi-password-error" : undefined}
          />
          {errors?.password && (
            <p id="qr-wifi-password-error" className="text-xs text-destructive" role="alert">
              {errors.password}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ ...values, hidden: !values.hidden })}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
            values.hidden ? "bg-primary" : "bg-muted"
          )}
          role="switch"
          aria-checked={values.hidden}
          aria-label="Hidden network"
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white transition-transform",
              values.hidden ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <div>
          <p className="text-sm font-medium">Hidden network</p>
          <p className="text-xs text-muted-foreground">SSID is not broadcast</p>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
