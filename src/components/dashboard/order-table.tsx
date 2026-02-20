"use client";

import { formatDH } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { DecisionBadge } from "./decision-badge";
import { PipelineBadge } from "./pipeline-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  createdAt: string;
}

interface OrderTableProps {
  orders: OrderRow[];
  onRowClick?: (orderId: number) => void;
}

const deliveryLabels: Record<string, string> = {
  pending: "En attente",
  shipped: "Expédié",
  delivered: "Livré",
  returned: "Retourné",
  cancelled: "Annulé",
};

export function OrderTable({ orders, onRowClick }: OrderTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-[70px]">Score</TableHead>
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
            <TableCell colSpan={8} className="text-center text-ink-3 py-8">
              Aucune commande trouvée
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-sand/50 transition-colors"
              onClick={() => onRowClick?.(order.id)}
            >
              <TableCell className="text-center">
                <ScoreBadge score={order.fraudScore} size="sm" />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-ink-1">{order.customerName ?? "—"}</p>
                  {order.customerPhoneLast4 && (
                    <p className="text-xs text-ink-4">***{order.customerPhoneLast4}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>{order.shippingCity ?? "—"}</TableCell>
              <TableCell className="text-right font-mono">{formatDH(order.total)}</TableCell>
              <TableCell className="text-center">
                <DecisionBadge decision={order.overrideDecision ?? order.decision} size="sm" />
                {order.overrideDecision && (
                  <span className="ml-1 text-[10px] text-ink-4" title="Override actif">*</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <PipelineBadge status={order.pipelineStatus} size="sm" />
              </TableCell>
              <TableCell className="text-sm text-ink-3">
                {deliveryLabels[order.deliveryStatus] ?? order.deliveryStatus}
              </TableCell>
              <TableCell className="max-w-[160px] truncate text-sm text-ink-3">
                {order.productName ?? "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
