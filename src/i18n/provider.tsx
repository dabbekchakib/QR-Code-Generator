"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  type Locale,
  defaultLocale,
  locales,
  localeNames,
  rtlLocales,
} from "./config";
import { getTranslation } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
  dir: "ltr" | "rtl";
  availableLocales: Locale[];
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("qr-manager-locale") as Locale | null;
      if (stored && locales.includes(stored)) return stored;
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("qr-manager-locale", newLocale);
    }
    document.documentElement.dir = rtlLocales.includes(newLocale) ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (path: string) => getTranslation(locale, path),
    [locale]
  );

  const dir = rtlLocales.includes(locale) ? "rtl" as const : "ltr" as const;

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dir,
      availableLocales: locales,
      localeNames,
    }),
    [locale, setLocale, t, dir]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
