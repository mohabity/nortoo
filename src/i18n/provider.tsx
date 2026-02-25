"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type Locale, LOCALES, DEFAULT_LOCALE, RTL_LOCALES } from "./types";
import frDict from "./locales/fr.json";
import enDict from "./locales/en.json";
import arDict from "./locales/ar.json";

// ── Dictionaries ──

const dictionaries: Record<Locale, Record<string, unknown>> = {
  fr: frDict,
  en: enDict,
  ar: arDict,
};

// ── Context ──

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// ── Cookie helpers ──

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// ── Deep lookup ──

function deepGet(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === "string" ? current : undefined;
}

// ── Direction helper ──

function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

function applyLocaleToDocument(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
}

// ── Provider ──

const COOKIE_NAME = "nortoo_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [dict, setDict] = useState<Record<string, unknown>>(dictionaries[DEFAULT_LOCALE]);

  // Initialize from cookie or browser language
  useEffect(() => {
    const cookieLocale = getCookie(COOKIE_NAME) as Locale | null;
    let initialLocale: Locale = DEFAULT_LOCALE;

    if (cookieLocale && LOCALES.includes(cookieLocale)) {
      initialLocale = cookieLocale;
    } else if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || "";
      if (browserLang.startsWith("ar")) {
        initialLocale = "ar";
      } else if (browserLang.startsWith("en")) {
        initialLocale = "en";
      } else {
        initialLocale = "fr";
      }
      setCookie(COOKIE_NAME, initialLocale, 365);
    }

    setLocaleState(initialLocale);
    setDict(dictionaries[initialLocale]);
    applyLocaleToDocument(initialLocale);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setDict(dictionaries[newLocale]);
    setCookie(COOKIE_NAME, newLocale, 365);
    applyLocaleToDocument(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = deepGet(dict, key);

      if (value === undefined) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Missing key: "${key}" for locale: "${locale}"`);
        }
        return key;
      }

      // Interpolation: "Il reste {count} jours" + {count: 3}
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, k) => {
          const v = params[k];
          return v !== undefined ? String(v) : `{${k}}`;
        });
      }

      return value;
    },
    [dict, locale]
  );

  const isRtl = isRtlLocale(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Hook ──

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}
