"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  Upload,
  RefreshCw,
  X,
  User,
  MapPin,
  Package,
  Plus,
} from "lucide-react";
import { OrderTable, type OrderRow } from "@/components/dashboard/order-table";
import { OrderCard } from "@/components/dashboard/order-card";
import { OrderSlideOver } from "@/components/dashboard/order-slide-over";
import { BulkActionBar } from "@/components/dashboard/bulk-action-bar";
import { BulkConfirmModal } from "@/components/dashboard/bulk-confirm-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useSelection } from "@/hooks/use-selection";
import { FeatureGate } from "@/components/feature-gate";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { OrdersCounts, OrdersMeta, SearchSuggestion } from "@/types/orders";

interface RecentSearch {
  query: string;
  resultCount: number;
}

const EMPTY_COUNTS: OrdersCounts = {
  all: 0,
  ship: 0,
  verify: 0,
  flag: 0,
  block: 0,
};

// ── Pills config ──

const DECISION_PILLS = [
  { key: "all", labelKey: "orders.filters.all", activeClass: "bg-midnight text-white" },
  { key: "ship", labelKey: "decisions.ship", activeClass: "bg-mint text-white" },
  { key: "verify", labelKey: "decisions.verify", activeClass: "bg-amber text-white" },
  { key: "flag", labelKey: "decisions.flag", activeClass: "bg-rose text-white" },
  { key: "block", labelKey: "decisions.block", activeClass: "bg-violet text-white" },
];

const SUGGESTION_ICONS = {
  client: User,
  city: MapPin,
  product: Package,
} as const;

// ── Recent searches helpers ──

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

function removeRecentSearch(query: string) {
  const recent = getRecentSearches().filter((r) => r.query !== query);
  sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

// ── Page ──

export default function OrdersPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
          <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const currentDecision = searchParams.get("decision") ?? "all";
  const currentPipeline = searchParams.get("pipeline") ?? "all";
  const currentSearch = searchParams.get("search") ?? "";
  const currentCursor = searchParams.get("cursor") ?? undefined;
  const currentDirection = (searchParams.get("direction") ?? "next") as "next" | "prev";
  const selectedOrderId = searchParams.get("selected");

  // Page size — URL > localStorage > default 20
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
  const PAGE_SIZE_KEY = "nortoo-orders-per-page";
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

  // Cursor-based pagination state — start in cursor mode if URL has cursor param
  const [cursorMode, setCursorMode] = useState(!!currentCursor);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [prevCursor, setPrevCursor] = useState<string | undefined>();

  // Toast
  const { addToast } = useToast();

  // Selection
  const {
    selectedIds,
    isSelected,
    toggle,
    toggleAll,
    rangeSelect,
    clearSelection,
    selectAllState,
    selectionCount,
    isSelectionMode,
  } = useSelection(orders, 50);

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    if (currentDecision !== "all") params.set("decision", currentDecision);
    if (currentPipeline !== "all") params.set("pipeline", currentPipeline);
    if (currentSearch) params.set("search", currentSearch);

    // Use cursor params if in cursor mode and a cursor is available
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

      // Auto-switch to cursor mode for large datasets
      if (responseMeta.total > 10_000 && !cursorMode) {
        setCursorMode(true);
      }

      // Store cursor values from response
      setNextCursor(responseMeta.nextCursor);
      setPrevCursor(responseMeta.prevCursor);

      // Save to recent searches
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
  // Silently poll YouCan in background to recover orders missed by webhooks.
  // Only runs once per mount — subsequent fetches are via the refresh button.
  const hasSynced = useRef(false);
  const [syncing, setSyncing] = useState(false);

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

    // Run sync in background, then refresh if new orders found
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

  // Keyboard shortcuts: Ctrl+K or / to focus search, Ctrl+A select all, Escape deselect
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      // Ctrl+A — select all (only when not in input)
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && !isInput) {
        e.preventDefault();
        toggleAll();
        return;
      }

      // Escape — deselect first, then blur search
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

      // Ctrl+K or / — focus search
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
    // Clear selection on filter/page change (not on slide-over open)
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
    // Clean up cursor params when changing filters (not page navigation)
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

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter("search", value);
    }, 400);

    // Debounce suggestions
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

  // Page size change — persist to localStorage, reset to page 1
  function handlePerPageChange(newSize: number) {
    setPerPage(newSize);
    localStorage.setItem(PAGE_SIZE_KEY, String(newSize));
    const params = new URLSearchParams(searchParams.toString());
    params.set("per_page", String(newSize));
    params.delete("page"); // Reset to page 1
    params.delete("cursor"); // Reset cursor pagination
    params.delete("direction");
    // Reset cursor state so the next fetch starts from the beginning
    setNextCursor(undefined);
    setPrevCursor(undefined);
    if (selectionCount > 0) clearSelection();
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  // Refresh — sync YouCan first, then reload orders
  const [refreshing, setRefreshing] = useState(false);
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
    // Undo by restoring each order to its previous decision
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
      // Update local state immediately
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus: status } : o))
      );
      addToast({ type: "success", message: t("orders.delivery.updated") });
    } catch {
      addToast({ type: "error", message: t("orders.delivery.error") });
    }
  }

  // ── CSV delivery import ──

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvLoading, setCsvLoading] = useState(false);

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

      // Parse header
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
      // Reset input so same file can be re-imported
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

  const counts = meta.counts ?? EMPTY_COUNTS;
  const showDropdown =
    searchFocused &&
    (suggestions.length > 0 ||
      (searchInput === "" && recentSearches.length > 0));

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-midnight">
            {t("orders.title")}
          </h1>
          <p className="text-sm text-fog">
            {counts.all !== 1
              ? t("orders.totalCountPlural", { count: counts.all })
              : t("orders.totalCount", { count: counts.all })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* New manual order */}
          <Link
            href="/dashboard/orders/new"
            className="hidden sm:inline-flex items-center gap-2 rounded-sm bg-mint px-3 py-2 text-sm font-medium text-midnight shadow-sm hover:bg-mint-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("manualOrder.navButton")}
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="sm:hidden h-10 w-10 flex items-center justify-center rounded-full bg-mint text-midnight shadow-sm hover:bg-mint-dark transition-colors"
            aria-label={t("manualOrder.navButton")}
          >
            <Plus className="h-4 w-4" />
          </Link>

          {/* Mobile search trigger */}
          <button
            onClick={openMobileSearch}
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full border border-silk bg-white text-slate hover:bg-snow transition-colors"
            aria-label={t("orders.search.ariaLabel")}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile search bar (expanded) ── */}
      {mobileSearchOpen && (
        <div className="lg:hidden flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder={t("orders.search.placeholder")}
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="h-10 w-full rounded-full border border-silk bg-white pl-9 pr-9 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-slate"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={closeMobileSearch}
            className="text-sm text-ocean font-medium shrink-0"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {/* ── Filter bar: Pills + Pipeline + Search ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        {/* Decision pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          {DECISION_PILLS.map((pill) => {
            const isActive = currentDecision === pill.key;
            const pillCount = counts[pill.key as keyof OrdersCounts] ?? 0;
            return (
              <button
                key={pill.key}
                onClick={() => setFilter("decision", pill.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? pill.activeClass
                    : "bg-white border border-silk text-slate hover:bg-snow"
                }`}
              >
                {t(pill.labelKey)}
                <span
                  className={`font-mono text-xs ${
                    isActive ? "opacity-80" : "text-mist"
                  }`}
                >
                  ({pillCount})
                </span>
              </button>
            );
          })}
        </div>

        {/* Pipeline + actions row — compact on mobile */}
        <div className="flex items-center gap-2">
          {/* Pipeline filter */}
          <select
            value={currentPipeline}
            onChange={(e) => setFilter("pipeline", e.target.value)}
            className="h-9 min-w-0 flex-1 lg:flex-none rounded-lg border border-silk bg-white px-3 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30"
          >
            <option value="all">{t("orders.filters.pipelineAll")}</option>
            <option value="auto_shipped">{t("orders.filters.autoShipped")}</option>
            <option value="needs_review">{t("orders.filters.toVerify")}</option>
            <option value="escalated">{t("orders.filters.escalated")}</option>
            <option value="auto_blocked">{t("orders.filters.autoBlocked")}</option>
            <option value="merchant_override">{t("orders.filters.override")}</option>
            <option value="pending">{t("orders.filters.pending")}</option>
          </select>

          {/* Desktop search */}
          <div className="relative hidden lg:block" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("orders.search.placeholder")}
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={handleSearchFocus}
                className="h-9 w-[320px] rounded-full border border-silk bg-white pl-8 pr-8 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
              />
              {searchInput ? (
                <button
                  onClick={clearSearch}
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
                          onClick={() => applySearch(s.value)}
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
                          onClick={() => applySearch(r.query)}
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
                            setRecentSearches(getRecentSearches());
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

          {/* Action buttons — icon-only on mobile, inline */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh + Sync */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || syncing}
              className="h-9 w-9 lg:w-auto lg:px-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-silk bg-white text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50"
              aria-label={t("orders.refresh")}
              title={t("orders.refresh")}
            >
              <RefreshCw className={cn("h-4 w-4 shrink-0", (refreshing || syncing) && "animate-spin")} />
              {(refreshing || syncing) && (
                <span className="hidden lg:inline text-xs text-mist">
                  {t("orders.sync.syncing")}
                </span>
              )}
            </button>

            {/* Import delivery CSV */}
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={csvLoading}
              className="h-9 w-9 lg:w-auto lg:px-3 inline-flex items-center justify-center gap-2 rounded-full border border-silk bg-white text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50"
              title="Importer livraisons (CSV)"
            >
              {csvLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 shrink-0" />
              )}
              <span className="hidden lg:inline">{t("orders.delivery.import")}</span>
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
            />

            {/* Export CSV — Starter+ */}
            <FeatureGate feature="csv_export" mode="lock">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="h-9 w-9 lg:w-auto lg:px-3 inline-flex items-center justify-center gap-2 rounded-full border border-silk bg-white text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50"
              >
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 shrink-0" />
                )}
                <span className="hidden lg:inline">{t("orders.export.csv")}</span>
              </button>
            </FeatureGate>
          </div>
        </div>
      </div>

      {/* ── Orders Table (desktop) / Cards (mobile) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
          <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-8 w-8 text-mist mx-auto mb-3" />
          <p className="text-fog font-medium">
            {t("orders.search.noResults")}
            {currentSearch && (
              <>
                {" "}
                {t("orders.search.noResultsFor", { query: currentSearch })}
              </>
            )}
          </p>
          {currentSearch && (
            <p className="text-sm text-mist mt-1">
              {t("orders.search.tryFewerKeywords")}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <OrderTable
                orders={orders}
                onRowClick={handleRowClick}
                searchQuery={currentSearch}
                selectedIds={selectedIds}
                onToggle={toggle}
                onToggleAll={toggleAll}
                onRangeSelect={rangeSelect}
                selectAllState={selectAllState}
                onDeliveryUpdate={handleDeliveryUpdate}
              />
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 lg:hidden">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={isSelectionMode ? () => toggle(order.id) : () => handleRowClick(order.id)}
                searchQuery={currentSearch}
                isSelected={isSelected(order.id)}
                isSelectionMode={isSelectionMode}
                onToggle={toggle}
                onLongPress={toggle}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ── */}
      {meta.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: info + page size selector */}
          <div className="flex items-center gap-3 text-sm text-fog">
            {!cursorMode && (
              <>
                <span className="hidden sm:inline">
                  {t("orders.pagination.showing", {
                    from: Math.min((meta.page - 1) * perPage + 1, meta.total),
                    to: Math.min(meta.page * perPage, meta.total),
                    total: meta.total,
                  })}
                </span>
                <span className="sm:hidden">
                  {meta.page}/{meta.totalPages}
                </span>
              </>
            )}
            {cursorMode && (
              <span>
                {meta.total.toLocaleString()} {t("orders.pagination.totalOrders")}
              </span>
            )}
            <span className="text-silk hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="h-8 rounded-md border border-silk bg-white px-2 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-fog text-sm">{t("orders.pagination.perPage")}</span>
            </div>
          </div>

          {/* Right: page-based navigation */}
          {!cursorMode && meta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First page — hidden on mobile */}
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setFilter("page", "1")}
                className="hidden sm:flex h-8 w-8 p-0"
                aria-label={t("orders.pagination.first")}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              {/* Previous */}
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setFilter("page", String(meta.page - 1))}
                className="h-8 w-8 p-0"
                aria-label={t("orders.pagination.previous")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers — hidden on mobile */}
              {(() => {
                const pages: (number | "...")[] = [];
                const total = meta.totalPages;
                const current = meta.page;

                if (total <= 7) {
                  for (let i = 1; i <= total; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (current > 3) pages.push("...");
                  const start = Math.max(2, current - 1);
                  const end = Math.min(total - 1, current + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (current < total - 2) pages.push("...");
                  pages.push(total);
                }

                return (
                  <span className="hidden sm:contents">
                    {pages.map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-mist text-sm">
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === current ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilter("page", String(p))}
                          className={cn(
                            "h-8 w-8 p-0 text-sm",
                            p === current && "bg-midnight text-white hover:bg-midnight/90"
                          )}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  </span>
                );
              })()}

              {/* Next */}
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilter("page", String(meta.page + 1))}
                className="h-8 w-8 p-0"
                aria-label={t("orders.pagination.next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {/* Last page — hidden on mobile */}
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilter("page", String(meta.totalPages))}
                className="hidden sm:flex h-8 w-8 p-0"
                aria-label={t("orders.pagination.last")}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Right: cursor-based navigation */}
          {cursorMode && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevCursor}
                onClick={goPrevCursor}
                className="h-8 px-3"
                aria-label={t("orders.pagination.previous")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("orders.pagination.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextCursor || meta.hasMore === false}
                onClick={goNextCursor}
                className="h-8 px-3"
                aria-label={t("orders.pagination.next")}
              >
                {t("orders.pagination.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk action bar — Starter+ ── */}
      {selectionCount > 0 && (
        <FeatureGate feature="bulk_actions" mode="lock">
          <BulkActionBar
            selectedCount={selectionCount}
            maxExceeded={selectionCount > 50}
            onForceShip={() => setBulkAction("SHIP")}
            onForceBlock={() => setBulkAction("BLOCK")}
            onClear={clearSelection}
          />
        </FeatureGate>
      )}

      {/* ── Bulk confirm modal ── */}
      <BulkConfirmModal
        open={bulkAction !== null}
        onOpenChange={(o) => { if (!o) setBulkAction(null); }}
        action={bulkAction ?? "SHIP"}
        selectedOrders={orders.filter((o) => selectedIds.has(o.id))}
        onConfirm={handleBulkConfirm}
        isSubmitting={bulkSubmitting}
      />

      {/* ── Slide-over ── */}
      <OrderSlideOver
        orderId={selectedOrderId ? parseInt(selectedOrderId, 10) : null}
        open={!!selectedOrderId}
        onClose={handleCloseSlideOver}
        onOverrideSuccess={fetchOrders}
      />
    </div>
  );
}
