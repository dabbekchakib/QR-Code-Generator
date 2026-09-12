"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function ServiceWorkerRegistration() {
  const { t } = useI18n();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
      } catch {
        return;
      }
      if (!registration) return;

      // A new version was installed while an older worker still controls the
      // page: surface the "refresh to update" prompt. No forced reload.
      registration.addEventListener("updatefound", () => {
        const newWorker = registration?.installing;
        if (!newWorker) return;
        let prompted = false;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller &&
            !prompted
          ) {
            prompted = true;
            setUpdateAvailable(true);
          }
        });
      });

      // Re-check for updates when the app regains focus so server deploys
      // surface quickly.
      void registration.update().catch(() => {});
    };

    void register();

    const onFocus = () => {
      void navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          void reg?.update().catch(() => {});
        })
        .catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const refresh = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch {
      /* ignore — still attempt the reload below */
    }
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-4 inset-x-4 z-[70] sm:inset-x-auto sm:end-4 sm:max-w-md"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="flex-1 text-sm text-foreground">
          {t("pwa.newVersionAvailable")}
        </p>
        <Button size="sm" onClick={refresh}>
          <RefreshCcw className="size-4" />
          {t("pwa.refreshToUpdate")}
        </Button>
      </div>
    </div>
  );
}