"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { I18nProvider } from "@/i18n/provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { Toaster } from "@/components/toaster";

/**
 * Root providers: theme, i18n, PWA registration and the toaster. Auth and the
 * sync machinery live in the (app) / (auth) layouts instead, so marketing
 * routes (home, offline, errors) never initialize the Supabase client or fire
 * a session request — keeping the homepage fast for everyone.
 */
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