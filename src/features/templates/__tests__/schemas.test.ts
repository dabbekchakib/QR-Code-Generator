import { describe, it, expect } from "vitest";
import {
  websiteTemplateSchema,
  restaurantMenuTemplateSchema,
  whatsappTemplateSchema,
  businessCardTemplateSchema,
  contactTemplateSchema,
  wifiTemplateSchema,
  locationTemplateSchema,
  eventTemplateSchema,
  socialProfileTemplateSchema,
  googleReviewTemplateSchema,
} from "../schemas";
import { buildMapsUrl, buildCalendarUrl, areValidCoordinates, isValidEventDateTime } from "../utils/links";

describe("template schemas", () => {
  it("website: requires a valid http(s) URL", () => {
    expect(
      websiteTemplateSchema.safeParse({ name: "Site", url: "https://example.com" }).success
    ).toBe(true);
    expect(websiteTemplateSchema.safeParse({ name: "Site", url: "example.com" }).success).toBe(
      false
    );
    expect(websiteTemplateSchema.safeParse({ name: "Site", url: "" }).success).toBe(false);
  });

  it("restaurant menu / google review are the same URL shape", () => {
    const ok = { name: "Menu", url: "https://menu.example" };
    expect(restaurantMenuTemplateSchema.safeParse(ok).success).toBe(true);
    expect(googleReviewTemplateSchema.safeParse({ ...ok, name: "Review" }).success).toBe(true);
  });

  it("whatsapp: requires a phone number, message optional", () => {
    expect(
      whatsappTemplateSchema.safeParse({ name: "Chat", phone: "+33612345678", message: "" })
        .success
    ).toBe(true);
    expect(whatsappTemplateSchema.safeParse({ name: "Chat", phone: "abc" }).success).toBe(
      false
    );
  });

  it("business card: first name required, everything else optional", () => {
    expect(businessCardTemplateSchema.safeParse({ firstName: "Jane" }).success).toBe(true);
    expect(businessCardTemplateSchema.safeParse({ email: "janedoe@example.com" }).success).toBe(
      false
    );
    expect(
      businessCardTemplateSchema.safeParse({
        firstName: "Jane",
        email: "not-an-email",
      }).success
    ).toBe(false);
  });

  it("contact: name and a valid phone required", () => {
    expect(
      contactTemplateSchema.safeParse({ name: "Site Owner", phone: "+33612345678" }).success
    ).toBe(true);
    expect(contactTemplateSchema.safeParse({ name: "Site Owner" }).success).toBe(false);
  });

  it("wifi: security defaults to WPA and hides password when open", () => {
    const open = wifiTemplateSchema.safeParse({
      ssid: "Cafe",
      security: "none",
      password: "ignored",
    });
    expect(open.success).toBe(true);
    if (open.success) expect(open.data.hidden).toBe(false);
  });

  it("location: accepts a maps URL OR coordinates, not neither", () => {
    const byUrl = { name: "Shop", url: "https://maps.app.goo.gl/xyz" };
    const byCoords = { name: "Shop", latitude: "48.8566", longitude: "2.3522" };
    expect(locationTemplateSchema.safeParse(byUrl).success).toBe(true);
    expect(locationTemplateSchema.safeParse(byCoords).success).toBe(true);
    expect(locationTemplateSchema.safeParse({ name: "Shop" }).success).toBe(false);
    expect(locationTemplateSchema.safeParse({ name: "Shop", latitude: "999", longitude: "200" }).success).toBe(false);
  });

  it("event: requires a real date and start time", () => {
    const ok = { name: "Launch", date: "2026-10-01", startTime: "09:00" };
    expect(eventTemplateSchema.safeParse(ok).success).toBe(true);
    expect(eventTemplateSchema.safeParse({ ...ok, startTime: "" }).success).toBe(false);
    expect(eventTemplateSchema.safeParse({ ...ok, date: "2026/10/01" }).success).toBe(false);
  });

  it("social profile: same URL contract as website", () => {
    expect(
      socialProfileTemplateSchema.safeParse({ name: "IG", url: "https://instagram.com/x" })
        .success
    ).toBe(true);
    expect(socialProfileTemplateSchema.safeParse({ name: "IG", url: "instagram" }).success).toBe(
      false
    );
  });
});

describe("links helpers", () => {
  it("builds a coordinate maps URL with a zoom", () => {
    const url = buildMapsUrl({ latitude: "48.8566", longitude: "2.3522" });
    expect(url).toContain("https://www.google.com/maps?q=48.8566,2.3522&z=15");
  });

  it("falls back to a search URL when only a label is given", () => {
    const url = buildMapsUrl({ label: "Eiffel Tower" });
    expect(url).toContain("/maps/search/?api=1&query=");
    expect(url).toContain("Eiffel");
  });

  it("validates coordinate ranges", () => {
    expect(areValidCoordinates("48.8566", "2.3522")).toBe(true);
    expect(areValidCoordinates("91", "0")).toBe(false);
    expect(areValidCoordinates("0", "181")).toBe(false);
    expect(areValidCoordinates("abc", "2")).toBe(false);
  });

  it("builds a calendar render URL and validates dates", () => {
    const url = buildCalendarUrl({
      name: "Launch",
      date: "2026-10-01",
      startTime: "09:00",
      endTime: "11:00",
      location: "Paris",
      description: "Big day",
    });
    expect(url).toContain("calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    const decoded = new URL(url).searchParams.get("dates");
    expect(decoded).toBe("20261001T090000/20261001T110000");
    expect(isValidEventDateTime("2026-10-01", "09:00")).toBe(true);
    expect(isValidEventDateTime("2026-10-01", "")).toBe(true);
    expect(isValidEventDateTime("2026/10/01", "09:00")).toBe(false);
  });
});