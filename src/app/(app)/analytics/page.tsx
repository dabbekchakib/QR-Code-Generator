import type { Metadata } from "next";
import { BarChart3, ScanLine, TrendingUp, Globe, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Track and analyze your QR Code scan statistics.",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and analyze your QR Code performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ScanLine className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Scans</p>
                <p className="text-xl font-bold">12,482</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-xl font-bold">2,588</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Calendar className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-xl font-bold">328</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Globe className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unique Scans</p>
                <p className="text-xl font-bold">8,241</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            Scan Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
            <div className="text-center">
              <BarChart3 className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Analytics charts will be available in the next phase.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
