"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { OrderTable, type OrderRow } from "@/components/dashboard/order-table";
import { OrderSlideOver } from "@/components/dashboard/order-slide-over";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Types ──

interface OrdersCounts {
  all: number;
  ship: number;
  verify: number;
  flag: number;
  block: number;
}

interface OrdersMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  counts: OrdersCounts;
}

const EMPTY_COUNTS: OrdersCounts = { all: 0, ship: 0, verify: 0, flag: 0, block: 0 };

// ── Pills config ──

const DECISION_PILLS = [
  { key: "all", label: "Toutes", activeClass: "bg-midnight text-white" },
  { key: "ship", label: "Expédier", activeClass: "bg-mint text-white" },
  { key: "verify", label: "Vérifier", activeClass: "bg-amber text-white" },
  { key: "flag", label: "Signaler", activeClass: "bg-rose text-white" },
  { key: "block", label: "Bloquer", activeClass: "bg-violet text-white" },
] as const;

// ── Page ──

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
          <span className="ml-2 text-sm text-fog">Chargement...</span>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const currentDecision = searchParams.get("decision") ?? "all";
  const currentPipeline = searchParams.get("pipeline") ?? "all";
  const currentSearch = searchParams.get("search") ?? "";
  const selectedOrderId = searchParams.get("selected");

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("per_page", "20");
    if (currentDecision !== "all") params.set("decision", currentDecision);
    if (currentPipeline !== "all") params.set("pipeline", currentPipeline);
    if (currentSearch) params.set("search", currentSearch);

    try {
      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      setOrders(json.data ?? []);
      setMeta(
        json.meta ?? {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0,
          counts: EMPTY_COUNTS,
        }
      );
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentDecision, currentPipeline, currentSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // ── URL helpers ──

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when changing filters (not when changing page or selected)
    if (key !== "page" && key !== "selected") params.delete("page");
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilter("search", searchInput);
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

  const counts = meta.counts ?? EMPTY_COUNTS;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">Commandes</h1>
        <p className="text-sm text-fog">
          {counts.all} commande{counts.all !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* ── Filter bar: Pills + Pipeline + Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Decision pills */}
        <div className="flex items-center gap-2">
          {DECISION_PILLS.map((pill) => {
            const isActive = currentDecision === pill.key;
            const pillCount = counts[pill.key as keyof OrdersCounts] ?? 0;
            return (
              <button
                key={pill.key}
                onClick={() => setFilter("decision", pill.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? pill.activeClass
                    : "bg-white border border-silk text-slate hover:bg-snow"
                }`}
              >
                {pill.label}
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

        <div className="flex items-center gap-2">
          {/* Pipeline filter */}
          <select
            value={currentPipeline}
            onChange={(e) => setFilter("pipeline", e.target.value)}
            className="h-9 rounded-lg border border-silk bg-white px-3 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30"
          >
            <option value="all">Pipeline: Tous</option>
            <option value="auto_shipped">Auto-expédié</option>
            <option value="needs_review">À vérifier</option>
            <option value="escalated">Escaladé</option>
            <option value="auto_blocked">Auto-bloqué</option>
            <option value="merchant_override">Override</option>
            <option value="pending">En attente</option>
          </select>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist" />
              <input
                type="text"
                placeholder="Chercher réf, nom, ville..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-[220px] rounded-full border border-silk bg-white pl-8 pr-3 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
              />
            </div>
          </form>
        </div>
      </div>

      {/* ── Orders Table ── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-mist" />
              <span className="ml-2 text-sm text-fog">Chargement...</span>
            </div>
          ) : (
            <OrderTable orders={orders} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      {/* ── Pagination ── */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-fog">
            Page {meta.page} sur {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setFilter("page", String(meta.page - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Précédente
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilter("page", String(meta.page + 1))}
            >
              Suivante
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
