import Link from "next/link";
import { Zap, Shield, TrendingUp, Plug } from "lucide-react";

/**
 * Landing page — minimal CTA to YouCan OAuth or login.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-sun">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <span className="font-sora text-3xl font-bold text-ink-1">
            COD<span className="text-sun">Pilot</span>
          </span>
        </div>

        <h1 className="font-sora text-2xl font-bold text-ink-1">
          Anti-Fraude RTO Intelligence
        </h1>
        <p className="mt-2 text-ink-3">
          Scorez vos commandes COD en temps réel. Expédiez en confiance, bloquez la fraude.
        </p>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <Shield className="mx-auto h-6 w-6 text-mint" />
            <p className="mt-1.5 text-xs font-medium text-ink-2">Score 0-100</p>
          </div>
          <div>
            <TrendingUp className="mx-auto h-6 w-6 text-sun" />
            <p className="mt-1.5 text-xs font-medium text-ink-2">Réduire RTO</p>
          </div>
          <div>
            <Plug className="mx-auto h-6 w-6 text-[#5C6AC4]" />
            <p className="mt-1.5 text-xs font-medium text-ink-2">YouCan intégré</p>
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
            className="inline-flex items-center justify-center rounded-sm border border-border bg-white px-5 py-3 text-sm font-medium text-ink-2 transition-colors hover:bg-sand"
          >
            Se connecter
          </Link>
        </div>

        {/* Compliance footer */}
        <p className="mt-10 text-xs text-ink-4">
          Conforme Loi 09-08 — Données hébergées en UE (Frankfurt)
        </p>
      </div>
    </div>
  );
}
