"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { I18nProvider } from "@/i18n/provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { Toaster } from "@/components/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ServiceWorkerRegistration />
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        <Toaster />
      </I18nProvider>
    </ThemeProvider>
  );
}
