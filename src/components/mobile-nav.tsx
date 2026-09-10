"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, PlusCircle, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

const mobileNavItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Home },
  { href: "/qrs", labelKey: "nav.myQRCodes", icon: QrCode },
  { href: "/create", labelKey: "nav.createQR", icon: PlusCircle, isPrimary: true },
  { href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center -mt-5"
              >
                <div className="flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-shadow shadow-lg shadow-primary/25 transition-transform active:scale-95">
                  <item.icon className="size-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-colors min-w-[48px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}