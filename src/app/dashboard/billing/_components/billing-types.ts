import type { PlanId, FeatureId } from "@/lib/plans";

export interface PlanApiData {
  plan: PlanId;
  config: {
    name: string;
    price: number;
    label: string;
    ordersPerMonth: number;
    maxUsers: number;
    features: FeatureId[];
  };
  usage: {
    orders: { current: number; limit: number; percent: number };
    users: { current: number; limit: number };
  };
  pendingPlanDowngrade: string | null;
  trial: { daysRemaining: number; expiresAt: string } | null;
  currentMonthStart: string | null;
}

export interface BillingInfo {
  billingName: string | null;
  billingAddress: string | null;
  billingICE: string | null;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  period: string;
  planAtInvoice: string;
  amountHT: number;
  tvaRate: number;
  amountTVA: number;
  amountTTC: number;
  status: string;
  paidAt: string | null;
  paidNote: string | null;
  dueDate: string;
  createdAt: string;
}

export interface PendingUpgrade {
  pending: boolean;
  invoice?: {
    id: number;
    invoiceNumber: string;
    plan: string;
    planName: string;
    amountHT: number;
    amountTVA: number;
    amountTTC: number;
    dueDate: string | null;
    createdAt: string;
  };
}

export interface UpgradeConfirmation {
  invoiceNumber: string;
  plan: string;
  planName: string;
  amountHT: number;
  amountTVA: number;
  amountTTC: number;
  dueDate: string;
}

export const PLAN_CARD_BORDERS: Record<PlanId, string> = {
  trial: "border-silk",
  starter: "border-mint/40",
  pro: "border-ocean/40",
  scale: "border-violet/40",
};

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-sun/10 text-sun-deep border-sun/30",
  paid: "bg-mint/10 text-mint-deep border-mint/30",
  overdue: "bg-rose/10 text-rose border-rose/30",
  cancelled: "bg-fog/10 text-fog border-fog/30",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

export function formatAmountDH(centimes: number): string {
  const dh = centimes / 100;
  return dh.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}
