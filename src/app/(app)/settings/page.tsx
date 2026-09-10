"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme-provider";
import { useI18n } from "@/i18n/provider";
import { locales, localeNames } from "@/i18n/config";
import { Moon, Sun, Monitor, Globe, QrCode, Shield, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences and application settings.
        </p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            {t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {locales.map((loc) => (
              <Button
                key={loc}
                variant={locale === loc ? "default" : "outline"}
                size="sm"
                onClick={() => setLocale(loc)}
              >
                {localeNames[loc]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" />
            {t("settings.theme")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light" as const, label: t("settings.lightMode"), icon: Sun },
              { value: "dark" as const, label: t("settings.darkMode"), icon: Moon },
              { value: "system" as const, label: "System", icon: Monitor },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  theme === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <option.icon className="size-5 text-foreground" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">Not connected</p>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-xs text-muted-foreground">Coming in next phase</p>
            </div>
            <Badge variant="secondary">Soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="size-4 text-muted-foreground" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <Badge variant="secondary">0.1.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">License</span>
            <span className="text-sm font-medium">Free Forever</span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/10 mt-2">
            <p className="text-xs font-semibold text-primary">100% Free</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Free forever. No subscriptions. No ads.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
