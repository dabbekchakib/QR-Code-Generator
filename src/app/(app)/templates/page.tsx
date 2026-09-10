import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Templates",
  description: "Pre-built QR Code templates for quick creation.",
};

const templates = [
  { id: "1", name: "Restaurant Menu", type: "website", desc: "Share your digital menu" },
  { id: "2", name: "WiFi Access", type: "wifi", desc: "Let guests connect to WiFi" },
  { id: "3", name: "Business Card", type: "vcard", desc: "Share your contact info" },
  { id: "4", name: "Event RSVP", type: "website", desc: "Link to your event page" },
  { id: "5", name: "Product Review", type: "website", desc: "Collect customer reviews" },
  { id: "6", name: "Social Follow", type: "whatsapp", desc: "Grow your audience" },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pre-built templates for quick QR Code creation.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <LayoutTemplate className="size-5" />
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {template.type}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{template.desc}</p>
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
            More templates will be available in future phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
