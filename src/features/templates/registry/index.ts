import type { QRTemplate, TemplateCategory } from "../types";
import { templates as allTemplates } from "../data";

/** Central, declarative registry (Phase 7). Metadata + schema + mapping only —
 *  the QR engine stays the single source of generation. */
export const templateRegistry: readonly QRTemplate[] = allTemplates;

export function listTemplates(): QRTemplate[] {
  return [...allTemplates];
}

/** Resolve a `?template=` value. Unknown ids return null so the create flow
 *  can fall back to a normal QR (never an error). */
export function getTemplateById(
  id: string | null | undefined
): QRTemplate | null {
  if (!id) return null;
  return allTemplates.find((t) => t.id === id) ?? null;
}

export const TEMPLATE_CATEGORIES: Array<{
  id: TemplateCategory | "all";
  labelKey: string;
}> = [
  { id: "all", labelKey: "templates.categories.all" },
  { id: "business", labelKey: "templates.categories.business" },
  { id: "restaurant", labelKey: "templates.categories.restaurant" },
  { id: "contact", labelKey: "templates.categories.contact" },
  { id: "social", labelKey: "templates.categories.social" },
  { id: "events", labelKey: "templates.categories.events" },
  { id: "marketing", labelKey: "templates.categories.marketing" },
  { id: "other", labelKey: "templates.categories.other" },
];

export function getTemplateNameKey(id: string): string | null {
  const template = getTemplateById(id);
  return template ? template.nameKey : null;
}