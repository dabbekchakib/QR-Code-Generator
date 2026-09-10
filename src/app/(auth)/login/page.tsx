"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/i18n/provider";
import { loginSchema, type LoginFormData } from "@/lib/auth/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const { i18nKey } = await signIn(data.email, data.password);
    if (i18nKey) {
      setServerError(t(i18nKey));
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.loginSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("auth.loginTitle")}</CardTitle>
          <CardDescription className="sr-only">{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder")}
                  className="pl-10"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email ? (
                <p className="text-xs text-destructive">{t(errors.email.message ?? "")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  {t("auth.passwordLabel")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  className="pl-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive">{t(errors.password.message ?? "")}</p>
              ) : null}
            </div>

            {serverError ? (
              <p role="alert" className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {serverError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          {t("auth.createAccount")}
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