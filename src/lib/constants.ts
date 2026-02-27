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
