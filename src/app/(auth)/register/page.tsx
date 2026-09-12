"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/i18n/provider";
import { registerSchema, type RegisterFormData } from "@/lib/auth/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    const { i18nKey, needsEmailConfirmation } = await signUp(
      data.email,
      data.password,
      data.displayName
    );
    if (i18nKey) {
      setServerError(t(i18nKey));
      return;
    }
    setNeedsConfirmation(needsEmailConfirmation);
  };

  if (needsConfirmation) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldCheck className="size-10 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("auth.registerTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth.emailConfirmationDesc")}</p>
        <Button variant="outline" className="w-full" onClick={() => setNeedsConfirmation(false)}>
          {t("auth.registerTitle")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.registerTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.registerSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("auth.registerTitle")}</CardTitle>
          <CardDescription className="sr-only">{t("auth.registerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                {t("auth.displayNameLabel")}
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  autoComplete="name"
                  placeholder={t("auth.displayNamePlaceholder")}
                  className="ps-10"
                  aria-invalid={!!errors.displayName}
                  {...register("displayName")}
                />
              </div>
              {errors.displayName ? (
                <p className="text-xs text-destructive">{t(errors.displayName.message ?? "")}</p>
              ) : null}
            </div>

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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t("auth.passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  className="ps-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive">{t(errors.password.message ?? "")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                {t("auth.confirmPasswordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  className="ps-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">{t(errors.confirmPassword.message ?? "")}</p>
              ) : null}
            </div>

            {serverError ? (
              <p role="alert" className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {serverError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t("auth.signIn")}
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          {t("auth.orContinueGuest")}
        </Link>
      </p>
    </div>
  );
}