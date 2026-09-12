"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { POPULAR_TEMPLATE_IDS } from "../data";
import { getTemplateById } from "../registry";
import { useTemplatePreferences } from "../hooks/use-template-preferences";
import { TemplateCard } from "./template-card";

/** Server-friendly section shown on the marketing homepage. */
export function PopularTemplates() {
  const { t } = useI18n();
  const { isFavorite, toggleFavorite, markUsed } = useTemplatePreferences();
  const templates = POPULAR_TEMPLATE_IDS.map((id) => getTemplateById(id)).filter(
    (template) => template !== null
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
            <Sparkles aria-hidden className="size-5 text-primary" />
            {t("templates.homePopularTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("templates.homePopularSubtitle")}
          </p>
        </div>
        <Button
          variant="ghost"
          render={<Link href="/templates" />}
          nativeButton={false}
        >
          {t("templates.viewAll")}
          <ArrowRight aria-hidden />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            favorite={isFavorite(template.id)}
            onToggleFavorite={toggleFavorite}
            onUse={() => markUsed(template.id)}
          />
        ))}
      </div>
    </section>
  );
}