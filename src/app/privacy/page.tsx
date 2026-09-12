import type { Metadata } from "next";
import { LegalPage, generateLegalMetadata } from "@/features/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  return generateLegalMetadata("privacy");
}

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}