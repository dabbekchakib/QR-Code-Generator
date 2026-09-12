"use client";

import Link from "next/link";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { QUICK_CREATE_TEMPLATE_IDS } from "../data";
import { getTemplateById } from "../registry";

export function QuickCreate() {
  const { t } = useI18n();
  const templates = QUICK_CREATE_TEMPLATE_IDS.map((id) =>
    getTemplateById(id)
  ).filter((template) => template !== null);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="size-4 text-primary" />
            {t("dashboard.startFromTemplate")}
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/templates" />}
            nativeButton={false}
          >
            {t("templates.viewAll")}
            <ArrowRight className="size-3" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Link
                key={template.id}
                href={`/create?template=${template.id}`}
                className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
              >
                <Icon className="size-4 shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">
                  {t(template.nameKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}