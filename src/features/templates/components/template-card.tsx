"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { QRTemplate } from "../types";

interface TemplateCardProps {
  template: QRTemplate;
  favorite: boolean;
  onToggleFavorite?: (id: string) => void;
  onUse?: () => void;
}

export function TemplateCard({ template, favorite, onToggleFavorite, onUse }: TemplateCardProps) {
  const { t } = useI18n();
  const Icon = template.icon;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden className="size-5" />
            </div>
            <div className="text-sm font-medium">{t(template.nameKey)}</div>
          </div>
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                favorite
                  ? `${t("templates.unfavorite")} ${t(template.nameKey)}`
                  : `${t("templates.favorite")} ${t(template.nameKey)}`
              }
              onClick={() => onToggleFavorite(template.id)}
              className={cn(
                "-mr-1 -mt-1 shrink-0 text-muted-foreground",
                favorite && "text-amber-500"
              )}
            >
              <Star aria-hidden className={cn("size-4", favorite && "fill-current")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {t(template.descriptionKey)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{t(`templates.categories.${template.category}`)}</Badge>
          <Badge variant="outline">
            {t(
              template.defaultMode === "dynamic"
                ? "templates.badges.dynamic"
                : "templates.badges.static"
            )}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          render={<Link href={`/create?template=${template.id}`} />}
          nativeButton={false}
          className="w-full"
          onClick={onUse}
        >
          {t("templates.useTemplate")}
        </Button>
      </CardFooter>
    </Card>
  );
}