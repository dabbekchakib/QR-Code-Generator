import { describe, it, expect } from "vitest";
import {
  generateURLData,
  generateWiFiData,
  generatePhoneData,
  generateEmailData,
  generateWhatsAppData,
  generateVCardData,
  generateTextData,
  generateQRContent,
} from "../lib/qr-generator";

describe("generateURLData", () => {
  it("returns a URL unchanged when already formed", () => {
    expect(generateURLData({ url: "https://example.com" })).toBe("https://example.com");
  });

  it("keeps http:// URLs", () => {
    expect(generateURLData({ url: "http://example.com" })).toBe("http://example.com");
  });

  it("auto-prepends https:// for domains without protocol", () => {
    expect(generateURLData({ url: "example.com" })).toBe("https://example.com");
  });

  it("supports Unicode URLs", () => {
    expect(generateURLData({ url: "https://例え.jp" })).toBe("https://例え.jp");
  });

  it("trims surrounding whitespace", () => {
    expect(generateURLData({ url: "  https://example.com  " })).toBe("https://example.com");
  });
});

describe("generatePhoneData", () => {
  it("normalizes to tel: format", () => {
    expect(generatePhoneData({ phone: "+216 24 246 619" })).toBe("tel:+21624246619");
  });

  it("removes dashes and parentheses", () => {
    expect(generatePhoneData({ phone: "+1 (555) 123-4567" })).toBe("tel:+15551234567");
  });

  it("keeps the international prefix", () => {
    expect(generatePhoneData({ phone: "+216 24 246 619" })).toContain("+216");
  });

  it("handles plain digits", () => {
    expect(generatePhoneData({ phone: "24246619" })).toBe("tel:24246619");
  });
});

describe("generateEmailData", () => {
  it("creates mailto with only email when no extras", () => {
    expect(generateEmailData({ email: "a@b.com", subject: "", message: "" })).toBe("mailto:a@b.com");
  });

  it("URL-encodes the subject", () => {
    const result = generateEmailData({ email: "a@b.com", subject: "Bonjour ça va?", message: "" });
    expect(result).toBe("mailto:a@b.com?subject=Bonjour%20%C3%A7a%20va%3F");
  });

  it("URL-encodes a multiline message", () => {
    const result = generateEmailData({ email: "a@b.com", subject: "", message: "Line1\nLine2" });
    expect(result).toBe("mailto:a@b.com?body=Line1%0ALine2");
  });

  it("combines subject and body with &", () => {
    const result = generateEmailData({ email: "a@b.com", subject: "Hi", message: "Hello" });
    expect(result).toBe("mailto:a@b.com?subject=Hi&body=Hello");
  });
});

describe("generateWhatsAppData", () => {
  it("builds wa.me link without message", () => {
    expect(generateWhatsAppData({ phone: "+21624246619", message: "" })).toBe("https://wa.me/21624246619");
  });

  it("strips spaces from phone", () => {
    expect(generateWhatsAppData({ phone: "+216 24 246 619", message: "" })).toBe("https://wa.me/21624246619");
  });

  it("strips dashes and parentheses", () => {
    expect(generateWhatsAppData({ phone: "+1 (555) 123-4567", message: "" })).toBe("https://wa.me/15551234567");
  });

  it("URL-encodes message with accents", () => {
    const result = generateWhatsAppData({ phone: "+21624246619", message: "Bonjour!" });
    expect(result).toBe("https://wa.me/21624246619?text=Bonjour!");
  });

  it("URL-encodes Arabic message", () => {
    const result = generateWhatsAppData({ phone: "+21624246619", message: "مرحبا" });
    expect(result).toBe("https://wa.me/21624246619?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7");
  });

  it("URL-encodes emoji message", () => {
    const result = generateWhatsAppData({ phone: "+21624246619", message: "Hi 👍" });
    expect(result).toBe("https://wa.me/21624246619?text=Hi%20%F0%9F%91%8D");
  });
});

describe("generateWiFiData", () => {
  it("generates WPA format", () => {
    const result = generateWiFiData({ ssid: "MyWiFi", password: "secret", security: "WPA", hidden: false });
    expect(result).toBe("WIFI:T:WPA;S:MyWiFi;P:secret;;");
  });

  it("generates WEP format", () => {
    const result = generateWiFiData({ ssid: "Net", password: "pass", security: "WEP", hidden: false });
    expect(result).toBe("WIFI:T:WEP;S:Net;P:pass;;");
  });

  it("generates open network format", () => {
    const result = generateWiFiData({ ssid: "GuestNet", password: "", security: "none", hidden: false });
    expect(result).toBe("WIFI:T:nopass;S:GuestNet;;");
  });

  it("adds hidden flag when hidden", () => {
    const result = generateWiFiData({ ssid: "Hidden", password: "pass", security: "WPA", hidden: true });
    expect(result).toBe("WIFI:T:WPA;S:Hidden;P:pass;H:true;;");
  });

  it("escapes special characters in SSID", () => {
    const result = generateWiFiData({ ssid: "A;B:C,D", password: "x", security: "WPA", hidden: false });
    expect(result).toBe("WIFI:T:WPA;S:A\\;B\\:C\\,D;P:x;;");
  });

  it("escapes backslash and semicolon in password", () => {
    const result = generateWiFiData({ ssid: "Net", password: "p;w\\d", security: "WPA", hidden: false });
    expect(result).toBe("WIFI:T:WPA;S:Net;P:p\\;w\\\\d;;");
  });
});

describe("generateVCardData", () => {
  it("builds a minimal vCard", () => {
    const result = generateVCardData({
      firstName: "John", lastName: "Doe", organization: "", jobTitle: "",
      phone: "", email: "", website: "", address: "", city: "", country: "", note: "",
    });
    expect(result).toContain("BEGIN:VCARD");
    expect(result).toContain("VERSION:3.0");
    expect(result).toContain("FN:John Doe");
    expect(result).toContain("N:Doe;John;;;");
    expect(result).toContain("END:VCARD");
  });

  it("includes optional fields when provided", () => {
    const result = generateVCardData({
      firstName: "John", lastName: "Doe", organization: "Acme", jobTitle: "Dev",
      phone: "+21624246619", email: "j@a.com", website: "https://acme.com",
      address: "1 Main St", city: "Paris", country: "France", note: "Nice",
    });
    expect(result).toContain("ORG:Acme");
    expect(result).toContain("TITLE:Dev");
    expect(result).toContain("TEL:+21624246619");
    expect(result).toContain("EMAIL:j@a.com");
    expect(result).toContain("URL:https://acme.com");
    expect(result).toContain("ADR:1 Main St;Paris;;;France");
    expect(result).toContain("NOTE:Nice");
  });

  it("escapes semicolons and commas in fields", () => {
    const result = generateVCardData({
      firstName: "John", lastName: "Doe", organization: "A;Corp", jobTitle: "",
      phone: "", email: "", website: "", address: "Ave, 5", city: "", country: "", note: "",
    });
    expect(result).toContain("ORG:A\\;Corp");
    expect(result).toContain("ADR:Ave\\, 5;;;;");
  });

  it("uses CRLF line endings", () => {
    const result = generateVCardData({
      firstName: "John", lastName: "Doe", organization: "", jobTitle: "",
      phone: "", email: "", website: "", address: "", city: "", country: "", note: "",
    });
    expect(result).toContain("\r\n");
  });

  it("supports Arabic field values", () => {
    const result = generateVCardData({
      firstName: "أحمد", lastName: "خالد", organization: "", jobTitle: "",
      phone: "", email: "", website: "", address: "", city: "", country: "", note: "",
    });
    expect(result).toContain("FN:أحمد خالد");
  });
});

describe("generateTextData", () => {
  it("returns text unchanged", () => {
    expect(generateTextData({ text: "Hello world" })).toBe("Hello world");
  });

  it("preserves multiline text", () => {
    expect(generateTextData({ text: "Line1\nLine2" })).toBe("Line1\nLine2");
  });

  it("preserves Unicode and emoji", () => {
    expect(generateTextData({ text: "مرحبا 👋 français" })).toBe("مرحبا 👋 français");
  });
});

describe("generateQRContent", () => {
  it("dispatches to the correct generator", () => {
    expect(generateQRContent("website", { url: "example.com" })).toBe("https://example.com");
    expect(generateQRContent("wifi", { ssid: "X", password: "p", security: "WPA", hidden: false })).toBe("WIFI:T:WPA;S:X;P:p;;");
    expect(generateQRContent("phone", { phone: "+216 24 246 619" })).toBe("tel:+21624246619");
    expect(generateQRContent("whatsapp", { phone: "+21624246619", message: "hi" })).toBe("https://wa.me/21624246619?text=hi");
    expect(generateQRContent("text", { text: "hello" })).toBe("hello");
  });
});