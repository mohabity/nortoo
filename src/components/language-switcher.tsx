"use client";

import { useTranslation } from "@/i18n/provider";
import { type Locale } from "@/i18n/types";
import { cn } from "@/lib/utils";

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "عر" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 rounded-sm border border-silk bg-snow p-0.5">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-xs transition-colors",
            locale === code
              ? "bg-white text-midnight shadow-sm"
              : "text-fog hover:text-slate"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
