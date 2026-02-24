import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <span className="font-display text-6xl font-black text-slate/30">404</span>
        </div>
        <h1 className="text-xl font-bold text-midnight mb-3">
          Page introuvable
        </h1>
        <p className="text-fog mb-8 text-sm">
          Cette page du dashboard n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-mint text-midnight font-semibold rounded-sm hover:bg-mint-dark transition text-sm"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
