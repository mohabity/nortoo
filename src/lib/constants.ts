// ═══ Time Durations (milliseconds) ═══
export const MS_MINUTE = 60 * 1000;
export const MS_HOUR = 60 * MS_MINUTE;
export const MS_DAY = 24 * MS_HOUR;
export const MS_WEEK = 7 * MS_DAY;
export const MS_30_DAYS = 30 * MS_DAY;

// ═══ Time Durations (seconds) ═══
export const SEC_DAY = 24 * 60 * 60;
export const SEC_30_DAYS = 30 * SEC_DAY;

// ═══ Request Limits ═══
export const MAX_BODY_SIZE = 1_048_576; // 1 MB

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
