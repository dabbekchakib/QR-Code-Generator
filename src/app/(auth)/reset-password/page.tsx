"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/i18n/provider";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/auth/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, CircleX } from "lucide-react";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const { status, resetPassword } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // The recovery link establishes a session; status becomes "authenticated"
  // once Supabase exchanges the code. Until then show a loading state.
  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <span className="text-sm text-muted-foreground">…</span>
      </div>
    );
  }

  if (status === "anonymous" || done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CircleX className="size-10 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">{t("auth.resetPasswordTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {done ? t("auth.passwordUpdated") : t("auth.invalidLinkDesc")}
        </p>
        <Link href="/forgot-password" className="text-primary hover:underline text-sm font-medium">
          {t("auth.requestNewLink")}
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    const { i18nKey } = await resetPassword(data.password);
    if (i18nKey) {
      setServerError(t(i18nKey));
      return;
    }
    setDone(true);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.resetPasswordTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.resetPasswordSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("auth.resetPasswordTitle")}</CardTitle>
          <CardDescription className="sr-only">{t("auth.resetPasswordSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {isSubmitting ? t("auth.updatingPassword") : t("auth.updatePassword")}
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          {t("auth.orContinueGuest")}
        </Link>
      </p>
    </div>
  );
}