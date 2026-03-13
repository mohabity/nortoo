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
import { DecisionBadge } from "./decision-badge";
import { PipelineBadge } from "./pipeline-badge";
import { riskLabel, deliveryLabel, scoreColorClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatDate, formatCurrency } from "@/lib/i18n-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/use-permissions";
import type { OrderDetail } from "@/types/orders";

import { ScoringDetails } from "./order-slide-over/scoring-details";
import { CustomerHistory } from "./order-slide-over/customer-history";
import { OverrideSection } from "./order-slide-over/override-section";

// ── Helpers ──

function scoreBorderClass(score: number): string {
  if (score <= 30) return "border-mint";
  if (score <= 65) return "border-amber";
  if (score <= 85) return "border-rose";
  return "border-violet";
}

// ── Escalation Progress ──

function EscalationProgress({ start, deadline, t }: { start: string; deadline: string; t: (key: string, params?: Record<string, string | number>) => string }) {
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
        setRemaining(t("time.expired"));
      } else {
        const mins = Math.floor(diff / 60000);
        setRemaining(mins >= 60 ? t("components.orderSlideOver.hoursRemaining", { mins: `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, "0")}` }) : t("components.orderSlideOver.minsRemaining", { mins }));
      }
    }
    update();
    const iv = setInterval(update, 15000);
    return () => clearInterval(iv);
  }, [start, deadline, t]);

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
  const { t, locale } = useTranslation();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setError(
          res.status === 401
            ? t("components.orderSlideOver.authError")
            : t("components.orderSlideOver.loadError")
        );
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t("components.orderSlideOver.loadError"));
        return;
      }
      setOrder(json.data);
    } catch (err) {
      console.error("[OrderSlideOver] fetch failed:", err, "orderId:", orderId);
      setError(`${t("components.orderSlideOver.loadErrorDetail")} (${err instanceof Error ? err.message : String(err)})`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) {
      fetchOrder();
    }
  }, [open, orderId, fetchOrder]);

  const effectiveDecision = order?.overrideDecision ?? order?.decision ?? "";
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto p-0",
          isMobile
            ? "h-[95vh] rounded-t-2xl"
            : "w-full max-w-[680px]"
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
            <span className="ml-2 text-sm text-fog">{t("components.orderSlideOver.loading")}</span>
          </div>
        ) : error || !order ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-fog">{error ?? t("components.orderSlideOver.notFound")}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              {t("common.close")}
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
                      {t("components.orderSlideOver.risk", { level: riskLabel(order.riskLevel, locale).toLowerCase() })}
                    </span>
                  </div>
                  <SheetDescription className="mt-1">
                    {formatDate(order.scoredAt, locale, {
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
                    {t("components.orderSlideOver.overrideNote")}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <DecisionBadge decision={order.overrideDecision} size="sm" />
                    {order.overrideReason && (
                      <span className="text-xs text-fog truncate">{order.overrideReason}</span>
                    )}
                  </div>
                  {order.overrideAt && (
                    <p className="text-[11px] text-mist mt-0.5">
                      {formatDate(order.overrideAt, locale, {
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
                  {t("components.orderSlideOver.pipeline")}
                </h3>
                <div className="rounded-lg border border-silk bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-fog">{t("components.orderSlideOver.status")}</span>
                    <PipelineBadge status={order.pipelineStatus} size="sm" />
                  </div>
                  {order.pipelineProcessedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-fog">{t("components.orderSlideOver.processedAt")}</span>
                      <span className="text-sm text-slate font-mono">
                        {formatDate(order.pipelineProcessedAt, locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {order.escalationPriority && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-fog flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {t("components.orderSlideOver.priority")}
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
                        <Clock className="h-3 w-3" /> {t("components.orderSlideOver.deadline")}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-mono font-medium",
                          new Date(order.reviewDeadline) < new Date()
                            ? "text-rose"
                            : "text-amber"
                        )}
                      >
                        {formatDate(order.reviewDeadline, locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {order.pipelineStatus === "needs_review" && order.reviewDeadline && order.pipelineProcessedAt && (
                    <EscalationProgress
                      start={order.pipelineProcessedAt}
                      deadline={order.reviewDeadline}
                      t={t}
                    />
                  )}
                  {order.escalatedAt && (
                    <div className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-rose-bg rounded">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose" />
                      <span className="text-xs text-rose">
                        {t("components.orderSlideOver.escalatedAt")}{" "}
                        {formatDate(order.escalatedAt, locale, {
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

            {/* ── D. Scoring Analysis ── */}
            <ScoringDetails
              scoringFactors={order.scoringFactors}
              fraudScore={order.fraudScore}
              decision={order.decision}
              confidence={order.confidence}
              scoringVersion={order.scoringVersion}
              t={t}
              locale={locale}
            />

            {/* ── E. Order Info ── */}
            <div className="mx-6 mt-4">
              <h3 className="text-sm font-semibold text-midnight font-display mb-2">
                {t("components.orderSlideOver.order")}
              </h3>
              <div className="rounded-lg border border-silk bg-white p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-mist shrink-0" />
                  <span className="text-sm text-slate">{order.productName ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fog">{t("components.orderSlideOver.amount")}</span>
                  <span className="font-mono font-bold text-midnight">{formatCurrency(order.total, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fog">{t("components.orderSlideOver.delivery")}</span>
                  <span className="text-sm text-slate">
                    <Truck className="inline h-3.5 w-3.5 mr-1 text-mist" />
                    {deliveryLabel(order.deliveryStatus, locale)}
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
                        {t("components.orderSlideOver.confidence", { value: Math.round(order.addressConfidence * 100) })}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-mist shrink-0" />
                  <span className="text-sm text-fog">
                    {formatDate(order.createdAt, locale, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* ── F. Customer History ── */}
            {order.customer && (
              <CustomerHistory customer={order.customer} t={t} />
            )}

            {/* ── G. Override Actions ── */}
            {can("orders:write") && (
              <OverrideSection
                orderId={order.id}
                onOverrideSuccess={onOverrideSuccess}
                onRefetch={fetchOrder}
                t={t}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
