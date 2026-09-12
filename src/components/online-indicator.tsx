"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks";
import { useI18n } from "@/i18n/provider";
import { Badge } from "@/components/ui/badge";

export function OnlineIndicator() {
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className="gap-1.5 text-xs"
    >
      {isOnline ? (
        <>
          <Wifi className="size-3" />
          <span className="hidden sm:inline">{t("common.online")}</span>
        </>
      ) : (
        <>
          <WifiOff className="size-3" />
          <span className="hidden sm:inline">{t("common.offline")}</span>
        </>
      )}
    </Badge>
  );
}
