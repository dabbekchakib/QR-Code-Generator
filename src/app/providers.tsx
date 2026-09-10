"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { I18nProvider } from "@/i18n/provider";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { SyncManager } from "@/components/sync-manager";
import { FirstSyncDialog } from "@/components/first-sync-dialog";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { Toaster } from "@/components/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ServiceWorkerRegistration />
          <TooltipProvider delay={300}>{children}</TooltipProvider>
          <SyncManager />
          <FirstSyncDialog />
          <Toaster />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}