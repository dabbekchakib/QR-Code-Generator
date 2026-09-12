"use client";

import { useSyncStore, type SyncStatusValue } from "@/features/qr/sync/sync-store";
import { useI18n } from "@/i18n/provider";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, WifiOff, Clock } from "lucide-react";

function SyncLabel({ status }: { status: SyncStatusValue }) {
  const { t } = useI18n();
  const map: Record<SyncStatusValue, string> = {
    idle: "sync.synced",
    syncing: "sync.syncing",
    synced: "sync.synced",
    error: "sync.syncError",
  };
  return <>{t(map[status])}</>;
}

export function SyncStatus() {
  const { status, pendingCount, online, storageError } = useSyncStore();
  const { t } = useI18n();

  // Local storage is failing: show a user-facing message regardless of mode.
  if (storageError) {
    return (
      <Badge variant="destructive" className="gap-1.5 text-xs">
        <AlertTriangle className="size-3" />
        <span className="hidden sm:inline">{t("sync.storageUnavailable")}</span>
      </Badge>
    );
  }

  // Anonymous/local mode or nothing pending: show nothing extra.
  if (status === "idle" && pendingCount === 0) return null;

  const Icon =
    status === "error" ? (
      <AlertTriangle className="size-3" />
    ) : status === "syncing" ? (
      <Loader2 className="size-3 animate-spin" />
    ) : pendingCount > 0 ? (
      <Clock className="size-3" />
    ) : !online ? (
      <WifiOff className="size-3" />
    ) : (
      <CheckCircle2 className="size-3" />
    );

  return (
    <Badge
      variant={status === "error" || !online ? "destructive" : status === "syncing" ? "outline" : "default"}
      className="gap-1.5 text-xs"
    >
      {Icon}
      {pendingCount > 0 ? (
        <span className="hidden sm:inline">
          {t("sync.pendingCount").replace("{count}", String(pendingCount))}
        </span>
      ) : (
        <span className="hidden sm:inline">
          <SyncLabel status={status} />
        </span>
      )}
    </Badge>
  );
}