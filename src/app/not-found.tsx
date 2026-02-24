import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <span className="font-display text-6xl font-black text-[#1E293B]">404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Page introuvable
        </h1>
        <p className="text-[#94A3B8] mb-8">
          La page que vous cherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-[#00E5A0] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00C78A] transition"
        >
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
