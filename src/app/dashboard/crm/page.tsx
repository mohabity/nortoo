"use client";

import { type ComponentType, Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Users,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { NewCustomerModal } from "./new-customer";
import { NewOrderModal } from "./new-order";
import { CustomerDetail } from "./customer-detail";

interface Customer {
  id: number;
  phoneLast4: string | null;
  name: string | null;
  city: string | null;
  address: string | null;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  tags: string[];
  status: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
}

interface CrmStats {
  customers: { total: number; active: number; inactive: number; blacklisted: number };
  orders: { total: number; avgScore: number; delivered: number; returned: number; deliveryRate: number };
  thisMonth: { count: number; totalValue: number };
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-50 text-gray-600 border-gray-200",
  blacklisted: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  fr: { active: "Actif", inactive: "Inactif", blacklisted: "Blacklisté" },
  en: { active: "Active", inactive: "Inactive", blacklisted: "Blacklisted" },
};

export default function CrmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
        </div>
      }
    >
      <CrmContent />
    </Suspense>
  );
}

function CrmContent() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Check URL for selected customer
  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected) setSelectedCustomerId(parseInt(selected, 10));
  }, [searchParams]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/crm/customers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(data.customers);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      addToast({ message: locale === "fr" ? "Erreur de chargement" : "Loading error", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, locale, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleCustomerCreated = () => {
    setShowNewCustomer(false);
    fetchCustomers();
    fetchStats();
    addToast({ message: locale === "fr" ? "Client créé" : "Customer created", type: "success" });
  };

  const handleOrderCreated = () => {
    setShowNewOrder(false);
    fetchCustomers();
    fetchStats();
    addToast({ message: locale === "fr" ? "Commande créée et scorée" : "Order created and scored", type: "success" });
  };

  const handleSelectCustomer = (id: number) => {
    setSelectedCustomerId(id);
    router.push(`/dashboard/crm?selected=${id}`, { scroll: false });
  };

  const handleCloseDetail = () => {
    setSelectedCustomerId(null);
    router.push("/dashboard/crm", { scroll: false });
  };

  const isFr = locale === "fr";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-midnight">
            {isFr ? "Clients" : "Customers"}
          </h1>
          <p className="text-sm text-fog">
            {isFr
              ? "Gérez vos clients et leurs commandes"
              : "Manage your customers and their orders"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewOrder(true)}
            variant="outline"
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {isFr ? "Nouvelle commande" : "New order"}
          </Button>
          <Button
            onClick={() => setShowNewCustomer(true)}
            className="gap-2 bg-mint text-midnight hover:bg-mint/90"
          >
            <Plus className="h-4 w-4" />
            {isFr ? "Nouveau client" : "New customer"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={Users}
            label={isFr ? "Clients actifs" : "Active customers"}
            value={stats.customers.active}
            color="text-mint-deep"
          />
          <KpiCard
            icon={ShoppingCart}
            label={isFr ? "Commandes ce mois" : "Orders this month"}
            value={stats.thisMonth.count}
            color="text-blue-600"
          />
          <KpiCard
            icon={TrendingUp}
            label={isFr ? "Taux de livraison" : "Delivery rate"}
            value={`${stats.orders.deliveryRate}%`}
            color="text-emerald-600"
          />
          <KpiCard
            icon={BarChart3}
            label={isFr ? "Score moyen" : "Avg score"}
            value={stats.orders.avgScore}
            color="text-amber-600"
          />
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
          <input
            type="text"
            placeholder={isFr ? "Rechercher par nom..." : "Search by name..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-md border border-silk bg-white py-2 pl-9 pr-8 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-mist hover:text-fog">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {["", "active", "inactive", "blacklisted"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-midnight text-white"
                  : "bg-snow text-fog hover:bg-silk"
              )}
            >
              {s === "" ? (isFr ? "Tous" : "All") : (STATUS_LABELS[locale]?.[s] ?? s)}
              {s === "" && ` (${total})`}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-mint" />
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-mist" />
            <h3 className="font-display text-lg font-semibold text-midnight">
              {isFr ? "Aucun client" : "No customers yet"}
            </h3>
            <p className="mt-1 text-sm text-fog">
              {isFr
                ? "Ajoutez votre premier client pour commencer"
                : "Add your first customer to get started"}
            </p>
            <Button
              onClick={() => setShowNewCustomer(true)}
              className="mt-4 gap-2 bg-mint text-midnight hover:bg-mint/90"
            >
              <Plus className="h-4 w-4" />
              {isFr ? "Ajouter un client" : "Add customer"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-silk bg-snow">
                      <th className="px-4 py-3 text-left font-medium text-fog">{isFr ? "Client" : "Customer"}</th>
                      <th className="px-4 py-3 text-left font-medium text-fog">{isFr ? "Ville" : "City"}</th>
                      <th className="px-4 py-3 text-center font-medium text-fog">{isFr ? "Commandes" : "Orders"}</th>
                      <th className="px-4 py-3 text-center font-medium text-fog">{isFr ? "Livraison" : "Delivery"}</th>
                      <th className="px-4 py-3 text-left font-medium text-fog">Tags</th>
                      <th className="px-4 py-3 text-center font-medium text-fog">{isFr ? "Statut" : "Status"}</th>
                      <th className="px-4 py-3 text-right font-medium text-fog">{isFr ? "Dernière activité" : "Last seen"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => {
                      const deliveryRate = c.totalOrders > 0
                        ? Math.round((c.successfulOrders / c.totalOrders) * 100)
                        : 0;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => handleSelectCustomer(c.id)}
                          className="border-b border-silk/50 cursor-pointer transition-colors hover:bg-mint-bg/30"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-snow text-xs font-medium text-fog">
                                {c.name ? c.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-medium text-midnight">{c.name || (isFr ? "Sans nom" : "No name")}</p>
                                {c.phoneLast4 && (
                                  <p className="text-xs text-mist">····{c.phoneLast4}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-fog">{c.city || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-midnight">{c.totalOrders}</span>
                            <span className="text-xs text-mist ml-1">
                              ({c.successfulOrders}✓ {c.failedOrders}✗)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "text-sm font-medium",
                              deliveryRate >= 70 ? "text-emerald-600" :
                              deliveryRate >= 40 ? "text-amber-600" : "text-red-600"
                            )}>
                              {c.totalOrders > 0 ? `${deliveryRate}%` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {c.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                  {tag}
                                </span>
                              ))}
                              {c.tags.length > 3 && (
                                <span className="text-xs text-mist">+{c.tags.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_COLORS[c.status] || "")}>
                              {STATUS_LABELS[locale]?.[c.status] ?? c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-mist">
                            {new Date(c.lastSeen).toLocaleDateString(locale === "fr" ? "fr-MA" : "en-US")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {customers.map((c) => {
              const deliveryRate = c.totalOrders > 0
                ? Math.round((c.successfulOrders / c.totalOrders) * 100)
                : 0;
              return (
                <Card
                  key={c.id}
                  className="cursor-pointer transition-colors hover:border-mint"
                  onClick={() => handleSelectCustomer(c.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-snow text-sm font-medium text-fog">
                          {c.name ? c.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-midnight">{c.name || (isFr ? "Sans nom" : "No name")}</p>
                          <div className="flex items-center gap-2 text-xs text-mist">
                            {c.phoneLast4 && <span>····{c.phoneLast4}</span>}
                            {c.city && <><span>·</span><span>{c.city}</span></>}
                          </div>
                        </div>
                      </div>
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_COLORS[c.status] || "")}>
                        {STATUS_LABELS[locale]?.[c.status] ?? c.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-fog">
                      <span><Package className="mr-1 inline h-3 w-3" />{c.totalOrders} {isFr ? "cmd" : "ord"}</span>
                      <span className={deliveryRate >= 70 ? "text-emerald-600" : deliveryRate >= 40 ? "text-amber-600" : "text-red-600"}>
                        {c.totalOrders > 0 ? `${deliveryRate}%` : "—"}
                      </span>
                      {c.tags.length > 0 && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">{c.tags[0]}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-fog">
                {isFr ? `${total} clients` : `${total} customers`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-2 text-sm text-fog">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={handleCustomerCreated}
        />
      )}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={handleOrderCreated}
        />
      )}

      {/* Customer Detail Slide-Over */}
      {selectedCustomerId && (
        <CustomerDetail
          customerId={selectedCustomerId}
          onClose={handleCloseDetail}
          onUpdate={() => { fetchCustomers(); fetchStats(); }}
        />
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-snow", color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-fog">{label}</p>
            <p className="font-display text-lg font-bold text-midnight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
