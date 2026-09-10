import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://qr-manager.app",
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
