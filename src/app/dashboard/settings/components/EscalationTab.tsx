"use client";

import { useEffect, useState } from "react";
import { Timer, Loader2, Save, RotateCcw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BaseTabProps } from "../types";
import type { EscalationConfig } from "@/lib/escalation";
import {
  DEFAULT_ESCALATION_CONFIG,
  PRESET_REACTIVE,
  PRESET_RELAXED,
} from "@/lib/escalation";

const BRACKET_LABELS: Record<string, string> = {
  high: "\u2265 1000 DH",
  medium: "500-999 DH",
  low: "200-499 DH",
  minimal: "< 200 DH",
};

const DECISION_LABELS: Record<string, string> = {
  block: "Bloquer",
  flag: "Signaler",
  verify: "V\u00E9rifier",
};

const DECISION_COLORS: Record<string, string> = {
  block: "text-violet",
  flag: "text-rose",
  verify: "text-amber",
};

function parseConfig(raw: string | null): EscalationConfig {
  if (!raw) return DEFAULT_ESCALATION_CONFIG;
  try {
    return JSON.parse(raw) as EscalationConfig;
  } catch {
    return DEFAULT_ESCALATION_CONFIG;
  }
}

function configsEqual(a: EscalationConfig, b: EscalationConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatDelay(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
  }
  return `${minutes}min`;
}

export function EscalationTab({ settings, onRefresh, onToast }: BaseTabProps) {
  const [config, setConfig] = useState<EscalationConfig>(
    parseConfig(settings.escalationConfig)
  );
  const [saving, setSaving] = useState(false);

  const savedConfig = parseConfig(settings.escalationConfig);

  useEffect(() => {
    setConfig(parseConfig(settings.escalationConfig));
  }, [settings.escalationConfig]);

  const hasChanges = !configsEqual(config, savedConfig);

  function updateValue(
    decision: "block" | "flag" | "verify",
    bracket: "high" | "medium" | "low" | "minimal",
    value: number
  ) {
    setConfig((prev) => ({
      ...prev,
      [decision]: { ...prev[decision], [bracket]: Math.max(1, Math.min(1440, value)) },
    }));
  }

  function applyPreset(preset: EscalationConfig) {
    setConfig(preset);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalationConfig: config }),
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", "Configuration d'escalade sauvegard\u00E9e");
      } else {
        onToast("error", "Erreur lors de la sauvegarde");
      }
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-light/50 p-2">
              <Timer className="h-5 w-5 text-violet" />
            </div>
            <div>
              <CardTitle>Escalade dynamique</CardTitle>
              <CardDescription>
                Les commandes de valeur \u00E9lev\u00E9e escaladent plus vite.
                Configurez les d\u00E9lais par montant et d\u00E9cision.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pr\u00E9r\u00E9glages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={configsEqual(config, PRESET_REACTIVE) ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(PRESET_REACTIVE)}
            >
              R\u00E9actif
            </Button>
            <Button
              variant={configsEqual(config, DEFAULT_ESCALATION_CONFIG) ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(DEFAULT_ESCALATION_CONFIG)}
            >
              \u00C9quilibr\u00E9
            </Button>
            <Button
              variant={configsEqual(config, PRESET_RELAXED) ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(PRESET_RELAXED)}
            >
              Relax\u00E9
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfig(savedConfig)}
              className="text-mist"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              R\u00E9initialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Matrice d&apos;escalade (d\u00E9lais en minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silk">
                  <th className="text-left py-2 pr-3 text-xs font-medium text-fog">Montant</th>
                  {(["block", "flag", "verify"] as const).map((d) => (
                    <th key={d} className={`text-center py-2 px-2 text-xs font-medium ${DECISION_COLORS[d]}`}>
                      {DECISION_LABELS[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(["high", "medium", "low", "minimal"] as const).map((bracket) => (
                  <tr key={bracket} className="border-b border-silk/50">
                    <td className="py-2 pr-3 text-xs text-fog font-mono whitespace-nowrap">
                      {BRACKET_LABELS[bracket]}
                    </td>
                    {(["block", "flag", "verify"] as const).map((decision) => (
                      <td key={decision} className="py-2 px-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={config[decision][bracket]}
                            onChange={(e) =>
                              updateValue(decision, bracket, parseInt(e.target.value) || 1)
                            }
                            className="w-16 rounded border border-silk px-2 py-1 text-center text-xs font-mono focus:outline-none focus:ring-1 focus:ring-violet/30"
                          />
                          <span className="text-[10px] text-mist">
                            {formatDelay(config[decision][bracket])}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end rounded-lg border border-silk bg-white px-4 py-3 shadow-md">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Sauvegarder
          </Button>
        </div>
      )}
    </div>
  );
}
