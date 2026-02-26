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

export default function AdminBlogPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      await fetch("/api/admin/blog/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
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
          {actionLoading === "generate-now" ? "Génération..." : "Générer maintenant"}
        </button>
        <button
          onClick={() => handleAction("replenish-topics")}
          disabled={!!actionLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {actionLoading === "replenish-topics" ? "..." : "Recharger sujets"}
        </button>
      </div>

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
