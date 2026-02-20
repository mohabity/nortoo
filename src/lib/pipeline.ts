/**
 * Pipeline Orchestration Engine — Pure function.
 * Determines what happens after an order is scored.
 * No DB access — all side effects are in the caller.
 */

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
  merchantSettings: {
    verifyThreshold: number;
    flagThreshold: number;
    blockThreshold: number;
    autoBlockEnabled: boolean;
  };
  orderRef: string;
  customerName?: string;
}

export interface PipelineResult {
  status: PipelineStatus;
  notificationType: NotificationType;
  severity: Severity;
  reviewDeadline: Date | null;
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
  const { score, merchantSettings, orderRef, customerName } = input;
  const { verifyThreshold, flagThreshold, blockThreshold, autoBlockEnabled } =
    merchantSettings;
  const name = customerName ?? "Client inconnu";
  const now = Date.now();

  // Ship zone: score <= verifyThreshold
  if (score <= verifyThreshold) {
    return {
      status: "auto_shipped",
      notificationType: "order_auto_shipped",
      severity: "info",
      reviewDeadline: null,
      title: `Commande ${orderRef} — expédition auto`,
      message: `Score ${score}/100 — ${name}. Risque faible, expédition recommandée.`,
    };
  }

  // Verify zone: verifyThreshold < score <= flagThreshold
  if (score <= flagThreshold) {
    const deadline = new Date(now + 2 * 60 * 60 * 1000);
    return {
      status: "needs_review",
      notificationType: "order_needs_review",
      severity: "warning",
      reviewDeadline: deadline,
      title: `Commande ${orderRef} à vérifier`,
      message: `Score ${score}/100 — ${name}. Vérification requise avant ${formatTime(deadline)}. 2h pour agir.`,
    };
  }

  // Flag zone: flagThreshold < score <= blockThreshold
  if (score <= blockThreshold) {
    const deadline = new Date(now + 1 * 60 * 60 * 1000);
    return {
      status: "needs_review",
      notificationType: "order_flagged",
      severity: "warning",
      reviewDeadline: deadline,
      title: `Commande ${orderRef} signalée — risque élevé`,
      message: `Score ${score}/100 — ${name}. Action requise sous 1h avant ${formatTime(deadline)}.`,
    };
  }

  // Block zone: score > blockThreshold
  if (autoBlockEnabled) {
    return {
      status: "auto_blocked",
      notificationType: "order_auto_blocked",
      severity: "critical",
      reviewDeadline: null,
      title: `Commande ${orderRef} bloquée automatiquement`,
      message: `Score ${score}/100 — ${name}. Blocage automatique activé.`,
    };
  }

  // Block zone but autoBlock disabled
  const deadline = new Date(now + 30 * 60 * 1000);
  return {
    status: "needs_review",
    notificationType: "order_flagged",
    severity: "critical",
    reviewDeadline: deadline,
    title: `Commande ${orderRef} — risque critique`,
    message: `Score ${score}/100 — ${name}. Blocage auto désactivé. Révision urgente dans 30 min.`,
  };
}
