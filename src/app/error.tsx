"use client";

import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  // Never leak stack traces, SQL, tokens or environment details to the user.
  console.error("Unexpected page error:", error.message);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center space-y-5 max-w-md">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground">
            {t("errors.genericTitle")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("errors.genericDesc")}
          </p>
        </div>
        <Button onClick={reset}>{t("errors.tryAgain")}</Button>
      </div>
    </div>
  );
}