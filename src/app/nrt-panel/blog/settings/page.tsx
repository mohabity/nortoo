"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Settings, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface BlogConfigData {
  id: number;
  articlesPerWeek: number;
  minQueueSize: number;
  autoTranslate: boolean;
  paused: boolean;
  pausedUntil: string | null;
}

export default function AdminBlogSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<BlogConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [articlesPerWeek, setArticlesPerWeek] = useState(3);
  const [minQueueSize, setMinQueueSize] = useState(10);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [pausedUntil, setPausedUntil] = useState("");

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/nrt-panel/blog/config");
      if (res.status === 401) {
        router.push("/nrt-panel/login");
        return;
      }
      const json = await res.json();
      const c = json.data;
      setConfig(c);
      setArticlesPerWeek(c.articlesPerWeek);
      setMinQueueSize(c.minQueueSize);
      setAutoTranslate(c.autoTranslate);
      setPaused(c.paused);
      setPausedUntil(c.pausedUntil?.split("T")[0] ?? "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/nrt-panel/blog/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articlesPerWeek,
          minQueueSize,
          autoTranslate,
          paused,
          pausedUntil: pausedUntil || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-mint animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/nrt-panel/blog"
          className="p-1.5 text-gray-400 hover:text-midnight transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-mint" />
          <h1 className="text-xl font-display font-bold text-midnight">
            Configuration Blog
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 space-y-6">
        {/* Articles per week */}
        <div>
          <label className="block text-sm font-medium text-midnight mb-1">
            Articles par semaine
          </label>
          <input
            type="number"
            min={1}
            max={14}
            value={articlesPerWeek}
            onChange={(e) => setArticlesPerWeek(parseInt(e.target.value) || 3)}
            className="w-32 h-10 bg-white border border-gray-200 text-midnight text-sm rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-mint/40 focus:border-mint/60"
          />
          <p className="text-xs text-gray-400 mt-1">
            Nombre maximum d&apos;articles FR générés par semaine.
          </p>
        </div>

        {/* Auto-translate */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-midnight">
              Traduction automatique
            </label>
            <p className="text-xs text-gray-400 mt-0.5">
              Traduit automatiquement chaque article FR en anglais.
            </p>
          </div>
          <button
            onClick={() => setAutoTranslate(!autoTranslate)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              autoTranslate ? "bg-mint" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                autoTranslate ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Min queue size */}
        <div>
          <label className="block text-sm font-medium text-midnight mb-1">
            Sujets minimum en queue
          </label>
          <input
            type="number"
            min={5}
            max={50}
            value={minQueueSize}
            onChange={(e) => setMinQueueSize(parseInt(e.target.value) || 10)}
            className="w-32 h-10 bg-white border border-gray-200 text-midnight text-sm rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-mint/40 focus:border-mint/60"
          />
          <p className="text-xs text-gray-400 mt-1">
            Si la queue descend en dessous, le cron génère de nouveaux sujets.
          </p>
        </div>

        {/* Pause */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-medium text-midnight">
                Mettre en pause
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                Suspend la génération automatique d&apos;articles.
              </p>
            </div>
            <button
              onClick={() => setPaused(!paused)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                paused ? "bg-amber" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  paused ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {paused && (
            <div>
              <label className="block text-sm font-medium text-midnight mb-1">
                Jusqu&apos;au
              </label>
              <input
                type="date"
                value={pausedUntil}
                onChange={(e) => setPausedUntil(e.target.value)}
                className="w-48 h-10 bg-white border border-gray-200 text-midnight text-sm rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-mint/40 focus:border-mint/60"
              />
              <p className="text-xs text-gray-400 mt-1">
                Laisser vide pour une pause indéfinie.
              </p>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-mint text-midnight font-semibold rounded-sm hover:bg-mint-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-500">✓ Sauvegardé</span>
          )}
        </div>
      </div>
    </div>
  );
}
