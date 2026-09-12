import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  LOCALE_COOKIE,
  legalContent,
  legalUiLabels,
  getLegalLocale,
  isRtl,
} from "./legal-content";

async function getCookieValue() {
  const cookieStore = await cookies();
  return cookieStore.get(LOCALE_COOKIE)?.value;
}

export async function generateLegalMetadata(
  kind: "privacy" | "terms"
): Promise<Metadata> {
  const locale = getLegalLocale(await getCookieValue());
  const content = legalContent[locale][kind];
  return {
    title: content.title,
    description: content.description,
  };
}

export async function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const locale = getLegalLocale(await getCookieValue());
  const content = legalContent[locale][kind];
  const ui = legalUiLabels[locale];
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" showText />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
            {ui.backHome}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8" dir={dir}>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
          <p className="text-muted-foreground">{content.description}</p>
          <p className="text-xs text-muted-foreground/80">
            {ui.updatedLabel} {content.lastUpdated}
          </p>
        </div>

        <div className="space-y-6">
          {content.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="border-t border-border pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            {ui.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}