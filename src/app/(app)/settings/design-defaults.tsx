"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import type { ErrorCorrectionLevel, ResolvedCustomization } from "@/features/qr/types";
import { DEFAULT_CUSTOMIZATION, normalizeCustomization } from "@/features/qr/types";
import { useDesignDefaults } from "@/features/qr/hooks/use-design-defaults";
import { QRColorPicker } from "@/features/qr/components/design/qr-color-picker";
import { QRStyleSelector } from "@/features/qr/components/design/qr-style-selector";
import { QRFrameSelector } from "@/features/qr/components/design/qr-frame-selector";
import { ChipButton } from "@/features/qr/components/design/ui";

/** Design defaults for new QR codes, stored locally only. Logos are excluded
 *  on purpose: a logo is a per-QR decision and would bloat localStorage. */
export function DesignDefaultsForm() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [defaults, setDefaults] = useDesignDefaults();
  const [draft, setDraft] = useState<ResolvedCustomization>(() =>
    normalizeCustomization(defaults)
  );
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof ResolvedCustomization>(
    key: K,
    value: ResolvedCustomization[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = () => {
    setDefaults({ ...draft, logo: null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    showToast({ title: t("settings.designDefaults.saved"), variant: "success" });
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_CUSTOMIZATION, logo: null });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <QRColorPicker
          label={t("design.foreground")}
          value={draft.foreground}
          onChange={(v) => update("foreground", v)}
        />
        <QRColorPicker
          label={t("design.background")}
          value={draft.background}
          onChange={(v) => update("background", v)}
        />
      </div>

      <QRStyleSelector
        label={t("design.style")}
        value={draft.style}
        onChange={(v) => update("style", v)}
      />
      <QRStyleSelector
        label={t("design.eyeStyle")}
        value={draft.eyeStyle}
        onChange={(v) => update("eyeStyle", v)}
      />

      <QRFrameSelector
        value={draft.frame ?? "none"}
        frameText={draft.frameText ?? ""}
        onFrameChange={(v) => update("frame", v)}
        onFrameTextChange={(v) => update("frameText", v)}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium">{t("design.errorCorrection")}</span>
        <div className="flex flex-wrap gap-2">
          {(["L", "M", "Q", "H"] as ErrorCorrectionLevel[]).map((level) => (
            <ChipButton
              key={level}
              active={draft.errorCorrection === level}
              onClick={() => update("errorCorrection", level)}
            >
              {level}
            </ChipButton>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleSave} nativeButton={false}>
          {saved ? (
            <>
              <Check className="size-4" />
              {t("settings.designDefaults.saved")}
            </>
          ) : (
            t("settings.designDefaults.save")
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset} nativeButton={false}>
          {t("settings.designDefaults.reset")}
        </Button>
      </div>
    </div>
  );
}