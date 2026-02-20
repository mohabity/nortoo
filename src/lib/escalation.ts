/**
 * Dynamic escalation engine — value-based escalation deadlines.
 * Higher-value orders escalate faster. Decision severity matters too.
 */

// ── Escalation rule definition ──

export interface EscalationRule {
  amountMin: number;
  amountMax: number;
  decision: string; // verify | flag | block
  delayMinutes: number;
  severity: "info" | "warning" | "critical";
  priority: number; // 1 = highest
}

// ── Default escalation matrix ──

export const DEFAULT_ESCALATION_MATRIX: EscalationRule[] = [
  // BLOCK — most urgent
  { amountMin: 1000, amountMax: Infinity, decision: "block", delayMinutes: 15, severity: "critical", priority: 1 },
  { amountMin: 500, amountMax: 999, decision: "block", delayMinutes: 30, severity: "critical", priority: 2 },
  { amountMin: 200, amountMax: 499, decision: "block", delayMinutes: 60, severity: "warning", priority: 3 },
  { amountMin: 0, amountMax: 199, decision: "block", delayMinutes: 120, severity: "warning", priority: 4 },

  // FLAG
  { amountMin: 1000, amountMax: Infinity, decision: "flag", delayMinutes: 30, severity: "critical", priority: 1 },
  { amountMin: 500, amountMax: 999, decision: "flag", delayMinutes: 60, severity: "warning", priority: 2 },
  { amountMin: 200, amountMax: 499, decision: "flag", delayMinutes: 120, severity: "warning", priority: 3 },
  { amountMin: 0, amountMax: 199, decision: "flag", delayMinutes: 240, severity: "info", priority: 4 },

  // VERIFY
  { amountMin: 1000, amountMax: Infinity, decision: "verify", delayMinutes: 60, severity: "warning", priority: 2 },
  { amountMin: 500, amountMax: 999, decision: "verify", delayMinutes: 120, severity: "warning", priority: 3 },
  { amountMin: 200, amountMax: 499, decision: "verify", delayMinutes: 240, severity: "info", priority: 4 },
  { amountMin: 0, amountMax: 199, decision: "verify", delayMinutes: 480, severity: "info", priority: 5 },
];

// ── Serializable config (stored as JSON in merchant settings) ──

export interface EscalationConfig {
  // [decision][amountBracket] = delayMinutes
  // Brackets: "high" (>=1000), "medium" (500-999), "low" (200-499), "minimal" (<200)
  block: { high: number; medium: number; low: number; minimal: number };
  flag: { high: number; medium: number; low: number; minimal: number };
  verify: { high: number; medium: number; low: number; minimal: number };
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  block: { high: 15, medium: 30, low: 60, minimal: 120 },
  flag: { high: 30, medium: 60, low: 120, minimal: 240 },
  verify: { high: 60, medium: 120, low: 240, minimal: 480 },
};

export const PRESET_REACTIVE: EscalationConfig = {
  block: { high: 8, medium: 15, low: 30, minimal: 60 },
  flag: { high: 15, medium: 30, low: 60, minimal: 120 },
  verify: { high: 30, medium: 60, low: 120, minimal: 240 },
};

export const PRESET_RELAXED: EscalationConfig = {
  block: { high: 30, medium: 60, low: 120, minimal: 240 },
  flag: { high: 60, medium: 120, low: 240, minimal: 480 },
  verify: { high: 120, medium: 240, low: 480, minimal: 960 },
};

// ── Helpers ──

function getAmountBracket(amountDH: number): "high" | "medium" | "low" | "minimal" {
  if (amountDH >= 1000) return "high";
  if (amountDH >= 500) return "medium";
  if (amountDH >= 200) return "low";
  return "minimal";
}

function getSeverity(decision: string, bracket: string): "info" | "warning" | "critical" {
  if (decision === "block") {
    return bracket === "high" || bracket === "medium" ? "critical" : "warning";
  }
  if (decision === "flag") {
    if (bracket === "high") return "critical";
    if (bracket === "medium" || bracket === "low") return "warning";
    return "info";
  }
  // verify
  if (bracket === "high" || bracket === "medium") return "warning";
  return "info";
}

function getPriority(decision: string, bracket: string): number {
  const bracketOrder = { high: 0, medium: 1, low: 2, minimal: 3 };
  const decisionOrder = { block: 0, flag: 1, verify: 2 };
  const d = decisionOrder[decision as keyof typeof decisionOrder] ?? 2;
  const b = bracketOrder[bracket as keyof typeof bracketOrder] ?? 3;
  return d + b + 1; // 1-based
}

// ── Main calculator ──

export interface EscalationResult {
  deadlineMs: number; // absolute timestamp in ms
  delayMinutes: number;
  priority: number;
  severity: "info" | "warning" | "critical";
  bracket: string;
}

/**
 * Calculate escalation deadline for an order.
 * Returns null for "ship" decisions (no escalation needed).
 */
export function calculateEscalation(
  decision: string,
  amountDH: number,
  config?: EscalationConfig | null
): EscalationResult | null {
  if (decision === "ship") return null;

  const cfg = config ?? DEFAULT_ESCALATION_CONFIG;
  const bracket = getAmountBracket(amountDH);

  const decisionConfig = cfg[decision as keyof EscalationConfig];
  if (!decisionConfig) return null;

  const delayMinutes = decisionConfig[bracket];
  const severity = getSeverity(decision, bracket);
  const priority = getPriority(decision, bracket);

  return {
    deadlineMs: Date.now() + delayMinutes * 60 * 1000,
    delayMinutes,
    priority,
    severity,
    bracket,
  };
}

/**
 * Get the escalation rule for an existing order (for notifications).
 */
export function getEscalationContext(
  decision: string,
  amountDH: number,
  config?: EscalationConfig | null
): { delayMinutes: number; severity: "info" | "warning" | "critical"; priority: number } {
  const result = calculateEscalation(decision, amountDH, config);
  return result ?? { delayMinutes: 120, severity: "warning", priority: 5 };
}

/**
 * Build a matrix from config for display (convert config to rules array).
 */
export function configToMatrix(config: EscalationConfig): EscalationRule[] {
  const rules: EscalationRule[] = [];
  const brackets = [
    { key: "high" as const, min: 1000, max: Infinity },
    { key: "medium" as const, min: 500, max: 999 },
    { key: "low" as const, min: 200, max: 499 },
    { key: "minimal" as const, min: 0, max: 199 },
  ];

  for (const decision of ["block", "flag", "verify"] as const) {
    for (const bracket of brackets) {
      const delayMinutes = config[decision][bracket.key];
      rules.push({
        amountMin: bracket.min,
        amountMax: bracket.max,
        decision,
        delayMinutes,
        severity: getSeverity(decision, bracket.key),
        priority: getPriority(decision, bracket.key),
      });
    }
  }

  return rules;
}
