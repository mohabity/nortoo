import Link from "next/link";
import { Clock, Calendar } from "lucide-react";
import { getCategoryLabel } from "@/lib/blog/seo";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number | null;
  publishedAt: Date | null;
  locale: string;
  coverImageUrl: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  guide: "bg-mint/10 text-mint-dark",
  "case-study": "bg-violet/10 text-violet",
  industry: "bg-ocean/10 text-ocean",
  product: "bg-amber/10 text-amber",
  news: "bg-rose/10 text-rose",
};

export function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  readingTime,
  publishedAt,
  locale,
}: ArticleCardProps) {
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString(
        locale === "en" ? "en-US" : "fr-FR",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : "";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-white rounded-sm border border-gray-200 hover:border-mint/40 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Cover image */}
      <div className="aspect-[16/9] bg-gradient-to-br from-midnight to-slate flex items-end p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {getCategoryLabel(category, locale)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-display font-bold text-midnight leading-tight group-hover:text-mint-dark transition-colors line-clamp-2">
          {title}
        </h3>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
          {excerpt}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
          {publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
            </span>
          )}
          {readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readingTime} min
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
