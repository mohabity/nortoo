"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Search,
  ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Invoice {
  id: number;
  merchantId: number;
  merchantName: string;
  merchantEmail: string;
  merchantPlan: string;
  invoiceNumber: string;
  period: string;
  planAtInvoice: string;
  amountHT: number;
  tvaRate: number;
  amountTVA: number;
  amountTTC: number;
  status: string;
  paidAt: string | null;
  paidNote: string | null;
  dueDate: string;
  createdAt: string;
}

interface Stats {
  totalPending: number;
  totalPaid: number;
  countOverdue: number;
  totalCount: number;
  countPendingUpgrades: number;
  totalPendingUpgradeAmount: number;
}

function isUpgradeInvoice(inv: Invoice): boolean {
  return !!inv.planAtInvoice && inv.planAtInvoice !== inv.merchantPlan;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

function formatDH(centimes: number): string {
  const dh = centimes / 100;
  return dh.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}

export default function AdminInvoicesPage() {
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pay modal
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [payNote, setPayNote] = useState("");

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter === "upgrades") {
        params.set("type", "upgrade");
      } else if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/invoices?${params}`);
      const json = await res.json();
      if (json.data) setInvoicesList(json.data);
      if (json.stats) setStats(json.stats);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { setLoading(true); fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleMarkPaid = async () => {
    if (!payModal) return;
    setActionLoading(payModal.id);
    try {
      const res = await fetch(`/api/admin/invoices/${payModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidNote: payNote || undefined }),
      });
      if (res.ok) {
        setToast({ type: "success", message: `Facture ${payModal.invoiceNumber} marquée payée` });
        setPayModal(null);
        setPayNote("");
        fetchInvoices();
      } else {
        const json = await res.json();
        setToast({ type: "error", message: json.error || "Erreur" });
      }
    } catch {
      setToast({ type: "error", message: "Erreur réseau" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (inv: Invoice) => {
    setActionLoading(inv.id);
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setToast({ type: "success", message: `Facture ${inv.invoiceNumber} annulée` });
        fetchInvoices();
      }
    } catch {
      setToast({ type: "error", message: "Erreur réseau" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mint" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight flex items-center gap-2">
            <FileText className="h-5 w-5 text-mint" />
            Factures
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion des factures et paiements
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchInvoices(); }}
          className="inline-flex items-center gap-2 rounded-sm bg-white px-3 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">En attente</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{formatDH(stats.totalPending)}</p>
          </div>
          <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payé ce mois</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatDH(stats.totalPaid)}</p>
          </div>
          <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">En retard</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.countOverdue}</p>
          </div>
          <div className="rounded-sm bg-white border border-purple-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3 text-purple-500" />
              Demandes upgrade
            </p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.countPendingUpgrades}</p>
            {stats.totalPendingUpgradeAmount > 0 && (
              <p className="text-xs text-purple-400 mt-0.5">{formatDH(stats.totalPendingUpgradeAmount)}</p>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par n° facture ou marchand..."
          className="w-full h-10 bg-white border border-gray-200 text-midnight text-sm rounded-sm pl-10 pr-4 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-mint/40 focus:border-mint/60"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "pending", "paid", "overdue", "cancelled", "upgrades"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s
                ? s === "upgrades"
                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                  : "bg-mint/10 text-mint border border-mint/30"
                : "bg-white text-gray-500 border border-gray-200 hover:text-midnight"
            )}
          >
            {s === "all" ? "Toutes" : s === "upgrades" ? (
              <span className="flex items-center gap-1">
                <ArrowUpCircle className="w-3 h-3" />
                Upgrades
                {stats && stats.countPendingUpgrades > 0 && (
                  <span className="ml-1 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {stats.countPendingUpgrades}
                  </span>
                )}
              </span>
            ) : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-sm border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marchand</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TTC</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(() => {
              const filtered = searchQuery
                ? invoicesList.filter(
                    (inv) =>
                      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      inv.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      inv.merchantEmail.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : invoicesList;
              return filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Aucune facture
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-midnight">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-midnight text-sm">{inv.merchantName}</p>
                    <p className="text-gray-400 text-xs">{inv.merchantEmail}</p>
                    {isUpgradeInvoice(inv) && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                        <ArrowUpCircle className="w-2.5 h-2.5" />
                        {inv.merchantPlan} → {inv.planAtInvoice}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.period}</td>
                  <td className="px-4 py-3 text-right font-medium text-midnight">{formatDH(inv.amountTTC)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[inv.status])}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(inv.status === "pending" || inv.status === "overdue") && (
                        <button
                          onClick={() => { setPayModal(inv); setPayNote(""); }}
                          disabled={actionLoading === inv.id}
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === inv.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Payée
                        </button>
                      )}
                      <a
                        href={`/api/admin/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </a>
                      {inv.status !== "cancelled" && inv.status !== "paid" && (
                        <button
                          onClick={() => handleCancel(inv)}
                          disabled={actionLoading === inv.id}
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Annuler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            );
            })()}
          </tbody>
        </table>
      </div>

      {/* Pay modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-midnight mb-4">
              Marquer comme payée
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Facture <span className="text-midnight font-mono">{payModal.invoiceNumber}</span> — {formatDH(payModal.amountTTC)}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {payModal.merchantName}
            </p>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Référence virement (optionnel)
              </label>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="Ex: VIR-2026-03-15"
                className="w-full rounded-sm bg-white border border-gray-200 px-3 py-2 text-sm text-midnight placeholder:text-gray-400 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint/40"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setPayModal(null)}
                className="rounded-sm px-4 py-2 text-sm text-gray-500 hover:text-midnight transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading === payModal.id}
                className="inline-flex items-center gap-2 rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === payModal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 rounded-sm border px-4 py-3 shadow-lg",
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}
        >
          <p className="text-sm">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
