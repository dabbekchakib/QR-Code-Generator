"use client";

import { Card, CardContent } from "@/components/ui/card";

export function QRSkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-square bg-muted/50 flex items-center justify-center">
          <div className="w-24 h-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-8 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QRGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <QRSkeletonCard key={i} />
      ))}
    </div>
  );
}