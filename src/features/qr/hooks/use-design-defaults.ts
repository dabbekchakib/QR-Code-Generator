"use client";

import { useState } from "react";
import type { QRCustomization } from "../types";
import { DEFAULT_CUSTOMIZATION, normalizeCustomization } from "../types";
import { customizationSchema } from "../storage/backup";

const STORAGE_KEY = "qr-manager-design-defaults";

/**
 * Stored QR design defaults (local only, never synced to any server). Used to
 * seed the create flow and restore the design when "Reset" is pressed. Falls
 * back to the baked-in defaults whenever the stored value is missing/invalid.
 */
export function getDesignDefaults(): QRCustomization {
  if (typeof localStorage === "undefined") return DEFAULT_CUSTOMIZATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = customizationSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return DEFAULT_CUSTOMIZATION;
    return normalizeCustomization(parsed.data);
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

export function storeDesignDefaults(customization: QRCustomization): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCustomization(customization)));
  } catch {
    // Storage full / unavailable — defaults just stay baked-in.
  }
}

export function useDesignDefaults(): [
  QRCustomization,
  (customization: QRCustomization) => void,
  () => void
] {
  const [defaults, setDefaults] = useState<QRCustomization>(() => getDesignDefaults());

  const update = (customization: QRCustomization) => {
    storeDesignDefaults(customization);
    setDefaults(customization);
  };

  const reset = () => {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setDefaults(DEFAULT_CUSTOMIZATION);
  };

  return [defaults, update, reset];
}