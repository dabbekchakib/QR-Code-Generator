"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/i18n/provider";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/auth/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, CircleCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const { forgotPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    const { i18nKey, sent: ok } = await forgotPassword(data.email);
    if (i18nKey) {
      setServerError(t(i18nKey));
      return;
    }
    setSent(ok);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.forgotPasswordTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.forgotPasswordSubtitle")}</p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <CircleCheck className="size-10 text-primary" />
          <p className="text-sm text-muted-foreground">{t("auth.sentReset")}</p>
          <Link href="/login" className="text-primary hover:underline text-sm font-medium">
            {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">{t("auth.forgotPasswordTitle")}</CardTitle>
            <CardDescription className="sr-only">{t("auth.forgotPasswordSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("auth.emailLabel")}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.emailPlaceholder")}
                    className="ps-10"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                </div>
                {errors.email ? (
                  <p className="text-xs text-destructive">{t(errors.email.message ?? "")}</p>
                ) : null}
              </div>

              {serverError ? (
                <p role="alert" className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
                  {serverError}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </div>
  );
}