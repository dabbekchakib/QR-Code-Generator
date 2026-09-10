"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/toast-store";

export function ProfileForm() {
  const { profile, updateDisplayName } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { i18nKey } = await updateDisplayName(name.trim());
    setSaving(false);
    if (i18nKey) {
      showToast({ title: t(i18nKey), variant: "error" });
      return;
    }
    showToast({ title: t("profile.saved"), variant: "success" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="space-y-2">
        <label htmlFor="display-name" className="text-sm font-medium">
          {t("profile.displayNameLabel")}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("profile.displayNamePlaceholder")}
            className="flex-1"
          />
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}