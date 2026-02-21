"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Package,
  MapPin,
  Calendar,
  ShieldCheck,
  Truck,
  Clock,
  AlertTriangle,
  Timer,
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
import { PipelineBadge } from "./pipeline-badge";
import { formatDH, riskLabel, deliveryLabel, scoreColorClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/use-permissions";

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
  parsedCity: string | null;
  parsedZone: string | null;
  parsedPostalCode: string | null;
  addressConfidence: number | null;
  fraudScore: number;
  riskLevel: string;
  decision: string;
  overrideDecision: string | null;
  overrideBy: string | null;
  overrideReason: string | null;
  overrideAt: string | null;
  deliveryStatus: string;
  pipelineStatus: string;
  pipelineProcessedAt: string | null;
  reviewDeadline: string | null;
  escalatedAt: string | null;
  escalationPriority: number | null;
  merchantNotifiedAt: string | null;
  scoringVersion: string | null;
  scoreExplanation: {
    summary: string;
    factors: string[];
    tip: string | null;
    emoji: string;
    confidenceLabel: string;
  } | null;
  createdAt: string;
  scoredAt: string;
  scoringFactors: ScoringFactor[];
  confidence: number;
  customer: CustomerData | null;
}

// ── Helpers ──

function scoreBorderClass(score: number): string {
  if (score <= 30) return "border-mint";
  if (score <= 65) return "border-amber";
  if (score <= 85) return "border-rose";
  return "border-violet";
}

// ── Escalation Progress ──

function EscalationProgress({ start, deadline }: { start: string; deadline: string }) {
  const [pct, setPct] = useState(0);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const s = new Date(start).getTime();
      const d = new Date(deadline).getTime();
      const now = Date.now();
      const total = d - s;
      const elapsed = now - s;
      const p = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 100;
      setPct(p);

      const diff = d - now;
      if (diff <= 0) {
        setRemaining("Expiré");
      } else {
        const mins = Math.floor(diff / 60000);
        setRemaining(mins >= 60 ? `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, "0")} restantes` : `${mins} min restantes`);
      }
    }
    update();
    const iv = setInterval(update, 15000);
    return () => clearInterval(iv);
  }, [start, deadline]);

  const barColor = pct >= 90 ? "bg-rose" : pct >= 60 ? "bg-amber" : "bg-mint";

  return (
    <div className="mt-1">
      <div className="h-1.5 w-full rounded-full bg-snow overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-[10px] mt-0.5 font-mono ${pct >= 90 ? "text-rose" : "text-mist"}`}>
        {remaining}
      </p>
    </div>
  );
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
  const { can } = usePermissions();

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
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto p-0",
          isMobile && "h-[95vh] rounded-t-2xl"
        )}
      >
        {/* Drag handle on mobile */}
        {isMobile && (
          <div className="flex justify-center py-2">
            <div className="h-1 w-10 rounded-full bg-silk" />
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-mist" />
            <span className="ml-2 text-sm text-fog">Chargement...</span>
          </div>
        ) : error || !order ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-fog">{error ?? "Commande introuvable"}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* ── A. Header ── */}
            <SheetHeader className="border-b border-silk px-6 py-5">
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
                    <span className="text-xs text-mist">
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
              <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-amber/30 bg-amber-bg px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-midnight">
                    Décision modifiée par le marchand
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <DecisionBadge decision={order.overrideDecision} size="sm" />
                    {order.overrideReason && (
                      <span className="text-xs text-fog truncate">{order.overrideReason}</span>
                    )}
                  </div>
                  {order.overrideAt && (
                    <p className="text-[11px] text-mist mt-0.5">
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

            {/* ── C. Pipeline Status + Escalation ── */}
            {order.pipelineStatus && order.pipelineStatus !== "pending" && (
              <div className="mx-6 mt-4">
                <h3 className="text-sm font-semibold text-midnight font-display mb-2">
                  Pipeline
                </h3>
                <div className="rounded-lg border border-silk bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-fog">Statut</span>
                    <PipelineBadge status={order.pipelineStatus} size="sm" />
                  </div>
                  {order.pipelineProcessedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-fog">Traité à</span>
                      <span className="text-sm text-slate font-mono">
                        {new Date(order.pipelineProcessedAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {order.escalationPriority && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-fog flex items-center gap-1">
                        <Timer className="h-3 w-3" /> Priorité
                      </span>
                      <span className={cn(
                        "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                        order.escalationPriority <= 2 ? "bg-rose-bg text-rose" :
                        order.escalationPriority <= 4 ? "bg-amber-bg text-amber" :
                        "bg-snow text-fog"
                      )}>
                        P{order.escalationPriority}
                      </span>
                    </div>
                  )}
                  {order.reviewDeadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-fog flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Délai
                      </span>
                      <span
                        className={cn(
                          "text-sm font-mono font-medium",
                          new Date(order.reviewDeadline) < new Date()
                            ? "text-rose"
                            : "text-amber"
                        )}
                      >
                        {new Date(order.reviewDeadline).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {/* Progress bar for needs_review orders */}
                  {order.pipelineStatus === "needs_review" && order.reviewDeadline && order.pipelineProcessedAt && (
                    <EscalationProgress
                      start={order.pipelineProcessedAt}
                      deadline={order.reviewDeadline}
                    />
                  )}
                  {order.escalatedAt && (
                    <div className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-rose-bg rounded">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose" />
                      <span className="text-xs text-rose">
                        Escaladé le{" "}
                        {new Date(order.escalatedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── D. Scoring Factors ── */}
            {order.scoringFactors.length > 0 && (
              <div className="mx-6 mt-4">
                <h3 className="text-sm font-semibold text-midnight font-display mb-2">
                  Analyse du scoring
                </h3>
                <div className="rounded-lg border border-silk overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-snow/50">
                        <th className="px-3 py-2 text-left font-medium text-fog text-xs">Règle</th>
                        <th className="px-3 py-2 text-center font-medium text-fog text-xs w-[60px]">Pts</th>
                        <th className="px-3 py-2 text-left font-medium text-fog text-xs">Raison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.scoringFactors.map((factor) => (
                        <tr key={factor.rule} className="border-t border-silk">
                          <td className="px-3 py-2 font-mono text-xs text-slate">
                            {factor.rule}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={
                                factor.points > 0
                                  ? "font-mono font-bold text-rose text-xs"
                                  : factor.points < 0
                                  ? "font-mono font-bold text-mint-deep text-xs"
                                  : "font-mono text-mist text-xs"
                              }
                            >
                              {factor.points > 0
                                ? `+${factor.points}`
                                : factor.points === 0
                                ? "—"
                                : factor.points}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-fog">{factor.reason}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-silk bg-snow">
                        <td className="px-3 py-2 font-mono font-bold text-midnight text-xs">TOTAL</td>
                        <td className="px-3 py-2 text-center">
                          <ScoreBadge score={order.fraudScore} size="sm" />
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-mist mt-1.5">
                  {order.scoringVersion ?? "v1.0"} — Confiance {Math.round(order.confidence * 100)}%
                </p>
              </div>
            )}

            {/* ── D bis. Explanation Card ── */}
            {(() => {
              const expl = order.scoreExplanation;
              const colorClass =
                order.fraudScore <= 30
                  ? "bg-mint-light/50 border-mint/20"
                  : order.fraudScore <= 65
                  ? "bg-sun-light/50 border-sun/20"
                  : order.fraudScore <= 85
                  ? "bg-coral-light/50 border-coral/20"
                  : "bg-violet-light/50 border-violet/20";
              return expl ? (
                <div className={`mx-6 mt-4 rounded-lg border p-4 ${colorClass}`}>
                  <p className="text-sm font-medium text-midnight">
                    {expl.summary}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {expl.factors.map((f: string, i: number) => (
                      <li key={i} className="text-xs text-slate">
                        {f}
                      </li>
                    ))}
                  </ul>
                  {expl.tip && (
                    <p className="mt-2 text-xs font-medium text-fog italic">
                      {expl.tip}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] text-mist">
                    Confiance : {expl.confidenceLabel}
                  </p>
                </div>
              ) : (
                <div className="mx-6 mt-4 rounded-lg border border-silk bg-snow p-3">
                  <p className="text-xs text-mist italic">
                    Analyse non disponible pour cette commande
                  </p>
                </div>
              );
            })()}

            {/* ── D. Order Info ── */}
            <div className="mx-6 mt-4">
              <h3 className="text-sm font-semibold text-midnight font-display mb-2">
                Commande
              </h3>
              <div className="rounded-lg border border-silk bg-white p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-mist shrink-0" />
                  <span className="text-sm text-slate">{order.productName ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fog">Montant</span>
                  <span className="font-mono font-bold text-midnight">{formatDH(order.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fog">Livraison</span>
                  <span className="text-sm text-slate">
                    <Truck className="inline h-3.5 w-3.5 mr-1 text-mist" />
                    {deliveryLabel(order.deliveryStatus)}
                  </span>
                </div>
                {order.shippingCity && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-mist shrink-0" />
                    <span className="text-sm text-fog">
                      {order.shippingCity}
                      {order.shippingAddress ? ` — ${order.shippingAddress}` : ""}
                    </span>
                  </div>
                )}
                {(order.parsedCity || order.parsedZone) && (
                  <div className="flex flex-wrap items-center gap-1.5 ml-6 mt-1">
                    {order.parsedCity && (
                      <span className="rounded-xs px-2 py-0.5 text-[11px] font-medium bg-ocean-bg text-ocean">
                        {order.parsedCity.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                    )}
                    {order.parsedZone && (
                      <span className="rounded-xs px-2 py-0.5 text-[11px] font-medium bg-amber-bg text-amber">
                        {order.parsedZone.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                    )}
                    {order.parsedPostalCode && (
                      <span className="rounded-xs px-2 py-0.5 text-[11px] font-mono bg-snow text-fog">
                        {order.parsedPostalCode}
                      </span>
                    )}
                    {order.addressConfidence != null && (
                      <span className="text-[10px] text-mist ml-1">
                        {Math.round(order.addressConfidence * 100)}% confiance
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-mist shrink-0" />
                  <span className="text-sm text-fog">
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
                <h3 className="text-sm font-semibold text-midnight font-display mb-2">
                  Historique client
                </h3>
                <div className="rounded-lg border border-silk bg-snow p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-mono text-xl font-bold text-midnight">
                        {order.customer.totalOrders}
                      </p>
                      <p className="text-[11px] text-mist">Commandes</p>
                    </div>
                    <div>
                      <p className="font-mono text-xl font-bold text-mint-deep">
                        {order.customer.successfulOrders}
                      </p>
                      <p className="text-[11px] text-mist">Succès</p>
                    </div>
                    <div>
                      <p className="font-mono text-xl font-bold text-rose">
                        {order.customer.failedOrders}
                      </p>
                      <p className="text-[11px] text-mist">Échecs</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── F. Override Buttons (orders:write only) ── */}
            {can("orders:write") && <div className="mx-6 mt-4 mb-6">
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
                <div className="rounded-lg border border-silk bg-snow p-4 space-y-3">
                  <p className="text-sm font-medium text-midnight">
                    Override →{" "}
                    <DecisionBadge decision={overrideDecision} size="sm" />
                  </p>
                  <div>
                    <label className="text-xs text-fog">
                      Raison (optionnelle — tracée Art. 23)
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Raison de l'override..."
                      className="mt-1 w-full rounded-md border border-silk bg-white px-3 py-2 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
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
              <p className="text-[11px] text-mist mt-2">
                Les overrides sont tracés dans le journal d&apos;audit (Art. 23)
              </p>
            </div>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
