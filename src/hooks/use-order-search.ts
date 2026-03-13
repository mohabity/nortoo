"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SearchSuggestion } from "@/types/orders";

interface RecentSearch {
  query: string;
  resultCount: number;
}

const RECENT_SEARCHES_KEY = "nortoo-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string, resultCount: number) {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((r) => r.query !== query);
  recent.unshift({ query, resultCount });
  sessionStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

function removeRecentSearchEntry(query: string) {
  const recent = getRecentSearches().filter((r) => r.query !== query);
  sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

interface UseOrderSearchOptions {
  onSearchChange: (value: string) => void;
}

export function useOrderSearch({ onSearchChange }: UseOrderSearchOptions) {
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/orders/search-suggest?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSuggestions(json.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function handleInputChange(value: string) {
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 400);

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (value.trim().length >= 2) {
      suggestDebounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
    }
  }

  function clearSearch() {
    setSearchInput("");
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange("");
  }

  function applySearch(value: string) {
    setSearchInput(value);
    setSuggestions([]);
    setSearchFocused(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange(value);
  }

  function handleFocus() {
    setSearchFocused(true);
    setRecentSearches(getRecentSearches());
  }

  function removeRecentSearch(query: string) {
    removeRecentSearchEntry(query);
    setRecentSearches(getRecentSearches());
  }

  /** Call after a successful fetch to record the search in recent history */
  function recordSearch(query: string, resultCount: number) {
    if (query) saveRecentSearch(query, resultCount);
  }

  /** Sync input with external URL param */
  function syncInput(value: string) {
    setSearchInput(value);
  }

  const showDropdown =
    searchFocused &&
    (suggestions.length > 0 || (searchInput === "" && recentSearches.length > 0));

  return {
    searchInput,
    searchFocused,
    suggestions,
    recentSearches,
    showDropdown,
    searchInputRef,
    mobileSearchRef,
    dropdownRef,
    handleInputChange,
    clearSearch,
    applySearch,
    handleFocus,
    removeRecentSearch,
    recordSearch,
    syncInput,
  };
}
