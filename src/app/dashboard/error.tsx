"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[nortoo:dashboard:error]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-rose/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-midnight mb-3">
          Une erreur est survenue
        </h1>
        <p className="text-fog mb-8 text-sm">
          Impossible de charger cette page. Veuillez r&eacute;essayer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-mint text-midnight font-semibold rounded-sm hover:bg-mint-dark transition text-sm"
          >
            R&eacute;essayer
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-silk text-fog font-medium rounded-sm hover:bg-snow transition text-sm text-center"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
