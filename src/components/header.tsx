"use client";

import { useSidebarStore } from "@/hooks";
import { Logo } from "@/components/logo";
import { OnlineIndicator } from "@/components/online-indicator";
import { SyncStatus } from "@/components/sync-status";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";
import { useI18n } from "@/i18n/provider";

export function Header() {
  const { isOpen, toggle, close } = useSidebarStore();
  const { t } = useI18n();

  return (
    <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={isOpen ? t("common.closeMenu") : t("common.openMenu")}
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
        <Logo size="sm" showText={false} />
      </div>
      <div className="flex items-center gap-2">
        <SyncStatus />
        <OnlineIndicator />
        <UserMenu />
      </div>

      <Sheet open={isOpen} onOpenChange={close}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">{t("common.navigation")}</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </header>
  );
}
