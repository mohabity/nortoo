"use client";

import { useEffect, useState } from "react";
import { Ticket, Plus, Copy, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  redeemUrl: string;
  redemptions: Array<{
    merchantId: number;
    merchantName: string;
    redeemedAt: string;
    effect: unknown;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  trial_extension: "Extension trial",
  first_month_free: "1er mois gratuit",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"trial_extension" | "first_month_free">("trial_extension");
  const [formValue, setFormValue] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formExpires, setFormExpires] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const json = await res.json();
        setCoupons(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError("");

    const body: Record<string, unknown> = {
      type: formType,
      value: parseInt(formValue, 10),
    };
    if (formCode.trim()) body.code = formCode.trim().toUpperCase();
    if (formMaxUses) body.maxUses = parseInt(formMaxUses, 10);
    if (formExpires) body.expiresAt = formExpires;

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setFormCode("");
        setFormValue("");
        setFormMaxUses("");
        setFormExpires("");
        await fetchCoupons();
      } else {
        const json = await res.json().catch(() => null);
        setCreateError(json?.error ?? "Erreur lors de la création");
      }
    } catch {
      setCreateError("Erreur réseau");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: number) {
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    await fetchCoupons();
  }

  function copyToClipboard(text: string, id: number) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto lg:ml-56">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Ticket className="w-6 h-6 text-[#C8FF00]" />
          <h1 className="text-xl font-display font-bold text-white">Coupons</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8FF00]/10 text-[#C8FF00] text-sm font-medium hover:bg-[#C8FF00]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau coupon
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-slate/40 rounded-xl border border-slate p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Créer un coupon</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-fog mb-1 block">Code (auto si vide)</label>
              <input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="AUTO"
                className="w-full h-9 rounded-md bg-midnight border border-slate px-3 text-sm text-white font-mono placeholder:text-fog/40 focus:outline-none focus:ring-1 focus:ring-[#C8FF00]/40"
              />
            </div>
            <div>
              <label className="text-xs text-fog mb-1 block">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as typeof formType)}
                className="w-full h-9 rounded-md bg-midnight border border-slate px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#C8FF00]/40"
              >
                <option value="trial_extension">Extension trial (jours)</option>
                <option value="first_month_free">1er mois gratuit (planId)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-fog mb-1 block">
                {formType === "trial_extension" ? "Jours à ajouter" : "Plan ID (1=starter, 2=pro, 3=scale)"}
              </label>
              <input
                type="number"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={formType === "trial_extension" ? "30" : "1"}
                className="w-full h-9 rounded-md bg-midnight border border-slate px-3 text-sm text-white placeholder:text-fog/40 focus:outline-none focus:ring-1 focus:ring-[#C8FF00]/40"
              />
            </div>
            <div>
              <label className="text-xs text-fog mb-1 block">Max utilisations (vide = illimité)</label>
              <input
                type="number"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                placeholder="100"
                className="w-full h-9 rounded-md bg-midnight border border-slate px-3 text-sm text-white placeholder:text-fog/40 focus:outline-none focus:ring-1 focus:ring-[#C8FF00]/40"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-fog mb-1 block">Date d&apos;expiration (optionnel)</label>
              <input
                type="datetime-local"
                value={formExpires}
                onChange={(e) => setFormExpires(e.target.value)}
                className="w-full h-9 rounded-md bg-midnight border border-slate px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#C8FF00]/40"
              />
            </div>
          </div>
          {createError && (
            <p className="text-xs text-rose-400 mb-2">{createError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!formValue || creating}
              className="px-4 py-2 rounded-lg bg-[#C8FF00] text-midnight text-sm font-medium hover:bg-[#C8FF00]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-fog text-sm hover:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Coupons table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-fog" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-fog text-sm">
          Aucun coupon créé. Cliquez sur &quot;Nouveau coupon&quot; pour commencer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate text-fog text-xs uppercase tracking-wider">
                <th className="py-3 px-3 text-left">Code</th>
                <th className="py-3 px-3 text-left">Type</th>
                <th className="py-3 px-3 text-left">Valeur</th>
                <th className="py-3 px-3 text-center">Utilisations</th>
                <th className="py-3 px-3 text-left">Expiration</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-slate/40 hover:bg-slate/20 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono text-[#C8FF00] font-medium">{c.code}</span>
                  </td>
                  <td className="py-3 px-3 text-mist">{TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="py-3 px-3 text-mist">
                    {c.type === "trial_extension" ? `+${c.value} jours` : `Plan ${c.value}`}
                  </td>
                  <td className="py-3 px-3 text-center text-mist">
                    {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}
                  </td>
                  <td className="py-3 px-3 text-mist text-xs">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {c.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyToClipboard(c.redeemUrl, c.id)}
                        className="p-1.5 rounded-md hover:bg-slate/40 text-fog hover:text-white transition-colors"
                        title="Copier le lien"
                      >
                        {copiedId === c.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {c.isActive && (
                        <button
                          onClick={() => handleDeactivate(c.id)}
                          className="p-1.5 rounded-md hover:bg-rose-500/10 text-fog hover:text-rose-400 transition-colors"
                          title="Désactiver"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Redemption details */}
      {coupons.some((c) => c.redemptions.length > 0) && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-white mb-3">Historique des utilisations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate text-fog text-xs uppercase tracking-wider">
                  <th className="py-2 px-3 text-left">Code</th>
                  <th className="py-2 px-3 text-left">Marchand</th>
                  <th className="py-2 px-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {coupons
                  .flatMap((c) =>
                    c.redemptions.map((r) => ({
                      code: c.code,
                      ...r,
                    }))
                  )
                  .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime())
                  .slice(0, 50)
                  .map((r, i) => (
                    <tr key={i} className="border-b border-slate/40">
                      <td className="py-2 px-3 font-mono text-[#C8FF00] text-xs">{r.code}</td>
                      <td className="py-2 px-3 text-mist">{r.merchantName}</td>
                      <td className="py-2 px-3 text-fog text-xs">
                        {new Date(r.redeemedAt).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
