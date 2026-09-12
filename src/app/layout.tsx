import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { defaultLocale, locales, rtlLocales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { getAppBaseUrl } from "@/features/qr/dynamic/url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Inter has no Arabic glyphs: Arabic UI falls back to a dedicated font.
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

// Resolved at build time on the server: env fallback keeps the URL correct
// without hardcoding the production domain across environments.
const appUrl = getAppBaseUrl() || "https://qr-manager.app";

export const metadata: Metadata = {
  title: {
    default: "QR Manager — Free QR Code Generator & Manager",
    template: "%s | QR Manager",
  },
  description:
    "Create, customize and manage QR Codes for free. Static and dynamic QR Codes with analytics.",
  keywords: [
    "QR code generator",
    "QR code manager",
    "free QR code",
    "dynamic QR code",
    "static QR code",
    "QR code analytics",
    "PWA",
  ],
  authors: [{ name: "QR Manager" }],
  creator: "QR Manager",
  alternates: {
    canonical: appUrl,
  },
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: appUrl,
    siteName: "QR Manager",
    title: "QR Manager — Free QR Code Generator & Manager",
    description:
      "Create, customize and manage QR Codes for free. Static and dynamic QR Codes with analytics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Manager — Free QR Code Generator & Manager",
    description:
      "Create, customize and manage QR Codes for free. Static and dynamic QR Codes with analytics.",
  },
  manifest: "/manifest.json",
  applicationName: "QR Manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QR Manager",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Match the client-side saved locale at SSR so lang/dir are correct on the
  // first paint for Arabic users (cookie is kept in sync by the I18nProvider).
  const cookieStore = await cookies();
  const stored = cookieStore.get("qr-manager-locale")?.value;
  const locale: Locale =
    stored && locales.includes(stored as Locale)
      ? (stored as Locale)
      : defaultLocale;
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={cn(inter.variable, notoArabic.variable, "font-sans antialiased")}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}