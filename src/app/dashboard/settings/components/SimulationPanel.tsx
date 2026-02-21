"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Ban,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecisionBadge } from "@/components/dashboard/decision-badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";
import {
  recalculateDistribution,
  type SimulationResult,
  type LiveDistribution,
} from "@/lib/scoring-simulator";

interface SimulationPanelProps {
  verify: number;
  flag: number;
  block: number;
  savedVerify: number;
  savedFlag: number;
  savedBlock: number;
  onApply: () => void;
  onClose: () => void;
}

const DECISION_COLORS: Record<string, string> = {
  ship: "bg-mint",
  verify: "bg-amber",
  flag: "bg-rose",
  block: "bg-violet",
};

const DECISION_TEXT_COLORS: Record<string, string> = {
  ship: "text-mint-deep",
  verify: "text-amber",
  flag: "text-rose",
  block: "text-violet",
};

const DECISION_LABEL_KEYS: Record<string, string> = {
  ship: "decisions.ship",
  verify: "decisions.verify",
  flag: "decisions.flag",
  block: "decisions.block",
};

const DECISIONS = ["ship", "verify", "flag", "block"] as const;

export function SimulationPanel({
  verify,
  flag,
  block,
  savedVerify,
  savedFlag,
  savedBlock,
  onApply,
  onClose,
}: SimulationPanelProps) {
  const { t, locale } = useTranslation();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Fetch full simulation on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSimulation() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/scoring/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thresholds: { verify, flag, block },
            limit: 200,
          }),
        });
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          if (json.error === "insufficient_data") {
            setError(
              t("settings.simulation.insufficientData", { current: String(json.current ?? 0) })
            );
          } else {
            setError(json.error ?? t("settings.simulation.error"));
          }
          return;
        }

        setResult(json.data);
      } catch {
        if (!cancelled) setError(t("settings.simulation.networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSimulation();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live recalculation as sliders move (using cached scores)
  const liveResult = useMemo<LiveDistribution | null>(() => {
    if (!result) return null;
    return recalculateDistribution(
      result.scores,
      { verify: savedVerify, flag: savedFlag, block: savedBlock },
      { verify, flag, block }
    );
  }, [result, verify, flag, block, savedVerify, savedFlag, savedBlock]);

  // Use live result for display, fall back to full result
  const displayCurrent = liveResult?.current ?? result?.current;
  const displaySimulated = liveResult?.simulated ?? result?.simulated;
  const displayDeltas = liveResult?.deltas;
  const displayChangePercent = liveResult?.changePercent ?? result?.changes.percentChanged ?? 0;
  const sampleSize = result?.sampleSize ?? 0;

  async function handleApply() {
    setApplying(true);
    await onApply();
    setApplying(false);
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="rounded-[16px] border border-silk bg-white p-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-ocean mr-2" />
          <span className="text-sm text-fog">{t("settings.simulation.running")}</span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="rounded-[16px] border border-silk bg-white p-6 animate-in fade-in duration-300">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display font-semibold text-midnight">
            {t("settings.simulation.title")}
          </h3>
          <button onClick={onClose} className="text-mist hover:text-slate">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-xl bg-snow border border-silk p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-amber mx-auto mb-2" />
          <p className="text-sm text-fog">{error}</p>
        </div>
      </div>
    );
  }

  if (!result || !displayCurrent || !displaySimulated) return null;

  const totalCurrent = displayCurrent.ship + displayCurrent.verify + displayCurrent.flag + displayCurrent.block;
  const totalSimulated = displaySimulated.ship + displaySimulated.verify + displaySimulated.flag + displaySimulated.block;

  return (
    <div className="rounded-[16px] border border-silk bg-white p-6 animate-in slide-in-from-top-2 fade-in duration-300 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold text-midnight">
            {t("settings.simulation.title")}
          </h3>
          <p className="text-xs text-mist mt-0.5">
            {t("settings.simulation.basedOn", { count: String(sampleSize) })}
          </p>
        </div>
        <button onClick={onClose} className="text-mist hover:text-slate">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Stacked comparison bars ── */}
      <div className="space-y-2">
        <DistributionBar
          label={t("settings.simulation.current")}
          distribution={displayCurrent}
          total={totalCurrent}
          t={t}
        />
        <DistributionBar
          label={t("settings.simulation.simulated")}
          distribution={displaySimulated}
          total={totalSimulated}
          t={t}
        />
      </div>

      {/* ── Distribution numbers ── */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {DECISIONS.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-silk bg-snow px-3 py-2.5 text-center"
          >
            <p className="text-[10px] font-medium text-mist uppercase tracking-wider">
              {t(DECISION_LABEL_KEYS[key])}
            </p>
            <p className={cn("font-mono text-xl font-bold mt-0.5", DECISION_TEXT_COLORS[key])}>
              {displaySimulated[key]}
            </p>
            {displayDeltas && displayDeltas[key] !== 0 && (
              <p
                className={cn(
                  "text-xs font-mono font-medium mt-0.5",
                  displayDeltas[key] > 0 ? "text-rose" : "text-mint-deep"
                )}
              >
                {displayDeltas[key] > 0 ? "+" : ""}
                {displayDeltas[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Change summary ── */}
      {displayChangePercent > 0 && (
        <p className="text-xs text-fog text-center">
          {t("settings.simulation.changeSummary", {
            count: String(liveResult?.changedCount ?? result.changes.totalChanged),
            percent: String(displayChangePercent),
          })}
        </p>
      )}

      {/* ── Impact section (from full simulation) ── */}
      {result.impact && (result.changes.newlyBlocked > 0 || result.changes.newlyShipped > 0) && (
        <div className="rounded-xl bg-snow border border-silk p-4 space-y-3">
          <p className="text-xs font-medium text-mist uppercase tracking-wider">
            {t("settings.simulation.estimatedImpact")}
          </p>

          {result.changes.newlyBlocked > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-midnight">
                {t("settings.simulation.newlyBlocked", { count: String(result.changes.newlyBlocked) })}
              </p>
              {result.impact.newlyBlockedReturned > 0 && (
                <div className="flex items-center gap-2 text-sm text-fog">
                  <CheckCircle2 className="h-3.5 w-3.5 text-mint-deep shrink-0" />
                  <span>
                    {t("settings.simulation.wouldHaveReturned", { count: String(result.impact.newlyBlockedReturned) })}
                  </span>
                </div>
              )}
              {result.impact.newlyBlockedDelivered > 0 && (
                <div className="flex items-center gap-2 text-sm text-fog">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber shrink-0" />
                  <span>
                    {t("settings.simulation.wouldHaveDelivered", { count: String(result.impact.newlyBlockedDelivered) })}
                  </span>
                </div>
              )}
              {result.impact.newlyBlockedUnknown > 0 && (
                <div className="flex items-center gap-2 text-sm text-fog">
                  <HelpCircle className="h-3.5 w-3.5 text-mist shrink-0" />
                  <span>
                    {t("settings.simulation.unknownStatus", { count: String(result.impact.newlyBlockedUnknown) })}
                  </span>
                </div>
              )}
            </div>
          )}

          {result.changes.newlyShipped > 0 && (
            <p className="text-sm text-fog">
              <span className="text-mint-deep font-medium">
                {result.changes.newlyShipped}
              </span>{" "}
              {t("settings.simulation.fewerBlocked", { count: String(result.changes.newlyShipped) })}
            </p>
          )}

          <div className="border-t border-silk pt-3 space-y-1.5">
            {result.impact.estimatedSavingsGain > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-fog">
                  <TrendingUp className="h-3.5 w-3.5 text-mint-deep" />
                  {t("settings.simulation.additionalSavings")}
                </span>
                <span className="font-mono font-medium text-mint-deep">
                  +{formatCurrency(result.impact.estimatedSavingsGain, locale)}
                </span>
              </div>
            )}
            {result.impact.estimatedSalesLost > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-fog">
                  <TrendingDown className="h-3.5 w-3.5 text-rose" />
                  {t("settings.simulation.potentialSalesLost")}
                </span>
                <span className="font-mono font-medium text-rose">
                  -{formatCurrency(result.impact.estimatedSalesLost, locale)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-medium border-t border-silk pt-1.5">
              <span className="text-midnight">{t("settings.simulation.netBalance")}</span>
              <span
                className={cn(
                  "font-mono",
                  result.impact.netBalance >= 0
                    ? "text-mint-deep"
                    : "text-rose"
                )}
              >
                {result.impact.netBalance >= 0 ? "+" : ""}
                {formatCurrency(result.impact.netBalance, locale)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Warnings ── */}
      {result.warnings.map((w, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-2 rounded-xl border px-4 py-3",
            w.includes("coûter")
              ? "bg-rose/5 border-rose/20"
              : "bg-amber/5 border-amber/20"
          )}
        >
          <AlertTriangle
            className={cn(
              "h-4 w-4 shrink-0 mt-0.5",
              w.includes("coûter") ? "text-rose" : "text-amber"
            )}
          />
          <p
            className={cn(
              "text-sm",
              w.includes("coûter") ? "text-rose" : "text-amber"
            )}
          >
            {w}
          </p>
        </div>
      ))}

      {/* ── Examples ── */}
      {result.examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-mist uppercase tracking-wider">
            {t("settings.simulation.impactedOrders")}
          </p>
          <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
            {result.examples.slice(0, 5).map((ex) => (
              <div
                key={ex.id}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  ex.deliveryStatus === "returned" &&
                    ex.simulatedDecision === "block"
                    ? "border-mint/30 bg-mint-bg/30"
                    : ex.deliveryStatus === "delivered" &&
                        ex.simulatedDecision === "block"
                      ? "border-amber/30 bg-amber/5"
                      : "border-silk bg-snow"
                )}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-mist shrink-0">
                      {ex.externalRef ?? `#${ex.id}`}
                    </span>
                    <span className="text-slate truncate">
                      {ex.customerName ?? "—"}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate shrink-0 ml-2">
                    {formatCurrency(ex.total, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <DecisionBadge
                    decision={ex.originalDecision}
                    size="sm"
                  />
                  <ArrowRight className="h-3 w-3 text-mist shrink-0" />
                  <DecisionBadge
                    decision={ex.simulatedDecision}
                    size="sm"
                  />
                  {ex.deliveryStatus === "returned" && (
                    <span className="text-[10px] text-mint-deep font-medium ml-auto">
                      {t("delivery.returned")}
                    </span>
                  )}
                  {ex.deliveryStatus === "delivered" && (
                    <span className="text-[10px] text-amber font-medium ml-auto">
                      {t("delivery.delivered")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2 border-t border-silk">
        <Button variant="outline" onClick={onClose} disabled={applying}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleApply}
          disabled={applying}
          className="bg-mint hover:bg-mint-deep text-[#0B0F1A]"
        >
          {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("settings.simulation.apply")}
        </Button>
      </div>
    </div>
  );
}

// ── Distribution Bar sub-component ──

function DistributionBar({
  label,
  distribution,
  total,
  t,
}: {
  label: string;
  distribution: { ship: number; verify: number; flag: number; block: number };
  total: number;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-mist w-12 shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-silk/50">
        {DECISIONS.map((key) => {
          const pct = (distribution[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={cn(
                DECISION_COLORS[key],
                "transition-all duration-500 ease-out"
              )}
              style={{ width: `${pct}%` }}
              title={`${t(DECISION_LABEL_KEYS[key])}: ${distribution[key]} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
    </div>
  );
}
