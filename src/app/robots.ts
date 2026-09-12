import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/features/qr/dynamic/url";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/qrs",
  "/create",
  "/analytics",
  "/settings",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Dynamic QR public redirects must never be crawled: the redirect target
  // (the destination) is user-owned content we have no right to index.
  "/qr/",
];

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppBaseUrl() || "https://qr-manager.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PREFIXES,
    },
    host: appUrl,
    sitemap: undefined,
  };
}