"use client";

import { useState, useEffect, useCallback } from "react";
import { deliveryLabel, cn } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { DecisionBadge } from "./decision-badge";
import { PipelineBadge } from "./pipeline-badge";
import { highlightText } from "@/lib/highlight";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CountdownBadge({ deadline }: { deadline: string }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(t("time.expired"));
        setIsOverdue(true);
        return;
      }
      setIsOverdue(false);
      const mins = Math.floor(diff / 60000);
      if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setRemaining(`${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}`);
      } else {
        setRemaining(`${mins}min`);
      }
    }
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [deadline, t]);

  return (
    <span
      className={`text-[10px] font-mono font-medium ${
        isOverdue ? "text-rose" : "text-amber"
      }`}
    >
      {remaining}
    </span>
  );
}

export interface OrderRow {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  customerPhoneLast4: string | null;
  productName: string | null;
  total: number;
  shippingCity: string | null;
  fraudScore: number;
  decision: string;
  overrideDecision?: string | null;
  deliveryStatus: string;
  pipelineStatus: string;
  scoreExplanation?: string | null;
  reviewDeadline?: string | null;
  escalationPriority?: number | null;
  createdAt: string;
}

interface OrderTableProps {
  orders: OrderRow[];
  onRowClick?: (orderId: number) => void;
  searchQuery?: string;
  // Selection props (optional — component works without them)
  selectedIds?: Set<number>;
  onToggle?: (id: number) => void;
  onToggleAll?: () => void;
  onRangeSelect?: (id: number) => void;
  selectAllState?: "none" | "some" | "all";
}

function SelectAllCheckbox({
  state,
  onChange,
}: {
  state: "none" | "some" | "all";
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = state === "some";
    },
    [state]
  );

  return (
    <input
      ref={setRef}
      type="checkbox"
      checked={state === "all"}
      onChange={onChange}
      className="h-4 w-4 rounded border-silk accent-mint-deep cursor-pointer"
      aria-label={t("orders.table.selectAll")}
    />
  );
}

export function OrderTable({
  orders,
  onRowClick,
  searchQuery = "",
  selectedIds,
  onToggle,
  onToggleAll,
  onRangeSelect,
  selectAllState = "none",
}: OrderTableProps) {
  const { t, locale } = useTranslation();
  const hasSelection = !!onToggle;
  const colSpan = hasSelection ? 10 : 9;

  const hl = (text: string | null | undefined) =>
    searchQuery ? highlightText(text, searchQuery) : (text ?? "\u2014");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {hasSelection && (
            <TableHead className="w-[44px] text-center px-2">
              <SelectAllCheckbox
                state={selectAllState}
                onChange={() => onToggleAll?.()}
              />
            </TableHead>
          )}
          <TableHead className="text-center w-[70px]">{t("orders.table.score")}</TableHead>
          <TableHead>{t("orders.table.analysis")}</TableHead>
          <TableHead>{t("orders.table.client")}</TableHead>
          <TableHead>{t("orders.table.city")}</TableHead>
          <TableHead className="text-right">{t("orders.table.amount")}</TableHead>
          <TableHead className="text-center">{t("orders.table.decision")}</TableHead>
          <TableHead className="text-center">{t("orders.table.pipeline")}</TableHead>
          <TableHead>{t("orders.table.status")}</TableHead>
          <TableHead>{t("orders.table.product")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-fog py-8">
              {t("orders.table.noOrders")}
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => {
            const isChecked = selectedIds?.has(order.id) ?? false;
            return (
              <TableRow
                key={order.id}
                className={cn(
                  "cursor-pointer hover:bg-snow/50 transition-colors",
                  isChecked && "bg-mint-bg/50"
                )}
                onClick={() => onRowClick?.(order.id)}
              >
                {hasSelection && (
                  <TableCell
                    className="text-center px-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle?.(order.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          e.preventDefault();
                          onRangeSelect?.(order.id);
                        }
                      }}
                      className="h-4 w-4 rounded border-silk accent-mint-deep cursor-pointer"
                      aria-label={t("orders.table.selectOrder", { ref: String(order.externalRef ?? order.id) })}
                    />
                  </TableCell>
                )}
                <TableCell className="text-center">
                  <ScoreBadge score={order.fraudScore} size="sm" />
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <p className="text-xs text-fog truncate">
                    {order.scoreExplanation
                      ? (() => {
                          try {
                            return JSON.parse(order.scoreExplanation).summary;
                          } catch {
                            return "\u2014";
                          }
                        })()
                      : "\u2014"}
                  </p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-midnight">
                      {hl(order.customerName)}
                    </p>
                    {order.customerPhoneLast4 && (
                      <p className="text-xs text-mist">
                        ***{order.customerPhoneLast4}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{hl(order.shippingCity)}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(order.total, locale)}
                </TableCell>
                <TableCell className="text-center">
                  <DecisionBadge
                    decision={order.overrideDecision ?? order.decision}
                    size="sm"
                  />
                  {order.overrideDecision && (
                    <span
                      className="ml-1 text-[10px] text-mist"
                      title="Override actif"
                    >
                      *
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <PipelineBadge status={order.pipelineStatus} size="sm" />
                    {order.pipelineStatus === "needs_review" &&
                      order.reviewDeadline && (
                        <CountdownBadge deadline={order.reviewDeadline} />
                      )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-fog">
                  {deliveryLabel(order.deliveryStatus, locale)}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-sm text-fog">
                  {hl(order.productName)}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
