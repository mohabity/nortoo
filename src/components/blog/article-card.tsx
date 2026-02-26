import Link from "next/link";
import { Clock, Calendar, ArrowUpRight } from "lucide-react";
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
  featured?: boolean;
}

const CATEGORY_COLORS: Record<string, { badge: string; accent: string }> = {
  guide: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accent: "from-emerald-600 to-teal-700",
  },
  "case-study": {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    accent: "from-violet-600 to-purple-700",
  },
  industry: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    accent: "from-blue-600 to-indigo-700",
  },
  product: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "from-amber-500 to-orange-600",
  },
  news: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    accent: "from-rose-500 to-pink-600",
  },
};

export function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  readingTime,
  publishedAt,
  locale,
  coverImageUrl,
  featured = false,
}: ArticleCardProps) {
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString(
        locale === "en" ? "en-US" : "fr-FR",
        { day: "numeric", month: "short", year: "numeric" }
      )
    : "";

  const colors = CATEGORY_COLORS[category] ?? {
    badge: "bg-gray-50 text-gray-600 border-gray-200",
    accent: "from-gray-600 to-gray-700",
  };

  // Use the stored cover image URL, or fall back to the OG endpoint
  const imageUrl =
    coverImageUrl ||
    `/api/og/blog?title=${encodeURIComponent(title)}&cat=${encodeURIComponent(category)}`;

  if (featured) {
    return (
      <Link
        href={`/blog/${slug}`}
        className="group block rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden hover:shadow-lg hover:border-[#00E5A0]/30 transition-all duration-300"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Cover */}
          <div className={`aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-gradient-to-br ${colors.accent} relative overflow-hidden`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-5 left-5 z-10">
              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colors.badge}`}>
                {getCategoryLabel(category, locale)}
              </span>
            </div>
            <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-xl md:text-2xl font-display font-bold text-[#0B0F1A] leading-tight group-hover:text-[#00C78A] transition-colors mb-3">
              {title}
            </h3>
            <p className="text-sm text-[#64748B] leading-relaxed mb-4 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
              {publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {dateStr}
                </span>
              )}
              {readingTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {readingTime} min
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#00E5A0]/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Cover image */}
      <div className={`aspect-[16/9] bg-gradient-to-br ${colors.accent} relative overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-4 left-4 z-10">
          <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colors.badge}`}>
            {getCategoryLabel(category, locale)}
          </span>
        </div>
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-display font-bold text-[#0B0F1A] leading-snug group-hover:text-[#00C78A] transition-colors mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-sm text-[#64748B] leading-relaxed line-clamp-2 mb-4 flex-1">
          {excerpt}
        </p>

        <div className="flex items-center gap-3 text-xs text-[#94A3B8] pt-3 border-t border-[#F1F5F9]">
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
