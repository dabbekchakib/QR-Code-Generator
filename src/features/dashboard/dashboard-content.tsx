"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, getScanStats } from "@/services/mock-data";
import {
  QrCode,
  ScanLine,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";

export function DashboardContent() {
  const stats = getDashboardStats();
  const scanStats = getScanStats();

  const statCards = [
    {
      title: "Total QR Codes",
      value: stats.totalQRCodes.toLocaleString(),
      icon: QrCode,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Scans",
      value: stats.totalScans.toLocaleString(),
      icon: ScanLine,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Today",
      value: stats.todayScans.toLocaleString(),
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      change: "+12%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back. Here&apos;s an overview of your QR Codes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <Badge variant="secondary" className="mt-2 text-xs gap-1">
                      <ArrowUpRight className="size-3" />
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div
                  className={`size-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scans Overview Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              Scans Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2 px-2">
              {scanStats.dailyScans.map((day) => {
                const maxScans = Math.max(
                  ...scanStats.dailyScans.map((d) => d.scans)
                );
                const height = (day.scans / maxScans) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full relative group">
                      <div
                        className="w-full rounded-t-md bg-primary/20 transition-all group-hover:bg-primary/30"
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute bottom-0 left-0 right-0 rounded-t-md bg-primary/80 transition-all group-hover:bg-primary"
                          style={{ height: "100%" }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanStats.topQR.map((qr, index) => (
                <div key={qr.id} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {qr.label}
                    </p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(qr.scans / scanStats.topQR[0].scans) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {qr.scans.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
