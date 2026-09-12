import { describe, it, expect } from "vitest";
import { getTemplateById, templateRegistry, TEMPLATE_CATEGORIES } from "../registry";
import { POPULAR_TEMPLATE_IDS, QUICK_CREATE_TEMPLATE_IDS } from "../data";
import { QR_DESIGN_PRESETS, getPresetById, presetCustomization } from "../presets";
import { validateQRContrast } from "../utils/contrast";
import { DEFAULT_CUSTOMIZATION } from "@/features/qr/types";

const EXPECTED_IDS = [
  "website",
  "restaurant-menu",
  "whatsapp",
  "business-card",
  "contact",
  "wifi",
  "location",
  "event",
  "social-profile",
  "google-review",
];

describe("template registry", () => {
  it("exposes exactly the 10 templates from the spec", () => {
    const ids = templateRegistry.map((t) => t.id);
    expect(ids).toEqual(EXPECTED_IDS);
  });

  it("gives every template a unique id and name key", () => {
    const ids = new Set(templateRegistry.map((t) => t.id));
    const nameKeys = new Set(templateRegistry.map((t) => t.nameKey));
    expect(ids.size).toBe(templateRegistry.length);
    expect(nameKeys.size).toBe(templateRegistry.length);
  });

  it("finds a template by id", () => {
    expect(getTemplateById("wifi")?.qrType).toBe("wifi");
    expect(getTemplateById("restaurant-menu")?.defaultMode).toBe("dynamic");
  });

  it("returns null for unknown, empty or missing template ids", () => {
    expect(getTemplateById("whatever")).toBeNull();
    expect(getTemplateById("")).toBeNull();
    expect(getTemplateById(null)).toBeNull();
    expect(getTemplateById(undefined)).toBeNull();
  });

  it("resolves every registry id through getTemplateById", () => {
    for (const template of templateRegistry) {
      expect(getTemplateById(template.id)?.id).toBe(template.id);
    }
  });

  it("every template defines all required pieces", () => {
    for (const template of templateRegistry) {
      expect(template.schema).toBeDefined();
      expect(template.toPayload).toBeTypeOf("function");
      expect(template.defaultValues).toBeDefined();
      expect(template.fields.length).toBeGreaterThan(0);
      expect(template.presetId).toMatch(/^(classic|midnight|minimal|soft|bold)$/);
      expect(template.category).toBeTruthy();
      expect(template.defaultName).toBeTruthy();
    }
  });

  it("dynamic templates declare their destination field", () => {
    for (const template of templateRegistry) {
      if (template.defaultMode === "dynamic") {
        expect(template.dynamicField).toBeTruthy();
        expect(template.fields.some((f) => f.key === template.dynamicField)).toBe(true);
      }
    }
  });

  it("every field default matches its descriptor default", () => {
    for (const template of templateRegistry) {
      for (const field of template.fields) {
        expect(template.defaultValues[field.key]).toBe(field.default);
      }
    }
  });

  it("covers the full gallery grid order", () => {
    expect(POPULAR_TEMPLATE_IDS.length).toBe(6);
    for (const id of POPULAR_TEMPLATE_IDS) {
      expect(getTemplateById(id)).not.toBeNull();
    }
    expect(QUICK_CREATE_TEMPLATE_IDS.length).toBe(4);
  });

  it("lists every category chip", () => {
    const categories = TEMPLATE_CATEGORIES.map((c) => c.id);
    expect(categories).toEqual([
      "all",
      "business",
      "restaurant",
      "contact",
      "social",
      "events",
      "marketing",
      "other",
    ]);
  });

  it("every template category is represented in the chips", () => {
    const chipIds = new Set(TEMPLATE_CATEGORIES.map((c) => c.id));
    for (const template of templateRegistry) {
      expect(chipIds.has(template.category)).toBe(true);
    }
  });
});

describe("design presets", () => {
  it("every preset passes the contrast gate", () => {
    for (const preset of QR_DESIGN_PRESETS) {
      const result = validateQRContrast(preset.background, preset.foreground);
      expect(
        result.sufficient,
        `${preset.id} contrast ${result.ratio.toFixed(2)}:1`
      ).toBe(true);
    }
  });

  it("presetCustomization keeps the current size and margin", () => {
    const preset = QR_DESIGN_PRESETS[2];
    const custom = presetCustomization(preset, { size: 128, margin: 8 });
    expect(custom.size).toBe(128);
    expect(custom.margin).toBe(8);
    expect(custom.foreground).toBe(preset.foreground);
    expect(custom.background).toBe(preset.background);
    expect(custom.errorCorrection).toBe(preset.errorCorrection);
    expect(custom.style).toBe(preset.style);
  });

  it("unknown preset ids fall back to the classic preset", () => {
    expect(getPresetById("nope")?.id).toBe("classic");
    expect(getPresetById(undefined)?.id).toBe("classic");
    expect(presetCustomization(getPresetById("classic"), DEFAULT_CUSTOMIZATION)).toEqual(
      DEFAULT_CUSTOMIZATION
    );
  });
});