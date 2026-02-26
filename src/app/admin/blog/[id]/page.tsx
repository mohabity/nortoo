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
  Pencil,
  Trash2,
  Save,
  X,
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

const CATEGORIES = [
  { value: "guide", label: "Guide" },
  { value: "case-study", label: "Case Study" },
  { value: "industry", label: "Industry" },
  { value: "product", label: "Product" },
  { value: "news", label: "News" },
];

export default function AdminBlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSeoTitle, setEditSeoTitle] = useState("");
  const [editSeoDesc, setEditSeoDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");

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

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function enterEditMode() {
    if (!article) return;
    setEditTitle(article.title);
    setEditExcerpt(article.excerpt);
    setEditContent(article.content);
    setEditSeoTitle(article.seoTitle);
    setEditSeoDesc(article.seoDescription);
    setEditCategory(article.category);
    try {
      setEditTags(JSON.parse(article.tags).join(", "));
    } catch {
      setEditTags("");
    }
    setEditMode(true);
    setFeedback(null);
  }

  function cancelEdit() {
    setEditMode(false);
    setFeedback(null);
  }

  async function handleSave() {
    if (!article) return;
    setSaving(true);
    setFeedback(null);
    try {
      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/blog/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          excerpt: editExcerpt,
          content: editContent,
          seoTitle: editSeoTitle,
          seoDescription: editSeoDesc,
          category: editCategory,
          tags: JSON.stringify(tagsArray),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFeedback({
          type: "error",
          message: data.error || `Erreur ${res.status}`,
        });
        return;
      }

      setFeedback({ type: "success", message: "Article mis a jour" });
      setEditMode(false);
      await fetchArticle();
    } catch (err) {
      setFeedback({
        type: "error",
        message: `Erreur : ${err instanceof Error ? err.message : "inconnue"}`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Supprimer cet article et sa traduction ? Cette action est irreversible."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blog/articles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setFeedback({
          type: "error",
          message: data.error || `Erreur ${res.status}`,
        });
        setDeleting(false);
        return;
      }

      router.push("/admin/blog");
    } catch (err) {
      setFeedback({
        type: "error",
        message: `Erreur : ${err instanceof Error ? err.message : "inconnue"}`,
      });
      setDeleting(false);
    }
  }

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
      <div className="text-center py-20 text-gray-400">
        Article introuvable
      </div>
    );
  }

  const seoTitleLen = editMode
    ? editSeoTitle.length
    : article.seoTitle?.length ?? 0;
  const seoDescLen = editMode
    ? editSeoDesc.length
    : article.seoDescription?.length ?? 0;

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
              {article.locale.toUpperCase()} · {article.category} ·{" "}
              {article.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <>
              <button
                onClick={enterEditMode}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-midnight border border-gray-200 rounded-sm transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
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
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-rose-500 hover:text-rose-700 border border-rose-200 rounded-sm hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Supprimer
              </button>
            </>
          )}
          {editMode && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-1.5 text-sm bg-mint text-white rounded-sm hover:bg-mint/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-3 rounded-sm border text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

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
              <p className="text-xs text-gray-400 mb-1">Score qualite</p>
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
              {editMode ? (
                <input
                  type="text"
                  value={editSeoTitle}
                  onChange={(e) => setEditSeoTitle(e.target.value)}
                  maxLength={65}
                  className={`w-full text-sm px-2 py-1.5 border rounded-sm ${
                    editSeoTitle.length > 60
                      ? "border-rose-300 text-rose"
                      : "border-gray-200 text-midnight"
                  }`}
                />
              ) : (
                <p
                  className={`text-sm ${
                    seoTitleLen > 60 ? "text-rose" : "text-midnight"
                  }`}
                >
                  {article.seoTitle}
                </p>
              )}
            </div>

            {/* SEO description */}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Meta Description ({seoDescLen}/160)
              </p>
              {editMode ? (
                <textarea
                  value={editSeoDesc}
                  onChange={(e) => setEditSeoDesc(e.target.value)}
                  maxLength={165}
                  rows={3}
                  className={`w-full text-sm px-2 py-1.5 border rounded-sm resize-none ${
                    editSeoDesc.length > 160
                      ? "border-rose-300 text-rose"
                      : "border-gray-200 text-midnight"
                  }`}
                />
              ) : (
                <p
                  className={`text-sm ${
                    seoDescLen > 160 ? "text-rose" : "text-midnight"
                  }`}
                >
                  {article.seoDescription}
                </p>
              )}
            </div>

            {/* Category (edit mode) */}
            {editMode && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Categorie</p>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded-sm text-midnight"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              {editMode ? (
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded-sm text-midnight"
                />
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6">
            {editMode ? (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-lg font-display font-bold px-3 py-2 border border-gray-200 rounded-sm text-midnight"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Extrait ({editExcerpt.length}/160)
                  </label>
                  <textarea
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    rows={2}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-gray-600 resize-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Contenu (Markdown)
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={24}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-sm text-gray-700 font-mono leading-relaxed resize-y"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-display font-bold text-midnight mb-3">
                  {article.title}
                </h2>
                <p className="text-gray-500 mb-6">{article.excerpt}</p>
                <div className="prose prose-sm prose-gray max-w-none prose-headings:font-display prose-headings:text-midnight prose-a:text-mint">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 font-body leading-relaxed">
                    {article.content.slice(0, 5000)}
                    {article.content.length > 5000 && "\n\n[...tronque]"}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
