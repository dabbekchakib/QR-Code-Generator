"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme-provider";
import { useI18n } from "@/i18n/provider";
import { locales, localeNames } from "@/i18n/config";
import { useQRs } from "@/features/qr/hooks/use-qrs";
import { qrService } from "@/features/qr/service/qr-service";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/lib/toast-store";
import { ProfileForm } from "./profile-form";
import { DesignDefaultsForm } from "./design-defaults";
import { Moon, Sun, Monitor, Globe, QrCode, Palette, Download, Upload, Trash2, HardDrive, User, Key, ShieldCheck, Brush } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function exportBackup(records: unknown[], filename: string) {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { status, user } = useAuth();
  const { records, refresh } = useQRs();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { buildBackupFile } = await import("@/features/qr/storage/backup");
      const backup = buildBackupFile(records);
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      exportBackup(
        [
          {
            app: backup.app,
            version: backup.version,
            exportedAt: backup.exportedAt,
            qrCodeVersion: backup.qrCodeVersion,
            qrCodes: backup.qrCodes,
          },
        ],
        `qr-manager-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`
      );
      showToast({ title: t("library.exported"), variant: "success" });
    } catch {
      showToast({ title: t("library.exportFailed"), variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const { parseBackupJson, qrRecordSchema } = await import("@/features/qr/storage/backup");
      const backup = parseBackupJson(text);
      let count = 0;
      for (const record of backup.qrCodes) {
        const parsed = qrRecordSchema.parse(record);
        await qrService.create({
          id: parsed.id,
          name: parsed.name,
          type: parsed.type,
          values: parsed.values,
          customization: parsed.customization,
          isDynamic: parsed.isDynamic,
          favorite: parsed.favorite,
          shortCode: parsed.shortCode ?? null,
          destinationUrl: parsed.destinationUrl ?? null,
          status: parsed.status ?? "active",
          templateId: parsed.templateId ?? null,
        });
        count++;
      }
      await refresh();
      showToast({
        title: t("library.imported"),
        description: `${count} QR Code${count > 1 ? "s" : ""}`,
        variant: "success",
      });
    } catch (err) {
      showToast({
        title: t("library.importFailed"),
        description: err instanceof Error ? err.message : "Invalid file",
        variant: "error",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await qrService.clearAll();
      await refresh();
      setClearOpen(false);
      showToast({ title: t("settings.localData.cleared"), variant: "success" });
    } catch {
      showToast({ title: t("settings.localData.clearFailed"), variant: "error" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("common.appName")} {t("common.tagline")}
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
              { value: "system" as const, label: t("settings.system"), icon: Monitor },
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

      {/* QR Design Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brush className="size-4 text-muted-foreground" />
            {t("settings.designDefaults.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.designDefaults.description")}
          </p>
          <DesignDefaultsForm />
        </CardContent>
      </Card>

      {/* Local Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" />
            {t("settings.localData.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.localData.description")} ({records.length} QR Code{records.length > 1 ? "s" : ""})
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || records.length === 0}
            >
              <Download className="size-4" />
              {exporting ? "..." : t("settings.localData.export")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="size-4" />
              {importing ? "..." : t("settings.localData.import")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setClearOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("settings.localData.clearAll")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      {status === "authenticated" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              {t("profile.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("profile.description")}</p>
            <ProfileForm />
            <Separator />
            <div>
              <p className="text-sm font-medium">{t("profile.emailLabel")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              {t("settings.account")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("settings.account")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.notConnected")}</p>
              </div>
              <Link href="/login" passHref legacyBehavior>
                <Button variant="outline" size="sm">{t("common.login")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="size-4 text-muted-foreground" />
            {t("privacy.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("privacy.description")}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("privacy.deleteAccountTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("privacy.deleteAccountDesc")}</p>
            </div>
            <Badge variant="secondary">{t("privacy.comingSoon")}</Badge>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Trash2 className="size-4" />
            {t("privacy.deleteAccountTitle")}
          </Button>
        </CardContent>
      </Card>

      {/* Analytics privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            {t("privacy.analyticsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("privacy.analyticsDesc")}</p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="size-4 text-muted-foreground" />
            {t("settings.about")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("settings.version")}</span>
            <Badge variant="secondary">0.1.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("settings.license")}</span>
            <span className="text-sm font-medium">{t("settings.freeBanner")}</span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/10 mt-2">
            <p className="text-xs font-semibold text-primary">{t("settings.freeBanner")}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{t("settings.freeBannerDesc")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Clear all confirm dialog */}
      <Dialog open={clearOpen} onOpenChange={(open) => !open && !clearing && setClearOpen(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("settings.localData.clearTitle")}</DialogTitle>
            <DialogDescription className="text-destructive">
              {t("settings.localData.clearWarning")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearOpen(false)} disabled={clearing} nativeButton={false}>
              {t("settings.localData.clearCancel")}
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={clearing} nativeButton={false}>
              {clearing ? "..." : t("settings.localData.clearConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}