import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <QrCode className="size-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground mt-2">Page not found</p>
        </div>
        <Button render={<Link href="/" />} nativeButton={false}>Back to Home</Button>
      </div>
    </div>
  );
}
