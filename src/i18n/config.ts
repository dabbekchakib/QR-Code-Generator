export type Locale = "fr" | "en" | "ar";

export const defaultLocale: Locale = "fr";

export const locales: Locale[] = ["fr", "en", "ar"];

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export const rtlLocales: Locale[] = ["ar"];
