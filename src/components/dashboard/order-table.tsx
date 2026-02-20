"use client";

import { useState, useEffect } from "react";
import { formatDH } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { DecisionBadge } from "./decision-badge";
import { PipelineBadge } from "./pipeline-badge";
import { highlightText } from "@/lib/highlight";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CountdownBadge({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("expiré");
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
  }, [deadline]);

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
}

const deliveryLabels: Record<string, string> = {
  pending: "En attente",
  shipped: "Exp\u00E9di\u00E9",
  delivered: "Livr\u00E9",
  returned: "Retourn\u00E9",
  cancelled: "Annul\u00E9",
};

export function OrderTable({ orders, onRowClick, searchQuery = "" }: OrderTableProps) {
  const hl = (text: string | null | undefined) =>
    searchQuery ? highlightText(text, searchQuery) : (text ?? "\u2014");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-[70px]">Score</TableHead>
          <TableHead>Analyse</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Ville</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="text-center">Décision</TableHead>
          <TableHead className="text-center">Pipeline</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Produit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-fog py-8">
              Aucune commande trouvée
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-snow/50 transition-colors"
              onClick={() => onRowClick?.(order.id)}
            >
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
                {formatDH(order.total)}
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
                  {order.pipelineStatus === "needs_review" && order.reviewDeadline && (
                    <CountdownBadge deadline={order.reviewDeadline} />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-fog">
                {deliveryLabels[order.deliveryStatus] ?? order.deliveryStatus}
              </TableCell>
              <TableCell className="max-w-[160px] truncate text-sm text-fog">
                {hl(order.productName)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
