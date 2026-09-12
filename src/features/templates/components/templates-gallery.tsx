"use client";

import { useMemo, useState } from "react";
import { Clock, LayoutTemplate, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { useTemplatePreferences } from "../hooks/use-template-preferences";
import { listTemplates, TEMPLATE_CATEGORIES, getTemplateById } from "../registry";
import { TemplateCard } from "./template-card";
import type { TemplateCategory } from "../types";
import { cn } from "@/lib/utils";

export function TemplatesGallery() {
  const { t } = useI18n();
  const { favorites, recent, isFavorite, toggleFavorite, markUsed } =
    useTemplatePreferences();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const templates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listTemplates().filter((template) => {
      if (category !== "all" && template.category !== category) return false;
      if (!q) return true;
      const name = t(template.nameKey).toLowerCase();
      const description = t(template.descriptionKey).toLowerCase();
      return name.includes(q) || description.includes(q);
    });
  }, [query, category, t]);

  const recentIds = recent.filter((id) => getTemplateById(id));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutTemplate className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("templates.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("templates.subtitle")}</p>
        </div>
      </div>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("templates.searchPlaceholder")}
          aria-label={t("templates.searchPlaceholder")}
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              category === cat.id
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {recentIds.length > 0 && !query && category === "all" && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock aria-hidden className="size-4" />
            {t("templates.recentlyUsed")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentIds.map((id) => {
              const template = getTemplateById(id)!;
              return (
                <TemplateCard
                  key={id}
                  template={template}
                  favorite={isFavorite(id)}
                  onToggleFavorite={toggleFavorite}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span
            className={cn(
              favorites.size > 0 ? "text-amber-500" : undefined
            )}
          >
            ★
          </span>
          {t("templates.favorites")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listTemplates()
            .filter((template) => isFavorite(template.id))
            .map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                favorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("templates.allTemplates")}
        </h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("templates.noResults")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        )}
      </div>
    </div>
  );
}