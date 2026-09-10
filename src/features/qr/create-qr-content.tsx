"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { qrTypes } from "@/features/qr/qr-types-config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { QrCode } from "lucide-react";
import type { QRType } from "@/types";

export function CreateQRContent() {
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState<QRType | null>(null);
  const [label, setLabel] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("create.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("create.subtitle")}
        </p>
      </div>

      {/* Step 1: Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            {t("create.selectType")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {qrTypes.map((type) => {
              const isSelected = selectedType === type.type;
              return (
                <button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "size-11 rounded-xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : type.color
                    )}
                  >
                    <type.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t(type.nameKey)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t(type.descKey)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Configuration (shown when type is selected) */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                2
              </span>
              {t("create.configuration")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="qr-label" className="text-sm font-medium">
                {t("create.label")}
              </label>
              <Input
                id="qr-label"
                placeholder="e.g., My Website, Menu, WiFi..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("create.isDynamic")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("create.dynamicDesc")}
                </p>
              </div>
              <button
                onClick={() => setIsDynamic(!isDynamic)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isDynamic ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={isDynamic}
              >
                <span
                  className={cn(
                    "inline-block size-4 rounded-full bg-white transition-transform",
                    isDynamic ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Button className="flex-1" disabled={!label.trim()}>
                <QrCode className="size-4" />
                Generate QR Code
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              QR Code generation will be available in the next phase.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
