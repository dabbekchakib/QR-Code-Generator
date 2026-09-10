import type { Metadata } from "next";
import { AuthShell } from "./auth-shell";

export const metadata: Metadata = {
  title: { default: "QR Manager — Account", template: "%s | QR Manager" },
  description: "Manage your QR Manager account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}