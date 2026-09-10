"use client";

import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Header } from "@/components/header";
import { OnlineIndicator } from "@/components/online-indicator";
import { SyncStatus } from "@/components/sync-status";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="hidden lg:flex items-center justify-end gap-3 h-14 px-6 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-30">
          <SyncStatus />
          <OnlineIndicator />
          <UserMenu />
        </div>
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
