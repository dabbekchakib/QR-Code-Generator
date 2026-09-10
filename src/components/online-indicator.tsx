"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks";
import { Badge } from "@/components/ui/badge";

export function OnlineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className="gap-1.5 text-xs"
    >
      {isOnline ? (
        <>
          <Wifi className="size-3" />
          <span className="hidden sm:inline">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="size-3" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </Badge>
  );
}
