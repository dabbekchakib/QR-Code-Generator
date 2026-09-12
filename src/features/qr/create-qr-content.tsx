"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { qrTypes } from "./qr-types-config";
import { QRForm } from "./components/qr-form";
import { QRPreview } from "./components/qr-preview";
import { QRDesigner } from "./components/design/qr-designer";
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
import { getDesignDefaults } from "./hooks/use-design-defaults";
import { urlSchema, wifiSchema, phoneSchema, emailSchema, whatsappSchema, vcardSchema, textSchema } from "./schemas";
import { cn } from "@/lib/utils";
import { RotateCcw, Settings2, QrCode, Shield, Save, Lock, Globe, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/lib/toast-store";
import { qrService } from "./service/qr-service";
import type { QRCodeRecord } from "./storage";
import { getDefaultName } from "./storage";
import { generateShortCode, isSafeDestination, getDynamicQRUrlWithFallback, DynamicQRError } from "./dynamic";
import { getTemplateById } from "@/features/templates/registry";
import { getPresetById, presetCustomization } from "@/features/templates/presets";
import { TemplateForm } from "@/features/templates/components/template-form";
import type { TemplateValues } from "@/features/templates/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const VALID_TYPES: QRType[] = ["website", "wifi", "phone", "email", "whatsapp", "vcard", "text"];

type SaveState = "idle" | "saving" | "saved" | "error";

export function CreateQRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { showToast } = useToast();

  const typeParam = searchParams.get("type") as QRType | null;
  const editParam = searchParams.get("edit");
  const isEditing = !!editParam;
  const templateParam = searchParams.get("template");
  const initialType = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : null;

  // Templates are a thin input layer: metadata + values drive the same engine
  // and the same save pipeline. Editing always wins over a template param so
  // templates can never overwrite an existing record. Unknown template ids fall
  // back to a normal QR (no error, per spec).
  const activeTemplate = useMemo(() => {
    if (isEditing || !templateParam) return null;
    return getTemplateById(templateParam);
  }, [templateParam, isEditing]);

  const [selectedType, setSelectedType] = useState<QRType | null>(initialType);
  const [values, setValues] = useState<AnyFormValues>(() =>
    selectedType ? getDefaultValues(selectedType) : getDefaultValues("website")
  );
  const [templateValues, setTemplateValues] = useState<TemplateValues>({});
  const [customization, setCustomization] = useState<QRCustomization>(() =>
    getDesignDefaults()
  );

  const [editedRecord, setEditedRecord] = useState<QRCodeRecord | null>(null);
  const loadedRef = useRef(false);

  const [shareMode, setShareMode] = useState<"static" | "dynamic">("static");
  const [destination, setDestination] = useState("");
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [draftShortCode] = useState(() => generateShortCode());
  const isDynamicMode = shareMode === "dynamic";

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [recordName, setRecordName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const handleModeSelect = useCallback((mode: "static" | "dynamic") => {
    if (activeTemplate) return;
    setShareMode(mode);
    setDestinationError(null);
    if (mode === "dynamic") {
      setSelectedType("website");
      setCustomization(getDesignDefaults());
    }
  }, [activeTemplate]);

  const handleTypeSelect = useCallback((type: QRType) => {
    setSelectedType(type);
    setValues(getDefaultValues(type));
    setCustomization(getDesignDefaults());
  }, []);

  const handleValuesChange = useCallback((newValues: AnyFormValues) => {
    setValues(newValues);
  }, []);

  const destinationValid = isDynamicMode && destination.trim() !== "" && isSafeDestination(destination);
  const permanentUrl = isDynamicMode ? getDynamicQRUrlWithFallback(draftShortCode) : "";

  const templateDestination = isDynamicMode
    ? String(templateValues[activeTemplate?.dynamicField ?? "url"] ?? "").trim()
    : "";
  const templateDestinationValid =
    isDynamicMode && activeTemplate !== null && isSafeDestination(templateDestination);

  const { templateErrors, templateContent } = useMemo(() => {
    if (!activeTemplate) return { templateErrors: {} as Record<string, string>, templateContent: "" };
    const result = activeTemplate.schema.safeParse(templateValues);
    if (!result.success) return { templateErrors: mapZodErrors(result.error), templateContent: "" };
    if (isDynamicMode) {
      if (!templateDestinationValid) return { templateErrors: {} as Record<string, string>, templateContent: "" };
      return { templateErrors: {} as Record<string, string>, templateContent: permanentUrl };
    }
    try {
      return {
        templateErrors: {} as Record<string, string>,
        templateContent: generateQRContent(activeTemplate.qrType, activeTemplate.toPayload(result.data)),
      };
    } catch {
      return { templateErrors: {} as Record<string, string>, templateContent: "" };
    }
  }, [activeTemplate, templateValues, isDynamicMode, templateDestinationValid, permanentUrl]);

  const { qrContent, errors } = useMemo(() => {
    if (activeTemplate) {
      return { qrContent: templateContent, errors: templateErrors };
    }
    if (isDynamicMode) {
      if (!destinationValid) return { qrContent: "", errors: {} as Record<string, string> };
      return { qrContent: permanentUrl, errors: {} as Record<string, string> };
    }
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
  }, [activeTemplate, templateContent, templateErrors, isDynamicMode, destinationValid, permanentUrl, selectedType, values]);

  const templateInitialCustomization = useMemo(
    () =>
      activeTemplate
        ? presetCustomization(getPresetById(activeTemplate.presetId), {
            size: DEFAULT_CUSTOMIZATION.size,
            margin: DEFAULT_CUSTOMIZATION.margin,
          })
        : null,
    [activeTemplate]
  );

  const handleReset = useCallback(() => {
    if (activeTemplate) {
      setTemplateValues({ ...activeTemplate.defaultValues });
    } else if (isDynamicMode) {
      setDestination("");
      setDestinationError(null);
    } else if (selectedType) {
      setValues(getDefaultValues(selectedType));
    }
    setCustomization(templateInitialCustomization ?? getDesignDefaults());
  }, [activeTemplate, templateInitialCustomization, isDynamicMode, selectedType]);

  useEffect(() => {
    if (!editParam || loadedRef.current) return;
    let cancelled = false;
    (async () => {
      const record = await qrService.get(editParam).catch(() => null);
      if (cancelled) return;
      if (record) {
        loadedRef.current = true;
        setEditedRecord(record);
        setShareMode(record.isDynamic ? "dynamic" : "static");
        setSelectedType(record.type);
        setValues(record.values as AnyFormValues);
        setCustomization(record.customization);
        setRecordName(record.name);
        if (record.isDynamic) {
          setDestination(record.destinationUrl ?? "");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editParam]);

  // Seed the create form from a template (defaults + default mode + its preset
  // design). Runs once per active template id.
  useEffect(() => {
    if (!activeTemplate || loadedRef.current) return;
    loadedRef.current = true;
    setSelectedType(activeTemplate.qrType);
    setShareMode(activeTemplate.defaultMode);
    setTemplateValues({ ...activeTemplate.defaultValues });
    setCustomization(
      presetCustomization(getPresetById(activeTemplate.presetId), {
        size: DEFAULT_CUSTOMIZATION.size,
        margin: DEFAULT_CUSTOMIZATION.margin,
      })
    );
  }, [activeTemplate]);

  const canSave = activeTemplate ? !!qrContent : isDynamicMode ? destinationValid : !!qrContent;

  const openSaveDialog = () => {
    let suggestedName: string | null = null;
    if (activeTemplate) {
      const explicit = String(templateValues.name ?? "").trim();
      suggestedName =
        explicit ||
        activeTemplate.computeName?.(templateValues) ||
        t(activeTemplate.nameKey);
    }
    setRecordName(
      editedRecord?.name ?? suggestedName ?? getDefaultName(selectedType ?? "website")
    );
    setNameError(null);
    setShowSaveDialog(true);
  };

  const handleSave = async () => {
    const name = recordName.trim();
    if (!name) {
      setNameError(t("create.nameRequired"));
      return;
    }
    if (isDynamicMode && !destinationValid && !templateDestinationValid) {
      setDestinationError(t("dynamicQr.errInvalidDestination"));
      setShowSaveDialog(false);
      return;
    }
    if (!selectedType && !activeTemplate) return;
    setSaveState("saving");
    setNameError(null);
    setDestinationError(null);
    try {
      if (editedRecord) {
        if (editedRecord.isDynamic) {
          const updated: QRCodeRecord = {
            ...editedRecord,
            name,
            values: { url: destination.trim() },
            destinationUrl: destination.trim(),
            customization,
            updatedAt: new Date().toISOString(),
          };
          await qrService.update(updated);
        } else {
          const updated: QRCodeRecord = {
            ...editedRecord,
            name,
            type: selectedType ?? editedRecord.type,
            values,
            customization,
            isDynamic: false,
            updatedAt: new Date().toISOString(),
          };
          await qrService.update(updated);
        }
        showToast({ title: t("create.saved"), variant: "success" });
        setSaveState("saved");
        setShowSaveDialog(false);
        router.push(`/qrs/${editedRecord.id}`);
      } else if (activeTemplate) {
        const parsed = activeTemplate.schema.safeParse(templateValues);
        if (!parsed.success) {
          setSaveState("error");
          return;
        }
        if (isDynamicMode) {
          const created = await qrService.createDynamic({
            name,
            destinationUrl: templateDestination,
            customization,
            preferredShortCode: draftShortCode,
            templateId: activeTemplate.id,
          });
          showToast({ title: t("create.saved"), variant: "success" });
          setSaveState("saved");
          setShowSaveDialog(false);
          router.push(`/qrs/${created.id}`);
        } else {
          const created = await qrService.create({
            name,
            type: activeTemplate.qrType,
            values: activeTemplate.toPayload(parsed.data),
            customization,
            isDynamic: false,
            templateId: activeTemplate.id,
          });
          showToast({ title: t("create.saved"), variant: "success" });
          setSaveState("saved");
          setShowSaveDialog(false);
          router.push(`/qrs/${created.id}`);
        }
      } else if (isDynamicMode) {
        const created = await qrService.createDynamic({
          name,
          destinationUrl: destination.trim(),
          customization,
          preferredShortCode: draftShortCode,
        });
        showToast({ title: t("create.saved"), variant: "success" });
        setSaveState("saved");
        setShowSaveDialog(false);
        router.push(`/qrs/${created.id}`);
      } else {
        const created = await qrService.create({
          name,
          type: selectedType ?? "website",
          values,
          customization,
          isDynamic: false,
        });
        showToast({ title: t("create.saved"), variant: "success" });
        setSaveState("saved");
        setShowSaveDialog(false);
        router.push(`/qrs/${created.id}`);
      }
    } catch (err) {
      if (err instanceof DynamicQRError) {
        setDestinationError(
          err.code === "INVALID_DESTINATION"
            ? t("dynamicQr.errInvalidDestination")
            : err.code === "SHORT_CODE_COLLISION"
              ? t("dynamicQr.errShortCodeCollision")
              : t("dynamicQr.errShortCodeGeneration")
        );
      }
      if (isDynamicMode) setShowSaveDialog(false);
      setSaveState("error");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? t("create.editTitle") : t("create.title")}
        </h1>

        {isEditing && editedRecord ? (
          <p className="text-sm text-muted-foreground mt-1">{editedRecord.name}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">{t("create.subtitle")}</p>
        )}
      </div>

      {/* Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            {isEditing ? t("create.selectType") : t("create.chooseType")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing && (
            <div className="mb-4">
              {!activeTemplate ? (
                <div className="inline-flex rounded-lg border border-border p-0.5" role="tablist" aria-label={t("create.shareType")}>
                  <button
                    role="tab"
                    aria-selected={!isDynamicMode}
                    onClick={() => handleModeSelect("static")}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      !isDynamicMode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t("create.staticOption")}
                  </button>
                  <button
                    role="tab"
                    aria-selected={isDynamicMode}
                    onClick={() => handleModeSelect("dynamic")}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      isDynamicMode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t("create.dynamicOption")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <activeTemplate.icon className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("create.usingTemplate")}</p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {t(activeTemplate.nameKey)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/templates" />}
                    nativeButton={false}
                  >
                    <LayoutTemplate className="size-3.5" />
                    {t("create.changeTemplate")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isDynamicMode && (
            <div className="mb-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              {!activeTemplate && (
                <div className="space-y-1.5">
                  <label htmlFor="dynamic-destination" className="text-sm font-medium">
                    {t("create.destinationLabel")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="dynamic-destination"
                    type="url"
                    inputMode="url"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setDestinationError(null);
                    }}
                    placeholder={t("create.destinationPlaceholder")}
                    aria-invalid={!!destinationError}
                    aria-describedby={destinationError ? "dynamic-destination-error" : undefined}
                  />
                  {destinationError && (
                    <p id="dynamic-destination-error" className="text-xs text-destructive" role="alert">
                      {destinationError}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-card border border-border p-3">
                <Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{t("create.permanentUrl")}</p>
                  <p className="text-xs text-muted-foreground break-all mt-0.5" dir="ltr">
                    {permanentUrl}
                  </p>
                </div>
              </div>

              {!activeTemplate && (
                <p className="text-xs text-muted-foreground">{t("create.permanentUrlDesc")}</p>
              )}
              <p className="text-xs text-muted-foreground">{t("create.dynamicBenefit")}</p>
              {activeTemplate && (
                <p className="text-xs text-muted-foreground">
                  {t("create.templateDestinationNote", {
                    field: t(
                      activeTemplate.fields.find(
                        (f) => f.key === activeTemplate.dynamicField
                      )?.labelKey ?? "templates.fields.url"
                    ),
                  })}
                </p>
              )}
            </div>
          )}

          {!isDynamicMode && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {qrTypes.map((type) => {
                const isSelected = selectedType === type.type;
                const isLocked = isEditing && !!editedRecord && type.type === editedRecord.type;
                return (
                  <button
                    key={type.type}
                    onClick={() => handleTypeSelect(type.type)}
                    disabled={isEditing && !!editedRecord}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/50",
                      isEditing && !!editedRecord && "opacity-60 cursor-not-allowed"
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
                      <p className="text-sm font-medium">
                        {t(`qrTypes.${type.type}.name`)}
                        {isLocked && <Lock className="inline size-3 ms-1 text-muted-foreground" />}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t(type.descKey)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {isEditing && editedRecord && (
            <p className="text-xs text-muted-foreground mt-3">{t("create.editNote")}</p>
          )}
        </CardContent>
      </Card>

      {/* Form + Preview */}
      {(selectedType || activeTemplate) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {!isDynamicMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    {t("create.configure")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTemplate ? (
                    <TemplateForm
                      template={activeTemplate}
                      values={templateValues}
                      onChange={setTemplateValues}
                      errors={errors}
                    />
                  ) : (
                    <QRForm
                      type={selectedType ?? "website"}
                      values={values}
                      onChange={handleValuesChange}
                      errors={errors}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="size-4" />
                  {t("create.customize")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRDesigner customization={customization} onChange={setCustomization} />
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
                    {t("create.preview")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QRPreview content={qrContent} customization={customization} />

                  {qrContent && (
                    <>
                      <Separator />

                      <QRDownloadButtons content={qrContent} type={selectedType ?? activeTemplate?.qrType ?? "website"} customization={customization} />

                      <div className="flex flex-wrap items-center gap-2">
                        <QRContentActions
                          type={selectedType ?? activeTemplate?.qrType ?? "website"}
                          content={qrContent}
                          customization={customization}
                        />
                        <Button variant="ghost" size="sm" onClick={handleReset} aria-label={t("create.resetForm")}>
                          <RotateCcw className="size-4" />
                          {t("create.resetForm")}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Save */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <Button
                    className="w-full"
                    onClick={openSaveDialog}
                    disabled={!canSave || saveState === "saving"}
                  >
                    {saveState === "saving" ? (
                      <>
                        {t("create.saving")}
                      </>
                    ) : saveState === "saved" ? (
                      <>
                        <QrCode className="size-4" />
                        {t("create.saved")}
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        {t("create.saveQr")}
                      </>
                    )}
                  </Button>
                  {saveState === "error" && (
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <p className="text-xs text-destructive">{t("create.saveError")}</p>
                      <Button variant="outline" size="xs" onClick={openSaveDialog}>
                        {t("create.retry")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Privacy note */}
              <div className="flex items-start gap-2 mt-3 px-1">
                <Shield className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t("create.privacyNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save name dialog */}
      <Dialog open={showSaveDialog} onOpenChange={(open) => !open && setShowSaveDialog(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("create.saveDialogTitle")}</DialogTitle>
            <DialogDescription>{t("create.saveDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="qr-save-name" className="text-sm font-medium">
              {t("create.nameLabel")} <span className="text-destructive">*</span>
            </label>
            <Input
              id="qr-save-name"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              placeholder={t("create.namePlaceholder")}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "qr-save-name-error" : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            {nameError && (
              <p id="qr-save-name-error" className="text-xs text-destructive" role="alert">
                {nameError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} nativeButton={false}>
              {t("detail.deleteDialog.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saveState === "saving"} nativeButton={false}>
              {saveState === "saving" ? t("create.saving") : t("create.saveQr")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}