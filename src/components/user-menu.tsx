"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/i18n/provider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, LogIn, QrCode } from "lucide-react";

function initials(name: string | null | undefined): string {
  const value = name?.trim() || "";
  if (!value) return "?";
  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function UserMenu() {
  const { status, user, profile, signOut } = useAuth();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Loading profile">
        <Avatar size="sm">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  const displayName = profile?.display_name ?? user?.email ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const isAuthed = status === "authenticated";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="rounded-full">
            <span className="sr-only">{t("userMenu.avatar")}</span>
          </Button>
        }
      >
        <Avatar size="sm">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{initials(displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        {isAuthed ? (
          <>
            <DropdownMenuLabel>
              <span className="block text-sm text-foreground">{displayName}</span>
              <span className="block text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="size-4" />
              {t("settings.title")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              {t("userMenu.signOut")}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem render={<Link href="/login" />}>
              <LogIn className="size-4" />
              {t("common.login")}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/register" />}>
              <QrCode className="size-4" />
              {t("common.register")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}