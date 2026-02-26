"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  PenTool,
  FileText,
  Globe,
  ListTodo,
  AlertTriangle,
  Pause,
  Play,
  Zap,
  RefreshCw,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalArticles: number;
  publishedFr: number;
  publishedEn: number;
  failedArticles: number;
  queuedTopics: number;
  failedTopics: number;
  avgQualityScore: number;
}

interface Config {
  paused: boolean;
  articlesPerWeek: number;
  autoTranslate: boolean;
}

interface Article {
  id: number;
  slug: string;
  locale: string;
  title: string;
  category: string;
  status: string;
  qualityScore: number | null;
  wordCount: number | null;
  publishedAt: string | null;
  createdAt: string;
}

interface ActionFeedback {
  type: "success" | "error";
  message: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState("guide");
  const [customKeywords, setCustomKeywords] = useState("");
  const [customWordCount, setCustomWordCount] = useState("1500");

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, articlesRes] = await Promise.all([
        fetch("/api/admin/blog/stats"),
        fetch("/api/admin/blog/articles?page=1"),
      ]);

      if (statsRes.status === 401 || articlesRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const statsJson = await statsRes.json();
      const articlesJson = await articlesRes.json();

      setStats(statsJson.stats);
      setConfig(statsJson.config);
      setArticles(articlesJson.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss feedback after 8 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  async function handleAction(action: string, extra?: Record<string, unknown>) {
    setActionLoading(action);
    setFeedback(null);

    // Client-side timeout: abort after 115s (server maxDuration = 120s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 115_000);

    try {
      const res = await fetch("/api/admin/blog/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses (e.g. Vercel 504 HTML page)
      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        setFeedback({
          type: "error",
          message: `Erreur serveur (${res.status}). Actualisez la page pour voir le resultat.`,
        });
        return;
      }

      if (!res.ok) {
        setFeedback({
          type: "error",
          message: (data.error as string) || `Erreur ${res.status}`,
        });
        return;
      }

      // Build success message from response
      const messages: Record<string, (d: Record<string, unknown>) => string> = {
        "generate-now": (d) => {
          const result = d.result as Record<string, unknown> | undefined;
          const inner = result?.data as Record<string, unknown> | undefined;
          if (inner?.status === "published") {
            return `Article publie : "${inner.title}" (score: ${inner.qualityScore})`;
          }
          if (inner?.status === "queue_empty") return "Queue vide — aucun sujet a generer";
          if (inner?.status === "quota_reached") return "Quota hebdomadaire atteint";
          if (inner?.status === "paused") return "Pipeline en pause";
          return `Resultat : ${JSON.stringify(inner?.status ?? "unknown")}`;
        },
        "generate-custom": (d) => {
          const art = d.article as Record<string, unknown> | undefined;
          if (art) {
            return `Article genere : "${art.title}" (score: ${art.qualityScore}, ${art.wordCount} mots)`;
          }
          return "Article genere avec succes";
        },
        "replenish-topics": (d) => {
          const result = d.result as Record<string, unknown> | undefined;
          const inner = result?.data as Record<string, unknown> | undefined;
          if (inner?.status === "replenished") return `${inner.added} sujets ajoutes a la queue`;
          if (inner?.status === "sufficient") return "Queue deja suffisamment remplie";
          return `Resultat : ${JSON.stringify(inner?.status ?? "ok")}`;
        },
        pause: () => "Pipeline mis en pause",
        resume: () => "Pipeline repris",
        "retry-failed": () => "Sujets en echec remis en queue",
        "regenerate-covers": (d) => `${d.total ?? 0} image(s) regeneree(s)`,
      };

      const msgFn = messages[action];
      setFeedback({
        type: "success",
        message: msgFn ? msgFn(data) : "Action executee avec succes",
      });

      await fetchData();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        setFeedback({
          type: "error",
          message: "Timeout — l'operation prend trop de temps. Actualisez la page pour voir si l'action a reussi.",
        });
      } else {
        setFeedback({
          type: "error",
          message: `Erreur reseau : ${err instanceof Error ? err.message : "connexion echouee"}`,
        });
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCustomGenerate() {
    if (!customTopic.trim()) return;

    const keywords = customKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    await handleAction("generate-custom", {
      customTopic: customTopic.trim(),
      customDescription: customDescription.trim() || undefined,
      customCategory: customCategory,
      customKeywords: keywords.length > 0 ? keywords : undefined,
      customWordCount: parseInt(customWordCount, 10) || 1500,
    });

    // Reset form on success — use a callback to read latest feedback state
    setFeedback((prev) => {
      if (!prev || prev.type === "success") {
        setCustomTopic("");
        setCustomDescription("");
        setCustomCategory("guide");
        setCustomKeywords("");
        setCustomWordCount("1500");
        setShowCustomForm(false);
      }
      return prev;
    });
  }

  const STATUS_STYLES: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-600",
    generating: "bg-blue-50 text-blue-600",
    failed: "bg-rose-50 text-rose-600",
    archived: "bg-gray-100 text-gray-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-mint animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PenTool className="w-5 h-5 text-mint" />
          <div>
            <h1 className="text-xl font-display font-bold text-midnight">
              Blog automatisé
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {config?.paused ? (
                <span className="text-amber-500">⏸ Pipeline en pause</span>
              ) : (
                <span className="text-emerald-500">
                  ● Pipeline actif — {config?.articlesPerWeek ?? 3} articles/semaine
                  {config?.autoTranslate ? " — FR+EN" : " — FR"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog/settings"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-midnight border border-gray-200 rounded-sm transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-midnight border border-gray-200 rounded-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir le blog
          </a>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-sm border text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Articles FR</p>
              <FileText className="w-4 h-4 text-mint" />
            </div>
            <p className="text-2xl font-display font-bold text-midnight mt-1">
              {stats.publishedFr}
            </p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Traduits EN</p>
              <Globe className="w-4 h-4 text-ocean" />
            </div>
            <p className="text-2xl font-display font-bold text-midnight mt-1">
              {stats.publishedEn}
            </p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">En queue</p>
              <ListTodo className="w-4 h-4 text-amber" />
            </div>
            <p className="text-2xl font-display font-bold text-midnight mt-1">
              {stats.queuedTopics}
            </p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Score moyen</p>
              <Zap className="w-4 h-4 text-violet" />
            </div>
            <p className="text-2xl font-display font-bold text-midnight mt-1">
              {stats.avgQualityScore}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {stats && (stats.failedArticles > 0 || stats.failedTopics > 0) && (
        <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose shrink-0" />
          <div className="text-sm text-rose-700">
            {stats.failedArticles > 0 && (
              <span>{stats.failedArticles} article(s) en échec. </span>
            )}
            {stats.failedTopics > 0 && (
              <span>{stats.failedTopics} sujet(s) en échec. </span>
            )}
            <button
              onClick={() => handleAction("retry-failed")}
              disabled={actionLoading === "retry-failed"}
              className="underline hover:no-underline font-medium"
            >
              {actionLoading === "retry-failed" ? "En cours..." : "Relancer"}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {config?.paused ? (
          <button
            onClick={() => handleAction("resume")}
            disabled={actionLoading === "resume"}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-sm hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {actionLoading === "resume" ? "..." : "Reprendre"}
          </button>
        ) : (
          <button
            onClick={() => handleAction("pause")}
            disabled={actionLoading === "pause"}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-50 text-amber-600 border border-amber-200 rounded-sm hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <Pause className="w-3.5 h-3.5" />
            {actionLoading === "pause" ? "..." : "Mettre en pause"}
          </button>
        )}
        <button
          onClick={() => handleAction("generate-now")}
          disabled={!!actionLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-mint/10 text-mint-dark border border-mint/30 rounded-sm hover:bg-mint/20 transition-colors disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          {actionLoading === "generate-now" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            "Générer maintenant"
          )}
        </button>
        <button
          onClick={() => handleAction("replenish-topics")}
          disabled={!!actionLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {actionLoading === "replenish-topics" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Chargement...
            </>
          ) : (
            "Recharger sujets"
          )}
        </button>
        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          disabled={!!actionLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-50 text-violet-600 border border-violet-200 rounded-sm hover:bg-violet-100 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showCustomForm ? "Fermer" : "Generer (custom)"}
        </button>
      </div>

      {/* Custom generation form */}
      {showCustomForm && (
        <div className="bg-white border border-violet-200 shadow-sm rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-midnight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Generation custom
            </h2>
            <button
              onClick={() => setShowCustomForm(false)}
              className="text-gray-400 hover:text-midnight"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topic */}
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">
                Sujet *
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Ex: Guide complet du retargeting pour le COD au Maroc"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-midnight placeholder:text-gray-300"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">
                Brief / Description (optionnel)
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={2}
                placeholder="Instructions supplementaires pour orienter la generation..."
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-midnight resize-none placeholder:text-gray-300"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Categorie
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-midnight"
              >
                <option value="guide">Guide</option>
                <option value="case-study">Case Study</option>
                <option value="industry">Industry</option>
                <option value="product">Product</option>
                <option value="news">News</option>
              </select>
            </div>

            {/* Word count */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Nombre de mots cible
              </label>
              <input
                type="number"
                value={customWordCount}
                onChange={(e) => setCustomWordCount(e.target.value)}
                min={500}
                max={5000}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-midnight"
              />
            </div>

            {/* Keywords */}
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">
                Mots-cles (virgule-separes, optionnel)
              </label>
              <input
                type="text"
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                placeholder="retargeting, COD, Maroc, e-commerce"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-midnight placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCustomGenerate}
              disabled={!customTopic.trim() || !!actionLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-500 text-white rounded-sm hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              {actionLoading === "generate-custom" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generation en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Lancer la generation
                </>
              )}
            </button>
            <p className="text-xs text-gray-400">
              ~60s — Claude genere l&apos;article + DALL-E cree la cover
            </p>
          </div>
        </div>
      )}

      {/* Recent articles table */}
      <div className="rounded-sm border border-gray-200 overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Langue
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Score
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Mots
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr
                key={a.id}
                onClick={() => router.push(`/admin/blog/${a.id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-midnight font-medium max-w-xs truncate">
                  {a.title}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold uppercase">
                    {a.locale}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      STATUS_STYLES[a.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {a.qualityScore ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {a.wordCount ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(a.publishedAt ?? a.createdAt).toLocaleDateString(
                    "fr-FR",
                    { day: "2-digit", month: "2-digit", year: "2-digit" }
                  )}
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Aucun article généré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
