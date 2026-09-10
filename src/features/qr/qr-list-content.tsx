"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search, PlusCircle, Globe, Wifi, MessageCircle, Contact } from "lucide-react";
import Link from "next/link";

const mockQRCodes = [
  { id: "1", label: "My Website", type: "website", scans: 4821, isDynamic: true, icon: Globe, color: "text-blue-500" },
  { id: "2", label: "Restaurant Menu", type: "website", scans: 3120, isDynamic: false, icon: Globe, color: "text-blue-500" },
  { id: "3", label: "WhatsApp Support", type: "whatsapp", scans: 2841, isDynamic: true, icon: MessageCircle, color: "text-emerald-500" },
  { id: "4", label: "Office WiFi", type: "wifi", scans: 1200, isDynamic: false, icon: Wifi, color: "text-purple-500" },
  { id: "5", label: "Contact Card", type: "vcard", scans: 1700, isDynamic: true, icon: Contact, color: "text-cyan-500" },
];

export function QRListContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My QR Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your QR Codes in one place.
          </p>
        </div>
        <Button render={<Link href="/create" />} nativeButton={false}>
          <PlusCircle className="size-4" />
          Create QR
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search QR codes..." className="pl-10" />
      </div>

      <div className="space-y-3">
        {mockQRCodes.map((qr) => (
          <Card key={qr.id} className="transition-all hover:shadow-sm hover:border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`size-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 ${qr.color}`}>
                <qr.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{qr.label}</p>
                  {qr.isDynamic && (
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      Dynamic
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {qr.scans.toLocaleString()} scans
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <QrCode className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <PlusCircle className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            More QR codes will appear here once created.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/create" />} nativeButton={false}>
            <PlusCircle className="size-4" />
            Create your first QR
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
