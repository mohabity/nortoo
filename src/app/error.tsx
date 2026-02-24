"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[nortoo:error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F43F5E]/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Une erreur est survenue
        </h1>
        <p className="text-[#94A3B8] mb-8">
          Quelque chose s&apos;est mal pass&eacute;. Veuillez r&eacute;essayer ou revenir &agrave; l&apos;accueil.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#00E5A0] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00C78A] transition"
          >
            R&eacute;essayer
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-[#334155] text-[#94A3B8] font-medium rounded-xl hover:bg-[#1E293B] transition text-center"
          >
            Retour &agrave; l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
