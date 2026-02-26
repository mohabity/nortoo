"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type Locale, LOCALES, DEFAULT_LOCALE } from "./types";
import frDict from "./locales/fr.json";
import enDict from "./locales/en.json";

// ── Dictionaries ──

const dictionaries: Record<Locale, Record<string, unknown>> = {
  fr: frDict,
  en: enDict,
};

// ── Context ──

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// ── Cookie helpers ──

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  // Robust cookie reading: prepend "; " so every cookie is prefixed with "; "
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length >= 2) {
    return parts.pop()!.split(";").shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("nortoo.ma")
      ? "; domain=.nortoo.ma"
      : "";
  document.cookie = `${name}=${value}; expires=${expires}; path=/${domain}; SameSite=Lax`;
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

// ── Provider ──

const COOKIE_NAME = "nortoo_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [dict, setDict] = useState<Record<string, unknown>>(dictionaries[DEFAULT_LOCALE]);

  // Initialize: URL param ?lang= > cookie > browser language > default
  useEffect(() => {
    const urlLang = new URLSearchParams(window.location.search).get("lang") as Locale | null;
    const cookieLocale = getCookie(COOKIE_NAME) as Locale | null;
    let initialLocale: Locale = DEFAULT_LOCALE;
    let shouldPersist = false;

    if (urlLang && LOCALES.includes(urlLang)) {
      // Explicit URL param — always persist
      initialLocale = urlLang;
      shouldPersist = true;
    } else if (cookieLocale && LOCALES.includes(cookieLocale)) {
      // Cookie exists — use it, don't overwrite
      initialLocale = cookieLocale;
    } else if (typeof navigator !== "undefined") {
      // No cookie, no URL param — detect from browser language
      const browserLang = navigator.language || "";
      if (browserLang.startsWith("en")) {
        initialLocale = "en";
      } else {
        initialLocale = "fr";
      }
      shouldPersist = true;
    }

    // Only write cookie when explicitly needed (URL param or first visit)
    // Never overwrite an existing cookie with browser detection
    if (shouldPersist) {
      setCookie(COOKIE_NAME, initialLocale, 365);
    }

    setLocaleState(initialLocale);
    setDict(dictionaries[initialLocale]);
    document.documentElement.lang = initialLocale;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setDict(dictionaries[newLocale]);
    setCookie(COOKIE_NAME, newLocale, 365);
    document.documentElement.lang = newLocale;
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

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
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
