"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  t: (path: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  availableLocales: Locale[];
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_COOKIE = "qr-manager-locale";
const LOCALE_STORAGE_KEY = "qr-manager-locale";

function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — cookie still keeps SSR in sync */
  }
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=Lax`;
  } catch {
    /* ignore */
  }
}

function applyLocaleToDocument(locale: Locale): void {
  document.documentElement.dir = rtlLocales.includes(locale) ? "rtl" : "ltr";
  document.documentElement.lang = locale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (stored && locales.includes(stored)) return stored;
    }
    return defaultLocale;
  });

  // Keep lang/dir and the cookie in sync with the active locale (including the
  // very first mount, which SSR cannot know about on the client).
  useEffect(() => {
    applyLocaleToDocument(locale);
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    applyLocaleToDocument(newLocale);
    persistLocale(newLocale);
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      const value = getTranslation(locale, path);
      if (!params) return value;
      return value.replace(/\{(\w+)\}/g, (match, key) =>
        key in params ? String(params[key]) : match
      );
    },
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
