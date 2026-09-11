import { describe, it, expect } from "vitest";
import { parseUserAgent } from "../utils/ua";

describe("parseUserAgent", () => {
  it("handles iPhone Safari as mobile/iOS/Safari", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
    );
    expect(result).toEqual({
      deviceType: "mobile",
      operatingSystem: "iOS",
      browser: "Safari",
    });
  });

  it("handles an iPad as a tablet", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1"
    );
    expect(result.deviceType).toBe("tablet");
    expect(result.operatingSystem).toBe("iOS");
  });

  it("handles iPadOS 13+ (Macintosh UA with Mobile token) as a tablet", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    );
    expect(result.deviceType).toBe("tablet");
    expect(result.operatingSystem).toBe("macOS");
  });

  it("handles Android Chrome as mobile/Android/Chrome", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    );
    expect(result).toEqual({
      deviceType: "mobile",
      operatingSystem: "Android",
      browser: "Chrome",
    });
  });

  it("handles Windows Chrome as desktop/Windows/Chrome", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    expect(result).toEqual({
      deviceType: "desktop",
      operatingSystem: "Windows",
      browser: "Chrome",
    });
  });

  it("handles macOS Safari as desktop/macOS/Safari", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    );
    expect(result).toEqual({
      deviceType: "desktop",
      operatingSystem: "macOS",
      browser: "Safari",
    });
  });

  it("handles Firefox on Windows as desktop/Windows/Firefox", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0"
    );
    expect(result).toEqual({
      deviceType: "desktop",
      operatingSystem: "Windows",
      browser: "Firefox",
    });
  });

  it("handles Edge on macOS as desktop/macOS/Edge", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    );
    expect(result).toEqual({
      deviceType: "desktop",
      operatingSystem: "macOS",
      browser: "Edge",
    });
  });

  it("handles Samsung Internet on Android as mobile/Android/Samsung Internet", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36"
    );
    expect(result).toEqual({
      deviceType: "mobile",
      operatingSystem: "Android",
      browser: "Samsung Internet",
    });
  });

  it("returns Unknown/Other for an unrecognized bot UA", () => {
    const result = parseUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)");
    expect(result.deviceType).toBe("unknown");
    expect(result.operatingSystem).toBe("Unknown");
    expect(result.browser).toBe("Unknown");
  });

  it("returns Unknown categories for a missing UA", () => {
    expect(parseUserAgent(null)).toEqual({
      deviceType: "unknown",
      operatingSystem: "Unknown",
      browser: "Unknown",
    });
    expect(parseUserAgent(undefined)).toEqual({
      deviceType: "unknown",
      operatingSystem: "Unknown",
      browser: "Unknown",
    });
    expect(parseUserAgent("   ")).toEqual({
      deviceType: "unknown",
      operatingSystem: "Unknown",
      browser: "Unknown",
    });
  });
});