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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Invoice {
  id: number;
  merchantId: number;
  merchantName: string;
  merchantEmail: string;
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
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  paid: "bg-green-500/10 text-green-400 border-green-500/30",
  overdue: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/30",
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

  // Pay modal
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [payNote, setPayNote] = useState("");

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

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
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#C8FF00]" />
            Factures
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestion des factures et paiements
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchInvoices(); }}
          className="inline-flex items-center gap-2 rounded-sm bg-[#1E293B] px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm bg-[#1E293B] border border-[#334155] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">En attente</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{formatDH(stats.totalPending)}</p>
          </div>
          <div className="rounded-sm bg-[#1E293B] border border-[#334155] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payé ce mois</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{formatDH(stats.totalPaid)}</p>
          </div>
          <div className="rounded-sm bg-[#1E293B] border border-[#334155] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">En retard</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.countOverdue}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "pending", "paid", "overdue", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30"
                : "bg-[#1E293B] text-gray-400 border border-[#334155] hover:text-white"
            )}
          >
            {s === "all" ? "Toutes" : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-sm border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1E293B]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marchand</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TTC</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {invoicesList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  Aucune facture
                </td>
              </tr>
            ) : (
              invoicesList.map((inv) => (
                <tr key={inv.id} className="bg-[#0F172A] hover:bg-[#1E293B]/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-white">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{inv.merchantName}</p>
                    <p className="text-gray-500 text-xs">{inv.merchantEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{inv.period}</td>
                  <td className="px-4 py-3 text-right font-medium text-white">{formatDH(inv.amountTTC)}</td>
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
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
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
                        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
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
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Annuler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pay modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1E293B] rounded-sm border border-[#334155] p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              Marquer comme payée
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              Facture <span className="text-white font-mono">{payModal.invoiceNumber}</span> — {formatDH(payModal.amountTTC)}
            </p>
            <p className="text-sm text-gray-400 mb-4">
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
                className="w-full rounded-sm bg-[#0F172A] border border-[#334155] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#C8FF00] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setPayModal(null)}
                className="rounded-sm px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
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
              ? "bg-green-900/50 border-green-500/30 text-green-400"
              : "bg-red-900/50 border-red-500/30 text-red-400"
          )}
        >
          <p className="text-sm">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
