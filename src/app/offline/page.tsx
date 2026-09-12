"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCcw } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const { t } = useI18n();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );

  useEffect(() => {
    const handle = () => {
      setOnline(true);
      window.location.reload();
    };
    window.addEventListener("online", handle);
    return () => window.removeEventListener("online", handle);
  }, []);

  if (online) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t("offline.reconnecting")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <WifiOff className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t("offline.title")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("offline.desc")}
          </p>
        </div>
        <Button
          size="lg"
          className="mx-auto"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className="size-4" />
          {t("offline.retry")}
        </Button>
      </div>
    </div>
  );
}