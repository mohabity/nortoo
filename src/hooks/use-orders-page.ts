"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OrderRow } from "@/components/dashboard/order-table";
import { useToast } from "@/components/ui/toast";
import { useSelection } from "@/hooks/use-selection";
import { useTranslation } from "@/i18n/provider";
import type { OrdersCounts, OrdersMeta, SearchSuggestion } from "@/types/orders";

// ── Types ──

export interface RecentSearch {
  query: string;
  resultCount: number;
}

// ── Constants ──

export const EMPTY_COUNTS: OrdersCounts = {
  all: 0,
  ship: 0,
  verify: 0,
  flag: 0,
  block: 0,
};

export const DECISION_PILLS = [
  { key: "all", labelKey: "orders.filters.all", activeClass: "bg-midnight text-white" },
  { key: "ship", labelKey: "decisions.ship", activeClass: "bg-mint text-white" },
  { key: "verify", labelKey: "decisions.verify", activeClass: "bg-amber text-white" },
  { key: "flag", labelKey: "decisions.flag", activeClass: "bg-rose text-white" },
  { key: "block", labelKey: "decisions.block", activeClass: "bg-violet text-white" },
] as const;

export const SUGGESTION_ICONS_KEYS = ["client", "city", "product"] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ── Recent searches helpers ──

const RECENT_SEARCHES_KEY = "nortoo-recent-searches";
const MAX_RECENT = 5;

export function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string, resultCount: number) {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((r) => r.query !== query);
  recent.unshift({ query, resultCount });
  sessionStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

export function removeRecentSearch(query: string) {
  const recent = getRecentSearches().filter((r) => r.query !== query);
  sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

// ── Hook ──

const PAGE_SIZE_KEY = "nortoo-orders-per-page";

export function useOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  // Read filters from URL
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const currentDecision = searchParams.get("decision") ?? "all";
  const currentPipeline = searchParams.get("pipeline") ?? "all";
  const currentSearch = searchParams.get("search") ?? "";
  const currentCursor = searchParams.get("cursor") ?? undefined;
  const currentDirection = (searchParams.get("direction") ?? "next") as "next" | "prev";
  const selectedOrderId = searchParams.get("selected");

  // Page size — URL > localStorage > default 20
  const urlPerPage = searchParams.get("per_page");
  const [perPage, setPerPage] = useState<number>(() => {
    if (urlPerPage) return parseInt(urlPerPage, 10) || 20;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PAGE_SIZE_KEY);
      if (saved) return parseInt(saved, 10) || 20;
    }
    return 20;
  });

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [meta, setMeta] = useState<OrdersMeta>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
    counts: EMPTY_COUNTS,
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [exportLoading, setExportLoading] = useState(false);

  // Cursor-based pagination state
  const [cursorMode, setCursorMode] = useState(!!currentCursor);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [prevCursor, setPrevCursor] = useState<string | undefined>();

  // Selection
  const selection = useSelection(orders, 50);
  const {
    selectedIds,
    toggle,
    toggleAll,
    clearSelection,
    selectionCount,
  } = selection;

  // Bulk action state
  const [bulkAction, setBulkAction] = useState<"SHIP" | "BLOCK" | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Search UI state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync / refresh state
  const hasSynced = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // CSV import state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // ── Fetch orders ──

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    if (currentDecision !== "all") params.set("decision", currentDecision);
    if (currentPipeline !== "all") params.set("pipeline", currentPipeline);
    if (currentSearch) params.set("search", currentSearch);

    if (cursorMode && currentCursor) {
      params.set("cursor", currentCursor);
      params.set("direction", currentDirection);
    } else {
      params.set("page", String(currentPage));
    }

    try {
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) {
        console.error(`[Orders] API error ${res.status}:`, await res.text());
        addToast({ type: "error", message: `Erreur chargement commandes (${res.status})` });
        setOrders([]);
        return;
      }
      const json = await res.json();
      setOrders(json.data ?? []);
      const responseMeta: OrdersMeta = json.meta ?? {
        page: 1,
        perPage,
        total: 0,
        totalPages: 0,
        counts: EMPTY_COUNTS,
      };
      setMeta(responseMeta);

      if (responseMeta.total > 10_000 && !cursorMode) {
        setCursorMode(true);
      }

      setNextCursor(responseMeta.nextCursor);
      setPrevCursor(responseMeta.prevCursor);

      if (currentSearch) {
        saveRecentSearch(currentSearch, responseMeta.total ?? 0);
      }
    } catch (err) {
      console.error("[Orders] Network error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, currentDecision, currentPipeline, currentSearch, cursorMode, currentCursor, currentDirection]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Auto-sync YouCan on first load ──

  const syncYouCan = useCallback(async (): Promise<number> => {
    try {
      setSyncing(true);
      const res = await fetch("/api/sync/youcan", { method: "POST" });
      if (!res.ok) return 0;
      const json = await res.json();
      return json.synced ?? 0;
    } catch {
      return 0;
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    syncYouCan().then((synced) => {
      if (synced > 0) {
        fetchOrders();
        addToast({
          type: "success",
          message: synced === 1
            ? t("orders.sync.recovered", { count: synced })
            : t("orders.sync.recoveredPlural", { count: synced }),
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── URL helpers ──

  function setFilter(key: string, value: string) {
    if (key !== "selected" && selectionCount > 0) {
      clearSelection();
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== "page" && key !== "selected") params.delete("page");
    if (key !== "page" && key !== "selected") {
      params.delete("cursor");
      params.delete("direction");
    }
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  // ── Cursor-based navigation ──

  function goNextCursor() {
    if (!nextCursor) return;
    if (selectionCount > 0) clearSelection();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("cursor", nextCursor);
    params.set("direction", "next");
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  function goPrevCursor() {
    if (!prevCursor) return;
    if (selectionCount > 0) clearSelection();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("cursor", prevCursor);
    params.set("direction", "prev");
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  // ── Search with debounce ──

  function handleSearchInputChange(value: string) {
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter("search", value);
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

  async function fetchSuggestions(q: string) {
    try {
      const res = await fetch(
        `/api/orders/search-suggest?q=${encodeURIComponent(q)}`
      );
      const json = await res.json();
      setSuggestions(json.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
  }

  function clearSearch() {
    setSearchInput("");
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilter("search", "");
  }

  function applySearch(value: string) {
    setSearchInput(value);
    setSuggestions([]);
    setSearchFocused(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilter("search", value);
  }

  function handleSearchFocus() {
    setSearchFocused(true);
    setRecentSearches(getRecentSearches());
  }

  // Page size change
  function handlePerPageChange(newSize: number) {
    setPerPage(newSize);
    localStorage.setItem(PAGE_SIZE_KEY, String(newSize));
    const params = new URLSearchParams(searchParams.toString());
    params.set("per_page", String(newSize));
    params.delete("page");
    params.delete("cursor");
    params.delete("direction");
    setNextCursor(undefined);
    setPrevCursor(undefined);
    if (selectionCount > 0) clearSelection();
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  // Refresh
  async function handleRefresh() {
    setRefreshing(true);
    try {
      const synced = await syncYouCan();
      await fetchOrders();
      if (synced > 0) {
        addToast({
          type: "success",
          message: synced === 1
            ? t("orders.sync.recovered", { count: synced })
            : t("orders.sync.recoveredPlural", { count: synced }),
        });
      }
    } finally {
      setRefreshing(false);
    }
  }

  function handleRowClick(orderId: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", String(orderId));
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  function handleCloseSlideOver() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected");
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  // Export
  async function handleExport() {
    setExportLoading(true);
    try {
      const exportParams = new URLSearchParams();
      if (currentDecision !== "all")
        exportParams.set("decision", currentDecision);
      if (currentPipeline !== "all")
        exportParams.set("pipeline", currentPipeline);
      if (currentSearch) exportParams.set("search", currentSearch);
      const res = await fetch(`/api/orders/export?${exportParams}`);
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? t("orders.export.error"));
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? "commandes.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      if (res.headers.get("X-Truncated") === "true") {
        alert(t("orders.export.truncated"));
      }
    } finally {
      setExportLoading(false);
    }
  }

  // ── Bulk override ──

  async function handleBulkConfirm(reason: string) {
    if (!bulkAction) return;
    setBulkSubmitting(true);

    const orderIds = Array.from(selectedIds);
    try {
      const res = await fetch("/api/orders/bulk-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds, action: bulkAction, reason: reason || undefined }),
      });
      const json = await res.json();

      if (!res.ok) {
        addToast({ type: "error", message: json.error ?? t("orders.bulk.errorOverride") });
        return;
      }

      const { processed, previousDecisions } = json.data;
      const label = bulkAction === "SHIP" ? t("orders.bulk.shipped") : t("orders.bulk.blocked");

      setBulkAction(null);
      clearSelection();
      fetchOrders();

      addToast({
        type: "success",
        message: processed > 1
          ? t("orders.bulk.processedPlural", { count: processed, action: label })
          : t("orders.bulk.processed", { count: processed, action: label }),
        action: {
          label: t("orders.bulk.undo"),
          onClick: () => handleBulkUndo(previousDecisions),
        },
      });
    } catch {
      addToast({ type: "error", message: t("orders.bulk.networkError") });
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function handleBulkUndo(
    previousDecisions: { orderId: number; previousDecision: string }[]
  ) {
    for (const { orderId, previousDecision } of previousDecisions) {
      const action = previousDecision === "block" ? "BLOCK" : "SHIP";
      try {
        await fetch("/api/orders/bulk-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds: [orderId],
            action,
            reason: t("orders.bulk.undoReason"),
          }),
        });
      } catch {
        // Best effort
      }
    }
    fetchOrders();
    addToast({ type: "info", message: t("orders.bulk.undone") });
  }

  // ── Delivery update ──

  async function handleDeliveryUpdate(orderId: number, status: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        addToast({ type: "error", message: json.error ?? "Erreur mise à jour" });
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus: status } : o))
      );
      addToast({ type: "success", message: t("orders.delivery.updated") });
    } catch {
      addToast({ type: "error", message: t("orders.delivery.error") });
    }
  }

  // ── CSV delivery import ──

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        addToast({ type: "error", message: "CSV vide ou invalide" });
        return;
      }

      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const refIdx = header.indexOf("ref");
      const statusIdx = header.indexOf("status");

      if (refIdx === -1 || statusIdx === -1) {
        addToast({ type: "error", message: "CSV doit contenir les colonnes: ref, status" });
        return;
      }

      const updates = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const ref = cols[refIdx];
        const status = cols[statusIdx];
        if (ref && status && ["shipped", "delivered", "returned", "cancelled"].includes(status)) {
          updates.push({ externalRef: ref, status });
        }
      }

      if (updates.length === 0) {
        addToast({ type: "error", message: "Aucune mise à jour valide dans le CSV" });
        return;
      }

      const res = await fetch("/api/orders/bulk-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: json.error ?? "Erreur import" });
        return;
      }

      addToast({
        type: "success",
        message: `${json.data.updated} commande(s) mise(s) à jour, ${json.data.skipped} ignorée(s)`,
      });
      fetchOrders();
    } catch {
      addToast({ type: "error", message: "Erreur lecture du fichier CSV" });
    } finally {
      setCsvLoading(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  }

  // Mobile search
  function openMobileSearch() {
    setMobileSearchOpen(true);
    setTimeout(() => mobileSearchRef.current?.focus(), 100);
  }

  function closeMobileSearch() {
    setMobileSearchOpen(false);
    if (!searchInput) clearSearch();
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      if (e.key === "a" && (e.metaKey || e.ctrlKey) && !isInput) {
        e.preventDefault();
        toggleAll();
        return;
      }

      if (e.key === "Escape") {
        if (selectionCount > 0) {
          clearSelection();
          return;
        }
        if (searchFocused) {
          clearSearch();
          searchInputRef.current?.blur();
          return;
        }
      }

      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && !isInput)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchFocused, selectionCount, toggleAll, clearSelection]);

  const counts = meta.counts ?? EMPTY_COUNTS;
  const showDropdown =
    searchFocused &&
    (suggestions.length > 0 ||
      (searchInput === "" && recentSearches.length > 0));

  return {
    // URL state
    currentPage,
    currentDecision,
    currentPipeline,
    currentSearch,
    selectedOrderId,
    perPage,

    // Data
    orders,
    meta,
    counts,
    loading,

    // Selection
    selection,

    // Pagination
    cursorMode,
    nextCursor,
    prevCursor,

    // Search state
    searchInput,
    searchFocused,
    suggestions,
    recentSearches,
    showDropdown,
    mobileSearchOpen,

    // Refs
    searchInputRef,
    mobileSearchRef,
    dropdownRef,
    csvInputRef,

    // Loading states
    exportLoading,
    refreshing,
    syncing,
    csvLoading,

    // Bulk state
    bulkAction,
    setBulkAction,
    bulkSubmitting,

    // Handlers
    setFilter,
    goNextCursor,
    goPrevCursor,
    handleSearchInputChange,
    clearSearch,
    applySearch,
    handleSearchFocus,
    handlePerPageChange,
    handleRefresh,
    handleRowClick,
    handleCloseSlideOver,
    handleExport,
    handleBulkConfirm,
    handleDeliveryUpdate,
    handleCsvImport,
    openMobileSearch,
    closeMobileSearch,
    fetchOrders,
    setSearchFocused,
    setRecentSearches,
  };
}
