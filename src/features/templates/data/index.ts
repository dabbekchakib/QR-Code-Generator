import type { QRTemplate } from "../types";
import { websiteTemplate } from "./website";
import { restaurantMenuTemplate } from "./restaurant-menu";
import { whatsappTemplate } from "./whatsapp";
import { businessCardTemplate } from "./business-card";
import { contactTemplate } from "./contact";
import { wifiTemplate } from "./wifi";
import { locationTemplate } from "./location";
import { eventTemplate } from "./event";
import { socialProfileTemplate } from "./social-profile";
import { googleReviewTemplate } from "./google-review";

/** All templates. Order matters: it drives the gallery grid. */
export const templates: readonly QRTemplate[] = [
  websiteTemplate,
  restaurantMenuTemplate,
  whatsappTemplate,
  businessCardTemplate,
  contactTemplate,
  wifiTemplate,
  locationTemplate,
  eventTemplate,
  socialProfileTemplate,
  googleReviewTemplate,
];

export const POPULAR_TEMPLATE_IDS: readonly string[] = [
  "restaurant-menu",
  "whatsapp",
  "business-card",
  "website",
  "google-review",
  "location",
];

export const QUICK_CREATE_TEMPLATE_IDS: readonly string[] = [
  "website",
  "whatsapp",
  "restaurant-menu",
  "business-card",
];