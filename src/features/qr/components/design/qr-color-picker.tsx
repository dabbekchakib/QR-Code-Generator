"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./ui";

interface QRColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** When true the field can be "cleared" to inherit another color (eyes). */
  allowClear?: boolean;
  cleared?: boolean;
  onClear?: () => void;
  clearLabel?: string;
}

const QUICK_COLORS = [
  "#000000",
  "#FFFFFF",
  "#1E40AF",
  "#16A34A",
  "#DC2626",
  "#F59E0B",
];

/** HEX color picker with a text field, a native picker and quick swatches.
 *  Values are normalized to lowercase #rrggbb so exports are predictable. */
export function QRColorPicker({
  label,
  value,
  onChange,
  allowClear,
  cleared,
  onClear,
  clearLabel,
}: QRColorPickerProps) {
  const { t } = useI18n();

  const normalize = (raw: string): string => {
    let hex = raw.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]+$/.test(hex)) return value;
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length === 6) return `#${hex.toLowerCase()}`;
    return value;
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-8 w-8 shrink-0 rounded border border-input cursor-pointer"
        />
        <input
          type="text"
          inputMode="text"
          value={value}
          onChange={(e) => onChange(normalize(e.target.value))}
          onBlur={(e) => onChange(normalize(e.target.value))}
          aria-label={`${label} (hex)`}
          maxLength={7}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {allowClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "shrink-0 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              cleared
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            {clearLabel ?? t("design.eyeDefault")}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={color}
            className={cn(
              "size-6 rounded-md border transition-transform hover:scale-110",
              value.toLowerCase() === color && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}