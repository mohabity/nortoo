import Link from "next/link";
import { Shield, TrendingUp, Plug } from "lucide-react";

/**
 * Landing page — minimal CTA to YouCan OAuth or login.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-snow px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-6">
          <img src="/nortoo-logo.png" alt="nortoo" className="mx-auto h-9 w-auto" />
        </div>

        <h1 className="font-display text-2xl font-bold text-midnight">
          Scoring anti-fraude COD · Maroc
        </h1>
        <p className="mt-2 text-fog">
          Scorez vos commandes COD en temps réel. Expédiez en confiance, bloquez la fraude.
        </p>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <Shield className="mx-auto h-6 w-6 text-mint" />
            <p className="mt-1.5 text-xs font-medium text-slate">Score 0-100</p>
          </div>
          <div>
            <TrendingUp className="mx-auto h-6 w-6 text-mint" />
            <p className="mt-1.5 text-xs font-medium text-slate">Réduire RTO</p>
          </div>
          <div>
            <Plug className="mx-auto h-6 w-6 text-[#5C6AC4]" />
            <p className="mt-1.5 text-xs font-medium text-slate">YouCan intégré</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/api/auth/youcan?mode=register"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#5C6AC4] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F5BB5]"
          >
            <Plug className="h-4 w-4" />
            Commencer avec YouCan
          </a>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-sm border border-silk bg-white px-5 py-3 text-sm font-medium text-slate transition-colors hover:bg-snow"
          >
            Se connecter
          </Link>
        </div>

        {/* Compliance footer */}
        <p className="mt-10 text-xs text-mist">
          Conforme Loi 09-08 — Données hébergées en UE (Frankfurt)
        </p>
      </div>
    </div>
  );
}
