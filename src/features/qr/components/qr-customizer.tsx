"use client";

import {
  type QRCustomization,
  type ErrorCorrectionLevel,
  type QRStyle,
  DEFAULT_CUSTOMIZATION,
  SIZE_OPTIONS,
  ERROR_CORRECTION_INFO,
} from "../types";

interface QRCustomizerProps {
  customization: QRCustomization;
  onChange: (customization: QRCustomization) => void;
}

const STYLE_OPTIONS: { value: QRStyle; label: string; available: boolean }[] = [
  { value: "square", label: "Square", available: true },
  { value: "rounded", label: "Rounded", available: false },
  { value: "dots", label: "Dots", available: false },
];

const MARGIN_OPTIONS = [0, 1, 2, 4, 6, 8] as const;

export function QRCustomizer({ customization, onChange }: QRCustomizerProps) {
  const update = <K extends keyof QRCustomization>(
    key: K,
    value: QRCustomization[K]
  ) => {
    onChange({ ...customization, [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Size</label>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update("size", size)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                customization.size === size
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Margin</label>
        <div className="flex flex-wrap gap-2">
          {MARGIN_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update("margin", m)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                customization.margin === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="qr-fg" className="text-sm font-medium">
            Foreground
          </label>
          <div className="flex items-center gap-2">
            <input
              id="qr-fg"
              type="color"
              value={customization.foreground}
              onChange={(e) => update("foreground", e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {customization.foreground}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="qr-bg" className="text-sm font-medium">
            Background
          </label>
          <div className="flex items-center gap-2">
            <input
              id="qr-bg"
              type="color"
              value={customization.background}
              onChange={(e) => update("background", e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {customization.background}
            </span>
          </div>
        </div>
      </div>

      {/* Error Correction */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Error Correction</label>
        <div className="flex flex-wrap gap-2">
          {(["L", "M", "Q", "H"] as ErrorCorrectionLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => update("errorCorrection", level)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                customization.errorCorrection === level
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {ERROR_CORRECTION_INFO[customization.errorCorrection]}
        </p>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Style</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.value}
              type="button"
              disabled={!style.available}
              onClick={() => style.available && update("style", style.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                customization.style === style.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/30"
              } ${!style.available ? "opacity-50 cursor-not-allowed" : ""}`}
              title={
                !style.available
                  ? "Coming in a future update"
                  : undefined
              }
            >
              {style.label}
              {!style.available && " (soon)"}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Customization */}
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_CUSTOMIZATION })}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Reset customization
      </button>
    </div>
  );
}
