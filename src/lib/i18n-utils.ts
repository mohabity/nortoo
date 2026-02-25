import frDict from "@/i18n/locales/fr.json";
import enDict from "@/i18n/locales/en.json";
import arDict from "@/i18n/locales/ar.json";
import type { Locale } from "@/i18n/types";

// ── Dictionaries ──

const dicts: Record<Locale, Record<string, unknown>> = { fr: frDict, en: enDict, ar: arDict };

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

/**
 * Get a translation without React context.
 * For use in non-component code (utils, constants, etc.)
 */
export function getTranslation(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const value = deepGet(dicts[locale], key);
  if (value === undefined) return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => {
      const v = params[k];
      return v !== undefined ? String(v) : `{${k}}`;
    });
  }

  return value;
}

// ── Currency ──

/**
 * Format amount in Moroccan Dirhams with locale-aware formatting.
 * FR: "1 234 DH"  |  EN: "1,234 MAD"
 */
export function formatCurrency(amount: number, locale: Locale = "fr"): string {
  const rounded = Math.round(amount);
  if (locale === "en") {
    return new Intl.NumberFormat("en-US").format(rounded) + " MAD";
  }
  if (locale === "ar") {
    return new Intl.NumberFormat("ar-MA").format(rounded) + " د.م";
  }
  return new Intl.NumberFormat("fr-MA").format(rounded) + " DH";
}

// ── Dates ──

const DATE_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-US", ar: "ar-MA" };

/**
 * Format a date with locale-aware options.
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(DATE_LOCALES[locale], options);
}

/**
 * Format date + time.
 */
export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(DATE_LOCALES[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(DATE_LOCALES[locale]).format(value);
}

/**
 * Get the Intl locale string for a given app Locale.
 */
export function getIntlLocale(locale: Locale): string {
  return DATE_LOCALES[locale];
}
