"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Key,
  Copy,
  Check,
  Sliders,
  Loader2,
  Save,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThresholdBar } from "@/components/dashboard/threshold-bar";
import { PLANS, SCORING_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Types ──

interface MerchantSettings {
  name: string;
  domain: string | null;
  plan: string;
  apiKey: string | null;
  verifyThreshold: number;
  flagThreshold: number;
  blockThreshold: number;
  autoBlockEnabled: boolean;
  dataRetentionMonths: number;
  cndpDeclarationRef: string | null;
  consentRecordedAt: string | null;
}

// ── Page ──

export default function SettingsPage() {
  // Server data
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable values
  const [verify, setVerify] = useState(31);
  const [flag, setFlag] = useState(66);
  const [block, setBlock] = useState(86);
  const [autoBlock, setAutoBlock] = useState(true);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Copy state
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // ── Fetch settings ──
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.data) {
        const d = json.data as MerchantSettings;
        setSettings(d);
        setVerify(d.verifyThreshold);
        setFlag(d.flagThreshold);
        setBlock(d.blockThreshold);
        setAutoBlock(d.autoBlockEnabled);
      }
    } catch {
      // silently fail, will show defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Has changes ──
  const hasChanges =
    settings !== null &&
    (verify !== settings.verifyThreshold ||
      flag !== settings.flagThreshold ||
      block !== settings.blockThreshold ||
      autoBlock !== settings.autoBlockEnabled);

  // ── Save ──
  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifyThreshold: verify,
          flagThreshold: flag,
          blockThreshold: block,
          autoBlockEnabled: autoBlock,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data as MerchantSettings;
          setSettings(d);
          setVerify(d.verifyThreshold);
          setFlag(d.flagThreshold);
          setBlock(d.blockThreshold);
          setAutoBlock(d.autoBlockEnabled);
        }
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 4000);
      }
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } finally {
      setSaving(false);
    }
  }

  // ── Apply preset ──
  function applyPreset(preset: keyof typeof SCORING_PRESETS) {
    const p = SCORING_PRESETS[preset];
    setVerify(p.verify);
    setFlag(p.flag);
    setBlock(p.block);
  }

  // ── Check active preset ──
  function isActivePreset(preset: (typeof SCORING_PRESETS)[keyof typeof SCORING_PRESETS]) {
    return (
      verify === preset.verify &&
      flag === preset.flag &&
      block === preset.block
    );
  }

  // ── Slider clamping ──
  function handleVerifyChange(v: number) {
    const clamped = Math.min(v, flag - 1);
    setVerify(Math.max(10, clamped));
  }
  function handleFlagChange(v: number) {
    const clamped = Math.min(Math.max(v, verify + 1), block - 1);
    setFlag(clamped);
  }
  function handleBlockChange(v: number) {
    const clamped = Math.max(v, flag + 1);
    setBlock(Math.min(99, clamped));
  }

  // ── Copy helpers ──
  function copyToClipboard(text: string, type: "key" | "url") {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }

  // ── Plan info ──
  const planKey = (settings?.plan ?? "trial") as keyof typeof PLANS;
  const planInfo = PLANS[planKey] ?? PLANS.trial;

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/ingest`
      : "/api/webhook/ingest";

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
        <span className="ml-2 text-sm text-ink-3">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-sora text-2xl font-bold text-ink-1">Paramètres</h1>
        <p className="text-sm text-ink-3">
          Configuration du scoring et des intégrations
        </p>
      </div>

      {/* ═══ Section A — Intégration ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-sun" />
            <div>
              <CardTitle className="text-base">Intégration</CardTitle>
              <CardDescription>
                Connectez votre boutique via API key
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-ink-2">
              Clé API
            </label>
            <p className="text-xs text-ink-4 mb-2">
              Collez cette clé dans la config webhook de votre boutique YouCan
              ou Shopify
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-sm border border-border bg-sand px-3 py-2 font-mono text-sm text-ink-2 select-all overflow-x-auto">
                {settings?.apiKey ?? "—"}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  settings?.apiKey &&
                  copyToClipboard(settings.apiKey, "key")
                }
                disabled={!settings?.apiKey}
              >
                {copiedKey ? (
                  <Check className="h-4 w-4 text-mint-deep" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="text-sm font-medium text-ink-2">
              URL du webhook
            </label>
            <p className="text-xs text-ink-4 mb-2">
              Configurez cette URL comme endpoint webhook dans votre plateforme
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-sm border border-border bg-sand px-3 py-2 font-mono text-sm text-ink-2 select-all overflow-x-auto">
                {webhookUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl, "url")}
              >
                {copiedUrl ? (
                  <Check className="h-4 w-4 text-mint-deep" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Plan */}
          <div className="flex items-center justify-between rounded-sm border border-border p-3">
            <div>
              <p className="text-sm font-medium text-ink-1">Plan actuel</p>
              <p className="text-xs text-ink-4">
                {planInfo.orders.toLocaleString("fr-FR")} commandes/mois
              </p>
            </div>
            <Badge variant="sun">
              {planInfo.name} — {planInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Section B — Seuils de scoring ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-ocean" />
            <div>
              <CardTitle className="text-base">Seuils de scoring</CardTitle>
              <CardDescription>
                Ajustez les seuils de décision pour le scoring automatique
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Threshold bar visualization */}
          <ThresholdBar verify={verify} flag={flag} block={block} />

          {/* Sliders */}
          <div className="space-y-5">
            {/* Verify slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-2">
                    Seuil Vérifier
                  </p>
                  <p className="text-xs text-ink-4">
                    Score au-dessus → vérification requise
                  </p>
                </div>
                <span className="font-mono text-lg font-bold text-sun-deep w-10 text-right">
                  {verify}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={flag - 1}
                value={verify}
                onChange={(e) => handleVerifyChange(Number(e.target.value))}
                className="slider slider-sun w-full"
              />
            </div>

            {/* Flag slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-2">
                    Seuil Signaler
                  </p>
                  <p className="text-xs text-ink-4">
                    Score au-dessus → commande signalée
                  </p>
                </div>
                <span className="font-mono text-lg font-bold text-coral w-10 text-right">
                  {flag}
                </span>
              </div>
              <input
                type="range"
                min={verify + 1}
                max={block - 1}
                value={flag}
                onChange={(e) => handleFlagChange(Number(e.target.value))}
                className="slider slider-coral w-full"
              />
            </div>

            {/* Block slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-2">
                    Seuil Bloquer
                  </p>
                  <p className="text-xs text-ink-4">
                    Score au-dessus → commande bloquée
                  </p>
                </div>
                <span className="font-mono text-lg font-bold text-violet w-10 text-right">
                  {block}
                </span>
              </div>
              <input
                type="range"
                min={flag + 1}
                max={99}
                value={block}
                onChange={(e) => handleBlockChange(Number(e.target.value))}
                className="slider slider-violet w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Section C — Préréglages ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sun" />
            <div>
              <CardTitle className="text-base">Préréglages</CardTitle>
              <CardDescription>
                Configurations prédéfinies — cliquez pour appliquer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(SCORING_PRESETS).map(([key, preset]) => {
              const active = isActivePreset(preset);
              return (
                <button
                  key={key}
                  onClick={() =>
                    applyPreset(key as keyof typeof SCORING_PRESETS)
                  }
                  className={cn(
                    "rounded-sm border p-4 text-left transition-all",
                    active
                      ? "border-sun ring-2 ring-sun/20 bg-sun-light/30"
                      : "border-border hover:bg-sand"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink-1 text-sm">
                      {preset.name}
                    </p>
                    {active && (
                      <Check className="h-4 w-4 text-sun-deep" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-3">
                    {preset.description}
                  </p>
                  <p className="mt-2 font-mono text-xs text-ink-4">
                    {preset.verify} / {preset.flag} / {preset.block}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Section D — Auto-blocage ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-violet" />
            <div>
              <CardTitle className="text-base">Blocage automatique</CardTitle>
              <CardDescription>
                Gestion des commandes à haut risque
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-ink-2">
                Les commandes avec un score ≥{" "}
                <span className="font-mono font-bold">{block}</span> (seuil
                bloquer) seront automatiquement annulées.
              </p>
              <p className="mt-1 text-xs text-ink-4">
                Désactivez pour les convertir en signalements manuels à
                vérifier.
              </p>
            </div>
            <button
              onClick={() => setAutoBlock(!autoBlock)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                autoBlock ? "bg-mint" : "bg-ink-4"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  autoBlock ? "translate-x-5" : ""
                )}
              />
            </button>
          </div>
          <div className="mt-3 rounded-xs bg-sand/50 px-3 py-2">
            <p className="text-xs text-ink-3">
              {autoBlock ? (
                <>
                  <span className="font-medium text-mint-deep">Actif</span> —
                  Les commandes à risque critique sont bloquées automatiquement
                </>
              ) : (
                <>
                  <span className="font-medium text-ink-4">Inactif</span> —
                  Les commandes à risque critique sont signalées pour revue
                  manuelle
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Sticky Save Bar ═══ */}
      <div className="sticky bottom-0 -mx-6 border-t border-border bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            {saveStatus === "success" && (
              <p className="text-sm font-medium text-mint-deep flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Paramètres sauvegardés
              </p>
            )}
            {saveStatus === "error" && (
              <p className="text-sm font-medium text-coral">
                Erreur lors de la sauvegarde
              </p>
            )}
            {saveStatus === "idle" && hasChanges && (
              <p className="text-sm text-ink-3">
                Modifications non sauvegardées
              </p>
            )}
          </div>
          <Button
            disabled={!hasChanges || saving}
            onClick={handleSave}
            className="min-w-[160px]"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* ── Slider CSS ── */}
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: #e7e0d8;
          outline: none;
          cursor: pointer;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .slider-sun::-webkit-slider-thumb {
          background: #f59e0b;
        }
        .slider-sun::-moz-range-thumb {
          background: #f59e0b;
        }
        .slider-coral::-webkit-slider-thumb {
          background: #f97066;
        }
        .slider-coral::-moz-range-thumb {
          background: #f97066;
        }
        .slider-violet::-webkit-slider-thumb {
          background: #8b5cf6;
        }
        .slider-violet::-moz-range-thumb {
          background: #8b5cf6;
        }
      `}</style>
    </div>
  );
}
