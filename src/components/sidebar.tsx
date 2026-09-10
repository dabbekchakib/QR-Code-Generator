"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  PlusCircle,
  BarChart3,
  LayoutTemplate,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/qrs", label: "My QR Codes", icon: QrCode },
  { href: "/create", label: "Create QR", icon: PlusCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-border">
          <Logo size="md" />
        </div>

        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5 flex-shrink-0" />
                  {item.label}
                  {item.href === "/create" && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                      New
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 mt-auto">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/10">
              <p className="text-xs font-semibold text-primary">100% Free</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Free forever. No subscriptions. No ads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
