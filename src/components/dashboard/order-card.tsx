"use client";

import { useState, useEffect } from "react";
import { formatDH } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { DecisionBadge } from "./decision-badge";
import { PipelineBadge } from "./pipeline-badge";
import { highlightText } from "@/lib/highlight";
import type { OrderRow } from "./order-table";

interface OrderCardProps {
  order: OrderRow;
  onClick?: (orderId: number) => void;
  searchQuery?: string;
}

const deliveryLabels: Record<string, string> = {
  pending: "En attente",
  shipped: "Exp\u00E9di\u00E9",
  delivered: "Livr\u00E9",
  returned: "Retourn\u00E9",
  cancelled: "Annul\u00E9",
};

function CardCountdown({ deadline }: { deadline: string }) {
  const [label, setLabel] = useState("");
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("expiré");
        setOverdue(true);
        return;
      }
      setOverdue(false);
      const mins = Math.floor(diff / 60000);
      setLabel(mins >= 60 ? `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, "0")}` : `${mins}min`);
    }
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [deadline]);

  return (
    <span className={`text-[10px] font-mono font-medium ${overdue ? "text-rose" : "text-amber"}`}>
      {label}
    </span>
  );
}

export function OrderCard({ order, onClick, searchQuery = "" }: OrderCardProps) {
  const hl = (text: string | null | undefined) =>
    searchQuery ? highlightText(text, searchQuery) : (text ?? "");

  return (
    <button
      onClick={() => onClick?.(order.id)}
      className="w-full text-left rounded-sm border border-silk bg-white p-4 transition-colors hover:bg-snow/50 active:bg-snow"
    >
      <div className="flex items-start gap-3">
        {/* Score badge */}
        <div className="shrink-0 pt-0.5">
          <ScoreBadge score={order.fraudScore} size="md" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-midnight truncate">
              {hl(order.customerName) || "Client inconnu"}
            </p>
            <span className="font-mono text-sm font-semibold text-midnight shrink-0">
              {formatDH(order.total)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-fog">
            {order.externalRef && (
              <span className="font-mono">{hl(order.externalRef)}</span>
            )}
            {order.shippingCity && (
              <>
                <span className="text-mist">·</span>
                <span>{hl(order.shippingCity)}</span>
              </>
            )}
            {order.productName && (
              <>
                <span className="text-mist">·</span>
                <span className="truncate">{hl(order.productName)}</span>
              </>
            )}
          </div>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <DecisionBadge
              decision={order.overrideDecision ?? order.decision}
              size="sm"
            />
            <PipelineBadge status={order.pipelineStatus} size="sm" />
            {order.pipelineStatus === "needs_review" && order.reviewDeadline && (
              <CardCountdown deadline={order.reviewDeadline} />
            )}
            <span className="text-xs text-mist">
              {deliveryLabels[order.deliveryStatus] ?? order.deliveryStatus}
            </span>
          </div>

          {/* Explanation summary */}
          {order.scoreExplanation && (
            <p className="mt-1.5 text-[11px] text-fog line-clamp-1">
              {(() => {
                try {
                  return JSON.parse(order.scoreExplanation).summary;
                } catch {
                  return null;
                }
              })()}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
