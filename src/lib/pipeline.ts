/**
 * Pipeline Orchestration Engine — Pure function.
 * Determines what happens after an order is scored.
 * No DB access — all side effects are in the caller.
 */

import { calculateEscalation, type EscalationConfig } from "@/lib/escalation";

export type PipelineStatus =
  | "pending"
  | "auto_shipped"
  | "needs_review"
  | "escalated"
  | "auto_blocked"
  | "merchant_override";

export type NotificationType =
  | "order_auto_shipped"
  | "order_needs_review"
  | "order_flagged"
  | "order_auto_blocked"
  | "escalation"
  | "daily_summary";

export type Severity = "info" | "warning" | "critical";

export interface PipelineInput {
  score: number;
  decision: string;
  total: number;
  merchantSettings: {
    verifyThreshold: number;
    flagThreshold: number;
    blockThreshold: number;
    autoBlockEnabled: boolean;
    escalationConfig?: EscalationConfig | null;
  };
  orderRef: string;
  customerName?: string;
}

export interface PipelineResult {
  status: PipelineStatus;
  notificationType: NotificationType;
  severity: Severity;
  reviewDeadline: Date | null;
  escalationPriority: number | null;
  title: string;
  message: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function executePipeline(input: PipelineInput): PipelineResult {
  const { score, decision, total, merchantSettings, orderRef, customerName } = input;
  const { verifyThreshold, flagThreshold, blockThreshold, autoBlockEnabled, escalationConfig } =
    merchantSettings;
  const name = customerName ?? "Client inconnu";

  // Ship zone: score <= verifyThreshold
  if (score <= verifyThreshold) {
    return {
      status: "auto_shipped",
      notificationType: "order_auto_shipped",
      severity: "info",
      reviewDeadline: null,
      escalationPriority: null,
      title: `Commande ${orderRef} — expédition auto`,
      message: `Score ${score}/100 — ${name}. Risque faible, expédition recommandée.`,
    };
  }

  // Use escalation engine for dynamic deadlines
  const escalation = calculateEscalation(decision, total, escalationConfig);

  // Verify zone: verifyThreshold < score <= flagThreshold
  if (score <= flagThreshold) {
    const delayMin = escalation?.delayMinutes ?? 120;
    const deadline = new Date(Date.now() + delayMin * 60 * 1000);
    const delayLabel = delayMin >= 60 ? `${Math.round(delayMin / 60)}h` : `${delayMin} min`;
    return {
      status: "needs_review",
      notificationType: "order_needs_review",
      severity: escalation?.severity ?? "warning",
      reviewDeadline: deadline,
      escalationPriority: escalation?.priority ?? null,
      title: `Commande ${orderRef} à vérifier`,
      message: `Score ${score}/100 — ${name}. Vérification requise avant ${formatTime(deadline)}. ${delayLabel} pour agir.`,
    };
  }

  // Flag zone: flagThreshold < score <= blockThreshold
  if (score <= blockThreshold) {
    const delayMin = escalation?.delayMinutes ?? 60;
    const deadline = new Date(Date.now() + delayMin * 60 * 1000);
    const delayLabel = delayMin >= 60 ? `${Math.round(delayMin / 60)}h` : `${delayMin} min`;
    return {
      status: "needs_review",
      notificationType: "order_flagged",
      severity: escalation?.severity ?? "warning",
      reviewDeadline: deadline,
      escalationPriority: escalation?.priority ?? null,
      title: `Commande ${orderRef} signalée — risque élevé`,
      message: `Score ${score}/100 — ${name}. Action requise sous ${delayLabel} avant ${formatTime(deadline)}.`,
    };
  }

  // Block zone: score > blockThreshold
  if (autoBlockEnabled) {
    return {
      status: "auto_blocked",
      notificationType: "order_auto_blocked",
      severity: "critical",
      reviewDeadline: null,
      escalationPriority: null,
      title: `Commande ${orderRef} bloquée automatiquement`,
      message: `Score ${score}/100 — ${name}. Blocage automatique activé.`,
    };
  }

  // Block zone but autoBlock disabled — use escalation engine
  const delayMin = escalation?.delayMinutes ?? 30;
  const deadline = new Date(Date.now() + delayMin * 60 * 1000);
  const delayLabel = delayMin >= 60 ? `${Math.round(delayMin / 60)}h` : `${delayMin} min`;
  return {
    status: "needs_review",
    notificationType: "order_flagged",
    severity: escalation?.severity ?? "critical",
    reviewDeadline: deadline,
    escalationPriority: escalation?.priority ?? null,
    title: `Commande ${orderRef} — risque critique`,
    message: `Score ${score}/100 — ${name}. Blocage auto désactivé. Révision urgente dans ${delayLabel}.`,
  };
}
