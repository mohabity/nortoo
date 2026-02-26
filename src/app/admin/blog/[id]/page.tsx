"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  ExternalLink,
  Archive,
  Check,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface Article {
  id: number;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  qualityScore: number | null;
  wordCount: number | null;
  readingTime: number | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminBlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArticle = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/blog/articles/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      setArticle(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  async function handleStatusChange(newStatus: string) {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/blog/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchArticle();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-mint animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20 text-gray-400">Article introuvable</div>
    );
  }

  const seoTitleLen = article.seoTitle?.length ?? 0;
  const seoDescLen = article.seoDescription?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-1.5 text-gray-400 hover:text-midnight transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-display font-bold text-midnight line-clamp-1">
              {article.title}
            </h1>
            <p className="text-sm text-gray-400">
              {article.locale.toUpperCase()} · {article.category} · {article.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {article.status === "published" && (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-midnight border border-gray-200 rounded-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir
            </a>
          )}
          {article.status === "published" && (
            <button
              onClick={() => handleStatusChange("archived")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-rose border border-gray-200 rounded-sm transition-colors disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              Archiver
            </button>
          )}
          {article.status === "archived" && (
            <button
              onClick={() => handleStatusChange("published")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-mint-dark border border-mint/30 rounded-sm hover:bg-mint/10 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Republier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEO Audit Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-midnight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-mint" />
              Audit SEO
            </h2>

            {/* Quality score */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Score qualité</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (article.qualityScore ?? 0) >= 80
                        ? "bg-emerald-500"
                        : (article.qualityScore ?? 0) >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${article.qualityScore ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-midnight">
                  {article.qualityScore ?? "—"}
                </span>
              </div>
            </div>

            {/* SEO title */}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                SEO Title ({seoTitleLen}/60)
              </p>
              <p
                className={`text-sm ${
                  seoTitleLen > 60 ? "text-rose" : "text-midnight"
                }`}
              >
                {article.seoTitle}
              </p>
            </div>

            {/* SEO description */}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Meta Description ({seoDescLen}/160)
              </p>
              <p
                className={`text-sm ${
                  seoDescLen > 160 ? "text-rose" : "text-midnight"
                }`}
              >
                {article.seoDescription}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Mots</p>
                <p className="text-sm font-medium text-midnight flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {article.wordCount ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Lecture</p>
                <p className="text-sm font-medium text-midnight flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readingTime ?? "—"} min
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  try {
                    return JSON.parse(article.tags).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-200"
                      >
                        {tag}
                      </span>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Article preview */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6">
            <h2 className="text-2xl font-display font-bold text-midnight mb-3">
              {article.title}
            </h2>
            <p className="text-gray-500 mb-6">{article.excerpt}</p>
            <div className="prose prose-sm prose-gray max-w-none prose-headings:font-display prose-headings:text-midnight prose-a:text-mint">
              {/* Render markdown as raw text for preview */}
              <pre className="whitespace-pre-wrap text-sm text-gray-600 font-body leading-relaxed">
                {article.content.slice(0, 3000)}
                {article.content.length > 3000 && "\n\n[...tronqué]"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
