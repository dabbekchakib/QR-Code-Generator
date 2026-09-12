import Link from "next/link";
import { Globe, Wifi, Phone, Mail, MessageCircle, Contact, FileText, Zap, BarChart3, WifiOff, ArrowRight, QrCode, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { HomeDynamicSections } from "./home-dynamic-sections";

const qrTypes = [
  { icon: Globe, name: "Website", desc: "Link to any website", color: "text-blue-500" },
  { icon: Wifi, name: "WiFi", desc: "Share your WiFi", color: "text-purple-500" },
  { icon: Phone, name: "Phone", desc: "Clickable phone number", color: "text-green-500" },
  { icon: Mail, name: "Email", desc: "Pre-filled email", color: "text-amber-500" },
  { icon: MessageCircle, name: "WhatsApp", desc: "Direct WhatsApp link", color: "text-emerald-500" },
  { icon: Contact, name: "vCard", desc: "Contact card", color: "text-cyan-500" },
  { icon: FileText, name: "Text", desc: "Text message", color: "text-rose-500" },
];

const features = [
  {
    icon: QrCode,
    title: "Static QR Codes",
    desc: "Create permanent QR codes for your links, contacts and information.",
  },
  {
    icon: Zap,
    title: "Dynamic QR Codes",
    desc: "Change your QR code content without creating new ones.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Track scans and understand your QR code usage.",
  },
  {
    icon: WifiOff,
    title: "PWA / Offline",
    desc: "Use the app even without an internet connection.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
              Login
            </Button>
            <Button size="sm" render={<Link href="/create" />} nativeButton={false}>
              <PlusCircle className="size-4" />
              Create QR
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center relative">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs">
            100% Free &bull; No subscriptions &bull; No ads
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            QR Manager
          </h1>

          <p className="text-xl sm:text-2xl text-primary font-semibold mb-6">
            Create. Customize. Share.
          </p>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Create, customize and manage QR Codes from one simple, free application.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto" render={<Link href="/create" />} nativeButton={false}>
              <QrCode className="size-5" />
              Create QR
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" render={<Link href="/qrs" />} nativeButton={false}>
              My QR Codes
            </Button>
          </div>
        </div>
      </section>

      {/* QR Types */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              QR Code Types
            </h2>
            <p className="text-muted-foreground">
              Create different types of QR Codes for your needs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {qrTypes.map((type) => (
              <Card
                key={type.name}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className={`size-12 rounded-xl bg-muted flex items-center justify-center ${type.color} transition-colors group-hover:bg-primary/10`}>
                    <type.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{type.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 border-dashed">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <PlusCircle className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">More Soon</h3>
                  <p className="text-xs text-muted-foreground mt-1">Coming in next phases</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground">
              QR Manager combines power and simplicity
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-all hover:shadow-md">
                <CardContent className="p-6 flex gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <feature.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Templates + Recent QR Codes (client-side lazy) */}
      <HomeDynamicSections />

      {/* CTA */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Start Creating QR Codes
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Free forever. No subscriptions. No ads. No limits.
          </p>
          <Button size="lg" render={<Link href="/create" />} nativeButton={false}>
            <QrCode className="size-5" />
            Create Your First QR
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" showText={false} />
          <p className="text-sm text-muted-foreground">
            100% Free &bull; No subscriptions &bull; No ads
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
