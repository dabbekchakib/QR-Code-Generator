"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { useSyncStore } from "@/features/qr/sync/sync-store";
import { qrService } from "@/features/qr/service/qr-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, HardDrive, X } from "lucide-react";

export function FirstSyncDialog() {
  const { t } = useI18n();
  const prompt = useSyncStore((s) => s.firstSyncPrompt);
  const [pushing, setPushing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  if (!prompt) return null;

  const handlePush = () => {
    setPushing(true);
    void qrService.pushLocalToCloud((current, total) => setProgress({ current, total })).finally(() => {
      setPushing(false);
      setProgress(null);
      prompt.resolve("push");
    });
  };

  const handleKeep = () => prompt.resolve("keep");
  const handleCancel = () => prompt.resolve("cancel");

  const progressLabel = progress
    ? t("sync.pushProgress")
        .replace("{current}", String(progress.current))
        .replace("{total}", String(progress.total))
    : t("sync.syncing");

  return (
    <Dialog open={!!prompt}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sync.firstSyncTitle")}</DialogTitle>
          <DialogDescription>
            {pushing
              ? progressLabel
              : t("sync.firstSyncDesc").replace("{count}", String(prompt.cloudCount))}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {pushing ? (
            <span className="text-sm text-muted-foreground">{progressLabel}</span>
          ) : (
            <div className="grid w-full gap-2 sm:grid-cols-3">
              <Button variant="default" onClick={handlePush}>
                <CloudUpload className="size-4" />
                {t("sync.firstSyncPush")}
              </Button>
              <Button variant="outline" onClick={handleKeep}>
                <HardDrive className="size-4" />
                {t("sync.firstSyncKeep")}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                <X className="size-4" />
                {t("sync.firstSyncCancel")}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}