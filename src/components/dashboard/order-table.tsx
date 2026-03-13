"use client";

import { useState, useCallback, useRef } from "react";
import { deliveryLabel, cn } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { DecisionBadge } from "./decision-badge";
import { PipelineBadge } from "./pipeline-badge";
import { highlightText } from "@/lib/highlight";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";
import { getTranslatedSummary } from "@/lib/translate-explanation";
import { Countdown } from "@/components/ui/countdown";
import type { OrderRow } from "@/types/orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type { OrderRow } from "@/types/orders";

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
  // Delivery update callback
  onDeliveryUpdate?: (orderId: number, status: string) => void;
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

// ── Column resize logic ──

const COLUMN_KEYS = [
  "score",
  "analysis",
  "client",
  "date",
  "city",
  "amount",
  "decision",
  "pipeline",
  "status",
  "product",
] as const;

const DEFAULT_WIDTHS: Record<string, number> = {
  score: 70,
  analysis: 180,
  client: 150,
  date: 120,
  city: 110,
  amount: 100,
  decision: 100,
  pipeline: 110,
  status: 110,
  product: 160,
};

const COL_WIDTHS_KEY = "nortoo-order-col-widths";
const MIN_COL_WIDTH = 60;

function loadColumnWidths(): Record<string, number> {
  if (typeof window === "undefined") return { ...DEFAULT_WIDTHS };
  try {
    const saved = localStorage.getItem(COL_WIDTHS_KEY);
    if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_WIDTHS };
}

function saveColumnWidths(widths: Record<string, number>) {
  try {
    localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(widths));
  } catch { /* ignore */ }
}

function ResizeHandle({
  onResize,
  onReset,
}: {
  onResize: (delta: number) => void;
  onReset: () => void;
}) {
  const startXRef = useRef(0);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startXRef.current;
      startXRef.current = ev.clientX;
      onResize(delta);
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-mint/30 active:bg-mint/50 transition-colors z-10"
      title="Drag to resize · Double-click to reset"
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
  onDeliveryUpdate,
}: OrderTableProps) {
  const { t, locale } = useTranslation();
  const hasSelection = !!onToggle;
  const colSpan = hasSelection ? 11 : 10;

  // Column widths state
  const [colWidths, setColWidths] = useState<Record<string, number>>(loadColumnWidths);

  function handleColResize(colKey: string, delta: number) {
    setColWidths((prev) => {
      const next = { ...prev, [colKey]: Math.max(MIN_COL_WIDTH, (prev[colKey] ?? DEFAULT_WIDTHS[colKey]) + delta) };
      saveColumnWidths(next);
      return next;
    });
  }

  function handleColReset(colKey: string) {
    setColWidths((prev) => {
      const next = { ...prev, [colKey]: DEFAULT_WIDTHS[colKey] };
      saveColumnWidths(next);
      return next;
    });
  }

  const hl = (text: string | null | undefined) =>
    searchQuery ? highlightText(text, searchQuery) : (text ?? "\u2014");

  const headStyle = (key: string) => ({ width: colWidths[key] ?? DEFAULT_WIDTHS[key], minWidth: MIN_COL_WIDTH });

  return (
    <div className="overflow-x-auto">
    <Table className="table-fixed">
      <colgroup>
        {hasSelection && <col style={{ width: 44 }} />}
        {COLUMN_KEYS.map((key) => (
          <col key={key} style={{ width: colWidths[key] ?? DEFAULT_WIDTHS[key] }} />
        ))}
      </colgroup>
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
          <TableHead className="text-center relative" style={headStyle("score")}>
            {t("orders.table.score")}
            <ResizeHandle onResize={(d) => handleColResize("score", d)} onReset={() => handleColReset("score")} />
          </TableHead>
          <TableHead className="relative" style={headStyle("analysis")}>
            {t("orders.table.analysis")}
            <ResizeHandle onResize={(d) => handleColResize("analysis", d)} onReset={() => handleColReset("analysis")} />
          </TableHead>
          <TableHead className="relative" style={headStyle("client")}>
            {t("orders.table.client")}
            <ResizeHandle onResize={(d) => handleColResize("client", d)} onReset={() => handleColReset("client")} />
          </TableHead>
          <TableHead className="relative" style={headStyle("date")}>
            {t("orders.table.date")}
            <ResizeHandle onResize={(d) => handleColResize("date", d)} onReset={() => handleColReset("date")} />
          </TableHead>
          <TableHead className="relative" style={headStyle("city")}>
            {t("orders.table.city")}
            <ResizeHandle onResize={(d) => handleColResize("city", d)} onReset={() => handleColReset("city")} />
          </TableHead>
          <TableHead className="text-end relative" style={headStyle("amount")}>
            {t("orders.table.amount")}
            <ResizeHandle onResize={(d) => handleColResize("amount", d)} onReset={() => handleColReset("amount")} />
          </TableHead>
          <TableHead className="text-center relative" style={headStyle("decision")}>
            {t("orders.table.decision")}
            <ResizeHandle onResize={(d) => handleColResize("decision", d)} onReset={() => handleColReset("decision")} />
          </TableHead>
          <TableHead className="text-center relative" style={headStyle("pipeline")}>
            {t("orders.table.pipeline")}
            <ResizeHandle onResize={(d) => handleColResize("pipeline", d)} onReset={() => handleColReset("pipeline")} />
          </TableHead>
          <TableHead className="relative" style={headStyle("status")}>
            {t("orders.table.status")}
            <ResizeHandle onResize={(d) => handleColResize("status", d)} onReset={() => handleColReset("status")} />
          </TableHead>
          <TableHead className="relative" style={headStyle("product")}>
            {t("orders.table.product")}
          </TableHead>
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
                <TableCell className="overflow-hidden">
                  <p className="text-xs text-fog truncate">
                    {getTranslatedSummary(order.fraudScore, order.scoreExplanation, t)}
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
                <TableCell>
                  <div className="text-xs text-fog">
                    <p>{new Date(order.createdAt).toLocaleDateString(locale, { day: "2-digit", month: "short" })}</p>
                    <p className="text-mist font-mono">{new Date(order.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </TableCell>
                <TableCell>{hl(order.shippingCity)}</TableCell>
                <TableCell className="text-end font-mono">
                  {formatCurrency(order.total, locale)}
                </TableCell>
                <TableCell className="text-center">
                  <DecisionBadge
                    decision={order.overrideDecision ?? order.decision}
                    size="sm"
                  />
                  {order.overrideDecision && (
                    <span
                      className="ms-1 text-[10px] text-mist"
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
                        <Countdown deadline={order.reviewDeadline} />
                      )}
                  </div>
                </TableCell>
                <TableCell
                  className="text-sm text-fog"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onDeliveryUpdate ? (
                    <select
                      value={order.deliveryStatus}
                      onChange={(e) => onDeliveryUpdate(order.id, e.target.value)}
                      className="bg-white border border-silk rounded-xs px-1.5 py-0.5 text-xs text-midnight cursor-pointer hover:border-mint focus:ring-1 focus:ring-mint/40 focus:outline-none"
                    >
                      <option value="pending">{deliveryLabel("pending", locale)}</option>
                      <option value="shipped">{deliveryLabel("shipped", locale)}</option>
                      <option value="delivered">{deliveryLabel("delivered", locale)}</option>
                      <option value="returned">{deliveryLabel("returned", locale)}</option>
                      <option value="cancelled">{deliveryLabel("cancelled", locale)}</option>
                    </select>
                  ) : (
                    deliveryLabel(order.deliveryStatus, locale)
                  )}
                </TableCell>
                <TableCell className="truncate text-sm text-fog">
                  {hl(order.productName)}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
    </div>
  );
}
