import {
  Globe,
  Wifi,
  Phone,
  Mail,
  MessageCircle,
  Contact,
  FileText,
} from "lucide-react";
import type { QRType } from "@/types";

export interface QRTypeConfig {
  type: QRType;
  icon: React.ComponentType<{ className?: string }>;
  nameKey: string;
  descKey: string;
  color: string;
}

export const qrTypes: QRTypeConfig[] = [
  {
    type: "website",
    icon: Globe,
    nameKey: "qrTypes.website.name",
    descKey: "qrTypes.website.desc",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    type: "wifi",
    icon: Wifi,
    nameKey: "qrTypes.wifi.name",
    descKey: "qrTypes.wifi.desc",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    type: "phone",
    icon: Phone,
    nameKey: "qrTypes.phone.name",
    descKey: "qrTypes.phone.desc",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    type: "email",
    icon: Mail,
    nameKey: "qrTypes.email.name",
    descKey: "qrTypes.email.desc",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    type: "whatsapp",
    icon: MessageCircle,
    nameKey: "qrTypes.whatsapp.name",
    descKey: "qrTypes.whatsapp.desc",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    type: "vcard",
    icon: Contact,
    nameKey: "qrTypes.vcard.name",
    descKey: "qrTypes.vcard.desc",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    type: "text",
    icon: FileText,
    nameKey: "qrTypes.text.name",
    descKey: "qrTypes.text.desc",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];
