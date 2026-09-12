import { describe, it, expect } from "vitest";
import { getTemplateById } from "../registry";
import { generateQRContent } from "@/features/qr/lib/qr-generator";

/**
 * The create flow derives the generated QR content from the template payload:
 *   templateValues -> template.schema -> template.toPayload(result) ->
 *   generateQRContent(template.qrType, payload).
 * These tests lock that pipeline so templates can never drift from the engine.
 */
function contentOf(id: string, values: Record<string, unknown>): string {
  const template = getTemplateById(id);
  if (!template) throw new Error(`Unknown template ${id}`);
  const parsed = template.schema.parse(values);
  return generateQRContent(template.qrType, template.toPayload(parsed));
}

describe("template payloads produce real QR content", () => {
  it("website -> https URL", () => {
    const content = contentOf("website", { name: "Site", url: "https://example.com" });
    expect(content).toBe("https://example.com");
  });

  it("restaurant menu -> https URL (dynamic destination)", () => {
    const content = contentOf("restaurant-menu", {
      name: "Menu",
      url: "https://example.com/menu",
    });
    expect(content).toBe("https://example.com/menu");
    expect(getTemplateById("restaurant-menu")?.defaultMode).toBe("dynamic");
  });

  it("whatsapp -> wa.me link with encoded message", () => {
    const content = contentOf("whatsapp", {
      name: "Chat",
      phone: "+33 6 12 34 56 78",
      message: "Hi there",
    });
    expect(content).toContain("https://wa.me/33612345678");
    expect(content).toContain(encodeURIComponent("Hi there"));
  });

  it("business card -> vCard FN with trimmed names", () => {
    const content = contentOf("business-card", {
      firstName: "  Jane ",
      lastName: "Doe",
      phone: "+33612345678",
    });
    expect(content).toContain("BEGIN:VCARD");
    expect(content).toContain("FN:Jane Doe");
    expect(content).toContain("TEL:+33612345678");
  });

  it("contact -> vCard with FN equal to the contact name (no empty last name)", () => {
    const template = getTemplateById("contact")!;
    const parsed = template.schema.parse({ name: "Reception", phone: "+33612345678" });
    expect(template.toPayload(parsed)).toMatchObject({ firstName: "Reception", lastName: "" });
    const content = generateQRContent(template.qrType, template.toPayload(parsed));
    expect(content).toContain("FN:Reception");
    expect(content).toContain("TEL:+33612345678");
  });

  it("wifi -> WIFI string, open network omits password", () => {
    const open = contentOf("wifi", {
      ssid: "Cafe",
      security: "none",
      password: "",
      hidden: false,
    });
    expect(open).toBe("WIFI:T:nopass;S:Cafe;;");
  });

  it("location with coordinates -> Google Maps URL", () => {
    const content = contentOf("location", {
      name: "Shop",
      latitude: "48.8566",
      longitude: "2.3522",
      url: "",
    });
    expect(content).toContain("google.com/maps?q=48.8566,2.3522");
  });

  it("location with a maps URL keeps the URL verbatim", () => {
    const content = contentOf("location", {
      name: "Shop",
      url: "https://maps.app.goo.gl/xyz",
      latitude: "",
      longitude: "",
    });
    expect(content).toBe("https://maps.app.goo.gl/xyz");
  });

  it("event -> Google Calendar render URL with dates", () => {
    const content = contentOf("event", {
      name: "Launch",
      date: "2026-10-01",
      startTime: "09:00",
      endTime: "11:00",
      location: "Paris",
      description: "",
    });
    expect(content).toContain("calendar.google.com/calendar/render?");
    const decoded = new URL(content).searchParams.get("dates");
    expect(decoded).toBe("20261001T090000/20261001T110000");
  });

  it("social profile -> profile URL", () => {
    const content = contentOf("social-profile", {
      name: "IG",
      url: "https://instagram.com/yourprofile",
    });
    expect(content).toBe("https://instagram.com/yourprofile");
  });

  it("google review -> review URL (dynamic destination)", () => {
    const content = contentOf("google-review", {
      name: "Reviews",
      url: "https://g.page/r/xyz/review",
    });
    expect(content).toBe("https://g.page/r/xyz/review");
    expect(getTemplateById("google-review")?.defaultMode).toBe("dynamic");
  });

  it("computeName for business cards joins first + last", () => {
    const template = getTemplateById("business-card")!;
    expect(template.computeName?.({ firstName: "Jane", lastName: "Doe" })).toBe("Jane Doe");
    expect(template.computeName?.({ firstName: "Jane", lastName: "" })).toBe("Jane");
    expect(template.computeName?.({ firstName: "", lastName: "" })).toBeNull();
  });
});