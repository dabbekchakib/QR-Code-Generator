"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type { QRCustomization } from "../../types";
import {
  type QRDesignIssue,
  assessQRDesign,
} from "../../designer/qr-readability";

interface QRDesignWarningsProps {
  customization: QRCustomization;
}

const ISSUE_KEYS: Record<QRDesignIssue["code"], string> = {
  contrast: "design.warnContrast",
  "margin-low": "design.warnMarginLow",
  "logo-large": "design.warnLogoLarge",
  "logo-without-high-correction": "design.warnLogoNoHigh",
  "transparent-background": "design.warnTransparent",
  "decorative-style": "design.warnDecorative",
};

export function QRDesignWarnings({ customization }: QRDesignWarningsProps) {
  const { t } = useI18n();
  const assessment = useMemo(() => assessQRDesign(customization), [customization]);

  const qualityLabel =
    assessment.quality === "good"
      ? t("design.qualityGood")
      : assessment.quality === "warning"
        ? t("design.qualityWarning")
        : t("design.qualityDanger");

  const qualityClass =
    assessment.quality === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : assessment.quality === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{t("design.warningsTitle")}</span>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", qualityClass)}>
          {assessment.quality === "good" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          {qualityLabel}
        </span>
      </div>

      <ul className="space-y-1.5">
        {assessment.warnings.map((issue) => {
          const Icon =
            issue.level === "danger"
              ? ShieldAlert
              : issue.level === "warning"
                ? AlertTriangle
                : Info;
          return (
            <li
              key={issue.code}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                issue.level === "danger"
                  ? "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400"
                  : issue.level === "warning"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400"
                    : "border-border bg-card text-muted-foreground"
              )}
            >
              <Icon className="size-3.5 mt-0.5 shrink-0" />
              <span>
                {issue.code === "contrast"
                  ? t(ISSUE_KEYS.contrast, { ratio: (issue.ratio ?? 0).toFixed(2) })
                  : t(ISSUE_KEYS[issue.code])}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}