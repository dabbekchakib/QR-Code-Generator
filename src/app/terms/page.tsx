import type { Metadata } from "next";
import { LegalPage, generateLegalMetadata } from "@/features/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  return generateLegalMetadata("terms");
}

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}