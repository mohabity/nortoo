"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Package,
  MapPin,
  Calendar,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "./score-badge";
import { DecisionBadge } from "./decision-badge";
import { formatDH, riskLabel, deliveryLabel, scoreColorClass } from "@/lib/utils";

// ── Types ──

interface ScoringFactor {
  rule: string;
  points: number;
  reason: string;
}

interface CustomerData {
  id: number;
  name: string | null;
  city: string | null;
  phoneLast4: string | null;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  firstSeen: string;
}

interface OrderDetail {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  customerPhoneLast4: string | null;
  productName: string | null;
  total: number;
  currency: string;
  shippingCity: string | null;
  shippingAddress: string | null;
  fraudScore: number;
  riskLevel: string;
  decision: string;
  overrideDecision: string | null;
  overrideBy: string | null;
  overrideReason: string | null;
  overrideAt: string | null;
  deliveryStatus: string;
  scoringVersion: string | null;
  createdAt: string;
  scoredAt: string;
  scoringFactors: ScoringFactor[];
  confidence: number;
  customer: CustomerData | null;
}

// ── Helpers ──

function scoreBorderClass(score: number): string {
  if (score <= 30) return "border-mint";
  if (score <= 65) return "border-sun";
  if (score <= 85) return "border-coral";
  return "border-violet";
}

// ── Component ──

interface OrderSlideOverProps {
  orderId: number | null;
  open: boolean;
  onClose: () => void;
  onOverrideSuccess: () => void;
}

export function OrderSlideOver({
  orderId,
  open,
  onClose,
  onOverrideSuccess,
}: OrderSlideOverProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Override state
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors du chargement");
        return;
      }
      setOrder(json.data);
    } catch {
      setError("Impossible de charger la commande");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) {
      fetchOrder();
      // Reset override state when opening new order
      setOverrideOpen(false);
      setOverrideReason("");
      setOverrideDecision("");
    }
  }, [open, orderId, fetchOrder]);

  async function handleOverride() {
    if (!overrideDecision || !orderId) return;
    setOverrideSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: overrideDecision,
          reason: overrideReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        setOverrideOpen(false);
        setOverrideReason("");
        setOverrideDecision("");
        fetchOrder();
        onOverrideSuccess();
      }
    } finally {
      setOverrideSubmitting(false);
    }
  }

  const effectiveDecision = order?.overrideDecision ?? order?.decision ?? "";

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="overflow-y-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
            <span className="ml-2 text-sm text-ink-3">Chargement...</span>
          </div>
        ) : error || !order ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-ink-3">{error ?? "Commande introuvable"}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* ── A. Header ── */}
            <SheetHeader className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-4">
                <div
                  className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 ${scoreBorderClass(order.fraudScore)}`}
                >
                  <span className={`font-mono text-2xl font-bold ${scoreColorClass(order.fraudScore)}`}>
                    {order.fraudScore}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg">
                    {order.externalRef ?? `#${order.id}`}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <DecisionBadge decision={effectiveDecision} />
                    <span className="text-xs text-ink-4">
                      Risque {riskLabel(order.riskLevel).toLowerCase()}
                    </span>
                  </div>
                  <SheetDescription className="mt-1">
                    {new Date(order.scoredAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* ── B. Override Banner ── */}
            {order.overrideDecision && (
              <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-sun/30 bg-sun-light/50 px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-sun-deep" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-1">
                    Décision modifiée par le marchand
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <DecisionBadge decision={order.overrideDecision} size="sm" />
                    {order.overrideReason && (
                      <span className="text-xs text-ink-3 truncate">{order.overrideReason}</span>
                    )}
                  </div>
                  {order.overrideAt && (
                    <p className="text-[11px] text-ink-4 mt-0.5">
                      {new Date(order.overrideAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── C. Scoring Factors ── */}
            {order.scoringFactors.length > 0 && (
              <div className="mx-6 mt-4">
                <h3 className="text-sm font-semibold text-ink-1 font-sora mb-2">
                  Analyse du scoring
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-sand/50">
                        <th className="px-3 py-2 text-left font-medium text-ink-3 text-xs">Règle</th>
                        <th className="px-3 py-2 text-center font-medium text-ink-3 text-xs w-[60px]">Pts</th>
                        <th className="px-3 py-2 text-left font-medium text-ink-3 text-xs">Raison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.scoringFactors.map((factor) => (
                        <tr key={factor.rule} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs text-ink-2">
                            {factor.rule}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={
                                factor.points > 0
                                  ? "font-mono font-bold text-coral text-xs"
                                  : factor.points < 0
                                  ? "font-mono font-bold text-mint-deep text-xs"
                                  : "font-mono text-ink-4 text-xs"
                              }
                            >
                              {factor.points > 0
                                ? `+${factor.points}`
                                : factor.points === 0
                                ? "—"
                                : factor.points}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-ink-3">{factor.reason}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border bg-sand/30">
                        <td className="px-3 py-2 font-mono font-bold text-ink-1 text-xs">TOTAL</td>
                        <td className="px-3 py-2 text-center">
                          <ScoreBadge score={order.fraudScore} size="sm" />
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-ink-4 mt-1.5">
                  {order.scoringVersion ?? "v1.0"} — Confiance {Math.round(order.confidence * 100)}%
                </p>
              </div>
            )}

            {/* ── D. Order Info ── */}
            <div className="mx-6 mt-4">
              <h3 className="text-sm font-semibold text-ink-1 font-sora mb-2">
                Commande
              </h3>
              <div className="rounded-lg border border-border bg-white p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-ink-4 shrink-0" />
                  <span className="text-sm text-ink-2">{order.productName ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-3">Montant</span>
                  <span className="font-mono font-bold text-ink-1">{formatDH(order.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-3">Livraison</span>
                  <span className="text-sm text-ink-2">
                    <Truck className="inline h-3.5 w-3.5 mr-1 text-ink-4" />
                    {deliveryLabel(order.deliveryStatus)}
                  </span>
                </div>
                {order.shippingCity && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-ink-4 shrink-0" />
                    <span className="text-sm text-ink-3">
                      {order.shippingCity}
                      {order.shippingAddress ? ` — ${order.shippingAddress}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-ink-4 shrink-0" />
                  <span className="text-sm text-ink-3">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* ── E. Customer History ── */}
            {order.customer && (
              <div className="mx-6 mt-4">
                <h3 className="text-sm font-semibold text-ink-1 font-sora mb-2">
                  Historique client
                </h3>
                <div className="rounded-lg border border-border bg-sand/30 p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-mono text-xl font-bold text-ink-1">
                        {order.customer.totalOrders}
                      </p>
                      <p className="text-[11px] text-ink-4">Commandes</p>
                    </div>
                    <div>
                      <p className="font-mono text-xl font-bold text-mint-deep">
                        {order.customer.successfulOrders}
                      </p>
                      <p className="text-[11px] text-ink-4">Succès</p>
                    </div>
                    <div>
                      <p className="font-mono text-xl font-bold text-coral">
                        {order.customer.failedOrders}
                      </p>
                      <p className="text-[11px] text-ink-4">Échecs</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── F. Override Buttons ── */}
            <div className="mx-6 mt-4 mb-6">
              {!overrideOpen ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-mint text-mint-deep hover:bg-mint/10"
                    onClick={() => {
                      setOverrideDecision("ship");
                      setOverrideOpen(true);
                    }}
                  >
                    Forcer l&apos;expédition
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-violet text-violet hover:bg-violet/10"
                    onClick={() => {
                      setOverrideDecision("block");
                      setOverrideOpen(true);
                    }}
                  >
                    Bloquer
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-sand/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-ink-1">
                    Override →{" "}
                    <DecisionBadge decision={overrideDecision} size="sm" />
                  </p>
                  <div>
                    <label className="text-xs text-ink-3">
                      Raison (optionnelle — tracée Art. 23)
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Raison de l'override..."
                      className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-sun/30"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={overrideSubmitting}
                      onClick={handleOverride}
                    >
                      {overrideSubmitting && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Confirmer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOverrideOpen(false);
                        setOverrideReason("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-ink-4 mt-2">
                Les overrides sont tracés dans le journal d&apos;audit (Art. 23)
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
