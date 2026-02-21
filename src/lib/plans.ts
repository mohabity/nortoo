// ═══════════════════════════════════════════════════════════
// PLANS — Source unique de vérité pour les plans nortoo
// Features, limites, helpers — tout est dérivé de ce fichier
// ═══════════════════════════════════════════════════════════

export type PlanId = "trial" | "starter" | "pro" | "scale";

export type FeatureId =
  | "scoring"
  | "dashboard"
  | "search"
  | "csv_export"
  | "bulk_actions"
  | "simulation"
  | "custom_weights"
  | "pdf_report"
  | "multi_users"
  | "roles";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;            // DH/mois (0 = gratuit)
  label: string;            // "299 DH/mois"
  ordersPerMonth: number;   // 0 = illimité
  maxUsers: number;
  bulkBatchLimit: number;   // 0 = illimité
  features: FeatureId[];
}

// ── Plan Configurations ──

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  trial: {
    id: "trial",
    name: "Essai",
    price: 0,
    label: "14 jours gratuits",
    ordersPerMonth: 50,
    maxUsers: 1,
    bulkBatchLimit: 0,
    features: ["scoring", "dashboard", "search"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 299,
    label: "299 DH/mois",
    ordersPerMonth: 500,
    maxUsers: 1,
    bulkBatchLimit: 20,
    features: ["scoring", "dashboard", "search", "csv_export", "bulk_actions"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 699,
    label: "699 DH/mois",
    ordersPerMonth: 2000,
    maxUsers: 3,
    bulkBatchLimit: 50,
    features: [
      "scoring", "dashboard", "search",
      "csv_export", "bulk_actions",
      "simulation", "custom_weights", "pdf_report",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 1499,
    label: "1 499 DH/mois",
    ordersPerMonth: 0, // illimité
    maxUsers: 10,
    bulkBatchLimit: 0, // illimité
    features: [
      "scoring", "dashboard", "search",
      "csv_export", "bulk_actions",
      "simulation", "custom_weights", "pdf_report",
      "multi_users", "roles",
    ],
  },
};

// ── Plan Order (for comparison) ──

export const PLAN_ORDER: PlanId[] = ["trial", "starter", "pro", "scale"];

// ── Helpers ──

/** Get plan config, defaults to trial for unknown plans */
export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIGS[plan as PlanId] ?? PLAN_CONFIGS.trial;
}

/** Check if a plan has a specific feature */
export function hasFeature(plan: string, feature: FeatureId): boolean {
  return getPlanConfig(plan).features.includes(feature);
}

/** Get max users for a plan */
export function getUserLimit(plan: string): number {
  return getPlanConfig(plan).maxUsers;
}

/** Get bulk batch limit (0 = unlimited) */
export function getBulkLimit(plan: string): number {
  return getPlanConfig(plan).bulkBatchLimit;
}

/** Get orders per month limit (0 = unlimited) */
export function getOrderLimit(plan: string): number {
  return getPlanConfig(plan).ordersPerMonth;
}

/** Check if trial has expired */
export function isTrialExpired(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false; // no trial tracking = not expired
  return new Date() > new Date(trialEndsAt);
}

/** Days remaining in trial (0 if expired or no trial) */
export function trialDaysRemaining(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Find the minimum plan required for a feature */
export function minimumPlanFor(feature: FeatureId): PlanId {
  for (const planId of PLAN_ORDER) {
    if (PLAN_CONFIGS[planId].features.includes(feature)) {
      return planId;
    }
  }
  return "scale"; // fallback
}

/** Check order limit usage */
export function checkOrderLimit(
  plan: string,
  currentMonthOrders: number
): { overLimit: boolean; current: number; limit: number; percent: number } {
  const limit = getOrderLimit(plan);
  if (limit === 0) {
    return { overLimit: false, current: currentMonthOrders, limit: 0, percent: 0 };
  }
  const percent = Math.round((currentMonthOrders / limit) * 100);
  return {
    overLimit: currentMonthOrders >= limit,
    current: currentMonthOrders,
    limit,
    percent: Math.min(percent, 100),
  };
}

// ── Feature Labels (French — for i18n use t("features.{id}") instead) ──

export const FEATURE_LABELS: Record<FeatureId, string> = {
  scoring: "Scoring anti-fraude",
  dashboard: "Tableau de bord",
  search: "Recherche commandes",
  csv_export: "Export CSV",
  bulk_actions: "Actions en lot",
  simulation: "Simulation de scoring",
  custom_weights: "Pondération personnalisée",
  pdf_report: "Rapport PDF mensuel",
  multi_users: "Multi-utilisateurs",
  roles: "Gestion des rôles",
};

// ── Plan Labels (French — for i18n use t("plans.{id}.name") and t("plans.{id}.label") instead) ──

export const PLAN_LABELS: Record<PlanId, string> = {
  trial: "Essai",
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
};

export const PLAN_DESCRIPTIONS: Record<PlanId, string> = {
  trial: "14 jours gratuits",
  starter: "299 DH/mois",
  pro: "699 DH/mois",
  scale: "1 499 DH/mois",
};
