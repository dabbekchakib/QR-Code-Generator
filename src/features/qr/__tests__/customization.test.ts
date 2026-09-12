import { describe, it, expect } from "vitest";
import {
  type QRCustomization,
  DEFAULT_CUSTOMIZATION,
  normalizeCustomization,
} from "../types";
import { customizationSchema, recordFromBackup, parseBackupJson } from "../storage/backup";

const LEGACY_CUSTOMIZATION: QRCustomization = {
  size: 256,
  margin: 4,
  foreground: "#000000",
  background: "#FFFFFF",
  errorCorrection: "M",
  style: "square",
};

describe("normalizeCustomization", () => {
  it("fills every Phase 8 field on a legacy customization", () => {
    const c = normalizeCustomization(LEGACY_CUSTOMIZATION);
    expect(c.eyeStyle).toBe("square");
    expect(c.eyeColor).toBeNull();
    expect(c.frame).toBe("none");
    expect(c.frameText).toBe("");
    expect(c.logo).toBeNull();
    expect(c.transparentBackground).toBe(false);
    expect(c.preset).toBeNull();
  });

  it("keeps explicitly set fields", () => {
    const c = normalizeCustomization({
      ...LEGACY_CUSTOMIZATION,
      style: "dots",
      eyeStyle: "rounded",
      frame: "badge",
      frameText: "MENU",
      transparentBackground: true,
      preset: "bold",
    });
    expect(c.style).toBe("dots");
    expect(c.eyeStyle).toBe("rounded");
    expect(c.frame).toBe("badge");
    expect(c.frameText).toBe("MENU");
    expect(c.transparentBackground).toBe(true);
    expect(c.preset).toBe("bold");
  });

  it("returns the same object for the baked-in default", () => {
    expect(normalizeCustomization(DEFAULT_CUSTOMIZATION)).toEqual(DEFAULT_CUSTOMIZATION);
  });
});

describe("customizationSchema (Phase 8 round-trip)", () => {
  it("accepts legacy customizations untouched", () => {
    expect(customizationSchema.safeParse(LEGACY_CUSTOMIZATION).success).toBe(true);
  });

  it("accepts new fields and preserves them on parse", () => {
    const custom = {
      ...LEGACY_CUSTOMIZATION,
      eyeStyle: "dots",
      eyeColor: "#1E40AF",
      frame: "scan",
      frameText: "SCAN ME",
      transparentBackground: true,
      preset: "bold",
    };
    const parsed = customizationSchema.parse(custom);
    expect(parsed.eyeStyle).toBe("dots");
    expect(parsed.eyeColor).toBe("#1E40AF");
    expect(parsed.frame).toBe("scan");
    expect(parsed.frameText).toBe("SCAN ME");
    expect(parsed.transparentBackground).toBe(true);
  });

  it("rejects a logo object with an invalid shape", () => {
    const custom = {
      ...LEGACY_CUSTOMIZATION,
      logo: { dataUrl: "x", size: 15, margin: 6, shape: "hexagon" },
    };
    expect(customizationSchema.safeParse(custom).success).toBe(false);
  });

  it("rejects a frame text longer than 30 characters", () => {
    const custom = { ...LEGACY_CUSTOMIZATION, frameText: "a".repeat(31) };
    expect(customizationSchema.safeParse(custom).success).toBe(false);
  });
});

describe("recordFromBackup (import path)", () => {
  it("normalizes the customization of imported legacy records", () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        app: "qr-manager",
        version: 1,
        qrCodes: [
          {
            id: "qr-1",
            name: "Legacy",
            type: "text",
            values: { text: "hello" },
            customization: LEGACY_CUSTOMIZATION,
            isDynamic: false,
            favorite: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
    );
    const record = recordFromBackup(parsed.qrCodes[0]);
    expect(normalizeCustomization(record.customization).eyeStyle).toBe("square");
    expect(record.customization.frame).toBe("none");
  });
});