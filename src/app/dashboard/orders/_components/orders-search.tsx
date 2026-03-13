"use client";

import { Search, X, User, MapPin, Package } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import {
  getRecentSearches,
  removeRecentSearch,
  type RecentSearch,
} from "@/hooks/use-orders-page";
import type { SearchSuggestion } from "@/types/orders";

const SUGGESTION_ICONS = {
  client: User,
  city: MapPin,
  product: Package,
} as const;

// ── Desktop search with dropdown ──

interface OrdersSearchProps {
  searchInput: string;
  searchFocused: boolean;
  suggestions: SearchSuggestion[];
  recentSearches: RecentSearch[];
  showDropdown: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onSearchInputChange: (value: string) => void;
  onSearchFocus: () => void;
  onClearSearch: () => void;
  onApplySearch: (value: string) => void;
  onSetSearchFocused: (focused: boolean) => void;
  onSetRecentSearches: (searches: RecentSearch[]) => void;
}

export function OrdersSearch({
  searchInput,
  suggestions,
  recentSearches,
  showDropdown,
  searchInputRef,
  dropdownRef,
  onSearchInputChange,
  onSearchFocus,
  onClearSearch,
  onApplySearch,
  onSetRecentSearches,
}: OrdersSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="relative hidden lg:block" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={t("orders.search.placeholder")}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onFocus={onSearchFocus}
          className="h-9 w-[320px] rounded-full border border-silk bg-white pl-8 pr-8 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
        />
        {searchInput ? (
          <button
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist hover:text-slate"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-mist bg-snow border border-silk rounded px-1 py-0.5">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Search dropdown: suggestions + recent */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-silk bg-white shadow-lg z-50 overflow-hidden">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-1">
              {suggestions.map((s, i) => {
                const Icon = SUGGESTION_ICONS[s.type];
                return (
                  <button
                    key={`${s.type}-${i}`}
                    onClick={() => onApplySearch(s.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate hover:bg-snow transition-colors text-left"
                  >
                    <Icon className="h-3.5 w-3.5 text-mist shrink-0" />
                    <span className="truncate">{s.value}</span>
                    <span className="ml-auto text-xs text-mist shrink-0">
                      {s.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent searches */}
          {searchInput === "" && recentSearches.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-medium text-mist uppercase tracking-wider">
                {t("orders.search.recent")}
              </p>
              {recentSearches.map((r) => (
                <div
                  key={r.query}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-snow transition-colors group"
                >
                  <button
                    onClick={() => onApplySearch(r.query)}
                    className="flex-1 text-left text-sm text-slate truncate"
                  >
                    {r.query}
                  </button>
                  <span className="text-xs text-mist">
                    {r.resultCount}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(r.query);
                      onSetRecentSearches(getRecentSearches());
                    }}
                    className="opacity-0 group-hover:opacity-100 text-mist hover:text-slate transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mobile search bar ──

interface MobileSearchBarProps {
  open: boolean;
  searchInput: string;
  mobileSearchRef: React.RefObject<HTMLInputElement | null>;
  onSearchInputChange: (value: string) => void;
  onClearSearch: () => void;
  onClose: () => void;
}

export function MobileSearchBar({
  open,
  searchInput,
  mobileSearchRef,
  onSearchInputChange,
  onClearSearch,
  onClose,
}: MobileSearchBarProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="lg:hidden flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
        <input
          ref={mobileSearchRef}
          type="text"
          placeholder={t("orders.search.placeholder")}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          className="h-10 w-full rounded-full border border-silk bg-white pl-9 pr-9 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
        />
        {searchInput && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-slate"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-sm text-ocean font-medium shrink-0"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}
