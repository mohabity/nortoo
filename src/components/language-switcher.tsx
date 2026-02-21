"use client";

import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 rounded-sm border border-silk bg-snow p-0.5">
      <button
        onClick={() => setLocale("fr")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-xs transition-colors",
          locale === "fr"
            ? "bg-white text-midnight shadow-sm"
            : "text-fog hover:text-slate"
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-xs transition-colors",
          locale === "en"
            ? "bg-white text-midnight shadow-sm"
            : "text-fog hover:text-slate"
        )}
      >
        EN
      </button>
    </div>
  );
}
