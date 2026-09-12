import { describe, it, expect } from "vitest";
import { getShareText, getShareMetadata, isWellFormedHttpUrl } from "../lib/share-metadata";

describe("getShareText", () => {
  it("shares the permanent URL for dynamic QR codes, never the destination", () => {
    expect(
      getShareText({
        isDynamic: true,
        content: "https://app.example/qr/abc123",
        permanentUrl: "https://app.example/qr/abc123",
      })
    ).toBe("https://app.example/qr/abc123");
  });

  it("falls back to the encoded content when the public URL is unknown", () => {
    expect(
      getShareText({ isDynamic: true, content: "https://app.example/qr/abc", permanentUrl: null })
    ).toBe("https://app.example/qr/abc");
  });

  it("shares the encoded content for static QR codes", () => {
    expect(getShareText({ isDynamic: false, content: "WIFI:T:WPA;S:net;;", permanentUrl: null })).toBe(
      "WIFI:T:WPA;S:net;;"
    );
  });
});

describe("getShareMetadata", () => {
  it("dynamic: text and description are the public URL", () => {
    const meta = getShareMetadata({
      name: "Menu",
      isDynamic: true,
      content: "https://app.example/qr/menu1",
      permanentUrl: "https://app.example/qr/menu1",
      destinationUrl: "https://secret.backoffice.example/orders",
    });
    expect(meta.title).toBe("Menu");
    expect(meta.text).toBe("https://app.example/qr/menu1");
    // The destination (edit-only value) must never leak into share metadata.
    expect(meta.description).toBe("https://app.example/qr/menu1");
    expect(JSON.stringify(meta)).not.toContain("secret.backoffice");
  });

  it("static URL: description surfaces the encoded URL", () => {
    const meta = getShareMetadata({
      name: "Site",
      isDynamic: false,
      content: "https://landing.example",
      contentType: "website",
    });
    expect(meta.text).toBe("https://landing.example");
    expect(meta.description).toBe("https://landing.example");
  });

  it("static non-URL content has no URL description", () => {
    const meta = getShareMetadata({
      name: "Note",
      isDynamic: false,
      content: "Hello world",
    });
    expect(meta.description).toBeUndefined();
  });
});

describe("isWellFormedHttpUrl", () => {
  it("true for http(s)", () => {
    expect(isWellFormedHttpUrl("https://a.dev")).toBe(true);
    expect(isWellFormedHttpUrl("http://a.dev")).toBe(true);
  });
  it("false for other schemes / invalid", () => {
    expect(isWellFormedHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isWellFormedHttpUrl("mailto:a@b.c")).toBe(false);
    expect(isWellFormedHttpUrl("")).toBe(false);
  });
});