// ═══ Plan Pricing ═══
// NOTE: Canonical plan config is in src/lib/plans.ts — this is kept for backward compat
export const PLANS = {
  trial: { name: "Essai", price: 0, orders: 50, label: "14 jours gratuits" },
  starter: { name: "Starter", price: 299, orders: 500, label: "299 DH/mois" },
  pro: { name: "Pro", price: 699, orders: 2000, label: "699 DH/mois" },
  scale: { name: "Scale", price: 1499, orders: 10000, label: "1 499 DH/mois" },
} as const;

// ═══ Scoring Presets (French names — for i18n use t("presets.{id}.name") instead) ═══
export const SCORING_PRESETS = {
  conservative: {
    name: "Conservateur",
    description: "Bloque plus agressivement — pour marchands à forte marge",
    verify: 25,
    flag: 55,
    block: 75,
  },
  balanced: {
    name: "Équilibré",
    description: "Configuration par défaut — bon compromis",
    verify: 31,
    flag: 66,
    block: 86,
  },
  permissive: {
    name: "Permissif",
    description: "Bloque uniquement les cas extrêmes — pour faible marge",
    verify: 45,
    flag: 80,
    block: 95,
  },
} as const;

// ═══ Risky Zones ═══
export const RISKY_ZONES = [
  "Taza", "Ouarzazate", "Errachidia", "Sidi Slimane",
  "Khouribga", "Sidi Kacem", "Guelmim", "Tan-Tan", "Tiznit",
];

// ═══ Safe Cities ═══
export const SAFE_CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir",
  "Fès", "Meknès", "Kénitra", "Oujda", "Tétouan",
];

// ═══ User Limits per Plan ═══
// NOTE: Canonical limits are in src/lib/plans.ts — this is kept for backward compat
export const USER_LIMITS: Record<string, number> = {
  trial: 1,
  starter: 1,
  pro: 3,
  scale: 10,
};

// ═══ Data Retention ═══
export const DEFAULT_RETENTION_MONTHS = 24; // Art. 3e Loi 09-08
export const DATA_RIGHTS_RESPONSE_DAYS = 30; // Max days to respond to Art. 7-9 requests
