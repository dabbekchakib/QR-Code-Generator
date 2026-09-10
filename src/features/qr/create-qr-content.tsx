"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { qrTypes } from "./qr-types-config";
import { QRForm } from "./components/qr-form";
import { QRPreview } from "./components/qr-preview";
import { QRCustomizer } from "./components/qr-customizer";
import { QRDownloadButtons } from "./components/qr-download-buttons";
import { QRContentActions } from "./components/qr-content-actions";
import { generateQRContent } from "./lib/qr-generator";
import type { QRType } from "@/types";
import {
  type QRCustomization,
  type AnyFormValues,
  DEFAULT_CUSTOMIZATION,
  getDefaultValues,
} from "./types";
import { urlSchema, wifiSchema, phoneSchema, emailSchema, whatsappSchema, vcardSchema, textSchema } from "./schemas";
import { cn } from "@/lib/utils";
import { RotateCcw, Settings2, QrCode, Shield } from "lucide-react";

function getSchema(type: QRType) {
  switch (type) {
    case "website": return urlSchema;
    case "wifi": return wifiSchema;
    case "phone": return phoneSchema;
    case "email": return emailSchema;
    case "whatsapp": return whatsappSchema;
    case "vcard": return vcardSchema;
    case "text": return textSchema;
  }
}

function mapZodErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (error && typeof error === "object" && "issues" in error) {
    for (const issue of (error as { issues: Array<{ path: (string|number)[]; message: string }> }).issues) {
      const key = issue.path.join(".");
      if (key) result[key] = issue.message;
    }
  }
  return result;
}

export function CreateQRContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as QRType | null;
  const validTypes: QRType[] = ["website", "wifi", "phone", "email", "whatsapp", "vcard", "text"];
  const initialType = typeParam && validTypes.includes(typeParam) ? typeParam : null;

  const [selectedType, setSelectedType] = useState<QRType | null>(initialType);
  const [values, setValues] = useState<AnyFormValues>(() =>
    selectedType ? getDefaultValues(selectedType) : getDefaultValues("website")
  );
  const [customization, setCustomization] = useState<QRCustomization>(DEFAULT_CUSTOMIZATION);

  const handleTypeSelect = useCallback((type: QRType) => {
    setSelectedType(type);
    setValues(getDefaultValues(type));
  }, []);

  const handleValuesChange = useCallback((newValues: AnyFormValues) => {
    setValues(newValues);
  }, []);

  const { qrContent, errors } = useMemo(() => {
    if (!selectedType) return { qrContent: "", errors: {} as Record<string, string> };
    const schema = getSchema(selectedType);
    const result = schema.safeParse(values);
    if (!result.success) {
      return { qrContent: "", errors: mapZodErrors(result.error) };
    }
    try {
      return { qrContent: generateQRContent(selectedType, values), errors: {} };
    } catch {
      return { qrContent: "", errors: {} };
    }
  }, [selectedType, values]);

  const handleReset = useCallback(() => {
    if (selectedType) {
      setValues(getDefaultValues(selectedType));
    }
    setCustomization(DEFAULT_CUSTOMIZATION);
  }, [selectedType]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create QR Code</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a type, fill in the details, and download your QR code instantly.
        </p>
      </div>

      {/* Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            Choose Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {qrTypes.map((type) => {
              const isSelected = selectedType === type.type;
              return (
                <button
                  key={type.type}
                  onClick={() => handleTypeSelect(type.type)}
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
                    <p className="text-sm font-medium">{type.type.charAt(0).toUpperCase() + type.type.slice(1)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {type.descKey}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form + Preview */}
      {selectedType && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Configure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRForm
                  type={selectedType}
                  values={values}
                  onChange={handleValuesChange}
                  errors={errors}
                />
              </CardContent>
            </Card>

            {/* Customizer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="size-4" />
                  Customize
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRCustomizer
                  customization={customization}
                  onChange={setCustomization}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="size-4" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QRPreview
                    content={qrContent}
                    customization={customization}
                  />

                  {qrContent && (
                    <>
                      <Separator />

                      <QRDownloadButtons
                        content={qrContent}
                        type={selectedType}
                        customization={customization}
                      />

                      <div className="flex items-center gap-2">
                        <QRContentActions
                          type={selectedType}
                          content={qrContent}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleReset}
                          aria-label="Reset form"
                        >
                          <RotateCcw className="size-4" />
                          Reset
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Privacy note */}
              <div className="flex items-start gap-2 mt-3 px-1">
                <Shield className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your data stays in your browser. Static QR codes are generated locally and are not uploaded to our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
