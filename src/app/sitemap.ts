import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/features/qr/dynamic/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppBaseUrl() || "https://qr-manager.app";
  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}