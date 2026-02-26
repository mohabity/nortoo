"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BlogArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[blog/[slug]] Error:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-display font-bold text-[#0B0F1A] mb-4">
        Oops, une erreur est survenue
      </h1>
      <p className="text-[#64748B] mb-8">
        Nous n&apos;avons pas pu charger cet article. Veuillez réessayer ou
        retourner à la liste des articles.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#00E5A0] text-[#0B0F1A] font-semibold text-sm rounded-xl hover:bg-[#00C78A] transition-colors"
        >
          Réessayer
        </button>
        <Link
          href="/blog"
          className="px-5 py-2.5 border border-[#E2E8F0] text-[#64748B] font-medium text-sm rounded-xl hover:bg-[#F8FAFC] transition-colors"
        >
          Retour au blog
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-[#94A3B8]">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
