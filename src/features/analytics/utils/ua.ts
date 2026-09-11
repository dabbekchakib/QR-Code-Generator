import type {
  Browser,
  DeviceType,
  OperatingSystem,
  ScanMetadata,
} from "../types";

/**
 * Lightweight, server-side User-Agent parser. Reduces a UA string to the three
 * limited technical categories stored in qr_scans (device type, operating
 * system, browser). The raw UA is never persisted.
 */
export function parseUserAgent(
  userAgent: string | null | undefined
): ScanMetadata {
  const ua = (userAgent ?? "").trim();
  if (!ua) {
    return { deviceType: "unknown", operatingSystem: "Unknown", browser: "Unknown" };
  }
  return {
    deviceType: detectDeviceType(ua),
    operatingSystem: detectOperatingSystem(ua),
    browser: detectBrowser(ua),
  };
}

function detectDeviceType(ua: string): DeviceType {
  // iPadOS 13+ reports itself as "Macintosh; Intel Mac OS X ... Mobile", so an
  // explicit Mobile token next to Macintosh is treated as a tablet.
  if (
    /ipad|tablet|kindle|silk|playbook|xoom|nexus (7|9)|\bsm-t\b|\bgt-p\b/i.test(ua) ||
    /\bMacintosh\b.*\bMobile\b/i.test(ua)
  ) {
    return "tablet";
  }
  if (
    /iphone|ipod|iemobile|windows phone|blackberry|opera mini|opera mobi|\bbb10\b|\bandroid\b.*\bmobile\b|\bmobile\b/i.test(
      ua
    )
  ) {
    return "mobile";
  }
  if (/windows|macintosh|mac os|linux|cros|x11/i.test(ua)) {
    return "desktop";
  }
  return "unknown";
}

function detectOperatingSystem(ua: string): OperatingSystem {
  if (/ipad|iphone|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x|macintosh|darwin/i.test(ua)) return "macOS";
  if (/linux|ubuntu|fedora|debian|gentoo|arch|suse/i.test(ua)) return "Linux";
  return "Unknown";
}

function detectBrowser(ua: string): Browser {
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/edg(?:e|ios|a)?\/[\d.]+/i.test(ua)) return "Edge";
  if (/chrome\/[\d.]+/i.test(ua)) return "Chrome";
  if (/firefox\/[\d.]+/i.test(ua)) return "Firefox";
  if (/version\/[\d.]+.*safari/i.test(ua)) return "Safari";
  if (/opera|opr\/|opios/i.test(ua)) return "Other";
  return "Unknown";
}