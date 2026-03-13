"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/provider";
import {
  faqItems,
  categoryColors,
  type FaqCategory,
} from "./_components/faq-data";

const categories: FaqCategory[] = [
  "scoring",
  "orders",
  "integration",
  "account",
  "data",
];

const categoryBadgeVariant: Record<FaqCategory, "mint" | "rose" | "ocean" | "violet" | "amber"> = {
  scoring: "mint",
  orders: "rose",
  integration: "ocean",
  account: "violet",
  data: "amber",
};

export default function FaqPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDarija, setShowDarija] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return faqItems.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  const toggleDarija = (id: string) => {
    setShowDarija((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="h-6 w-6 text-mint" />
          <h1 className="font-display text-2xl font-bold text-midnight">
            {t("faq.title")}
          </h1>
        </div>
        <p className="text-sm text-fog">{t("faq.subtitle")}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("faq.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-silk bg-white text-sm text-midnight placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors ${
            activeCategory === null
              ? "bg-midnight text-white"
              : "bg-snow text-slate hover:bg-silk"
          }`}
        >
          {t("faq.allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setActiveCategory(activeCategory === cat ? null : cat)
            }
            className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? categoryColors[cat]
                : "bg-snow text-slate hover:bg-silk"
            }`}
          >
            {t(`faq.categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* FAQ list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-fog text-sm">
          {t("faq.noResults")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isOpen = openId === item.id;
            const isDarija = showDarija[item.id];

            return (
              <Card key={item.id} className="overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-snow/50 transition-colors"
                >
                  <Badge variant={categoryBadgeVariant[item.category]}>
                    {t(`faq.categories.${item.category}`)}
                  </Badge>
                  <span className="flex-1 text-sm font-medium text-midnight">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-mist shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-silk pt-3 space-y-3">
                    <p className="text-sm text-slate leading-relaxed">
                      {isDarija ? item.answerDarija : item.answer}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => toggleDarija(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-medium transition-colors ${
                          isDarija
                            ? "bg-amber-100 text-amber-700"
                            : "bg-snow text-fog hover:bg-silk"
                        }`}
                      >
                        🇲🇦 {t("faq.showDarija")}
                      </button>

                      {item.link && (
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-1 text-xs text-mint-deep hover:text-mint font-medium transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {item.linkLabel ?? t("faq.goToPage")}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {search && filtered.length > 0 && (
        <p className="text-xs text-mist text-center">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
