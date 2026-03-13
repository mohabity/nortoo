"use client";

import { useState } from "react";
import Link from "next/link";

type RequestType = "access" | "rectification" | "deletion";

export default function DataRightsPage() {
  const [type, setType] = useState<RequestType>("access");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reference: string;
    deadlineFormatted: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/data-rights/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, phone, email, details: details || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError("Trop de demandes. Veuillez réessayer dans quelques minutes.");
        } else if (res.status === 400) {
          setError("Veuillez vérifier les informations saisies.");
        } else {
          setError(data.error || "Une erreur est survenue. Réessayez plus tard.");
        }
        return;
      }

      setResult({
        reference: data.reference,
        deadlineFormatted: data.deadlineFormatted,
      });
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const types: { id: RequestType; label: string; article: string }[] = [
    { id: "access", label: "Droit d\u2019accès", article: "Art. 7" },
    {
      id: "rectification",
      label: "Droit de rectification",
      article: "Art. 8",
    },
    {
      id: "deletion",
      label: "Droit de suppression",
      article: "Art. 9",
    },
  ];

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669] text-2xl">
            &#10003;
          </div>
          <h1 className="text-2xl font-bold text-[#0B0F1A] mb-2">
            Demande enregistrée
          </h1>
          <p className="text-[#64748B] mb-6">
            Votre demande de{" "}
            {types.find((t) => t.id === type)?.label.toLowerCase()} a été
            envoyée. Nous vous répondrons dans un délai de{" "}
            <strong className="text-[#0B0F1A]">10 jours ouvrables</strong> maximum,
            conformément à l&apos;article 7 de la Loi 09-08.
          </p>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#94A3B8]">Référence</span>
              <span className="text-[#0B0F1A] font-mono font-bold">{result.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Réponse avant le</span>
              <span className="text-[#059669] font-semibold">{result.deadlineFormatted}</span>
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] mb-6">
            Un email de confirmation a été envoyé à votre adresse.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 bg-[#00E5A0] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00C78A] transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1E293B]">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto" />
          </Link>
          <nav className="flex gap-4 text-sm text-[#64748B]">
            <Link href="/privacy" className="hover:text-[#0B0F1A] transition">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[#0B0F1A] transition">
              CGU
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#0B0F1A] mb-2">
          Exercer vos droits
        </h1>
        <p className="text-[#64748B] mb-8">
          Conformément à la Loi 09-08, vous pouvez demander l&apos;accès, la
          rectification ou la suppression de vos données personnelles.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de demande */}
          <div>
            <label className="text-sm font-medium text-[#0B0F1A] mb-3 block">
              Type de demande
            </label>
            <div className="grid grid-cols-3 gap-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-3 rounded-xl border text-center transition text-sm ${
                    type === t.id
                      ? "border-[#059669] bg-[#059669]/10 text-[#059669]"
                      : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs mt-1 opacity-70">{t.article}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label
              htmlFor="phone"
              className="text-sm font-medium text-[#0B0F1A] mb-2 block"
            >
              Numéro de téléphone associé à vos commandes *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0B0F1A] placeholder-[#94A3B8] focus:outline-none focus:border-[#059669] transition"
            />
            <p className="text-xs text-[#94A3B8] mt-1">
              Ce numéro permet d&apos;identifier vos données dans notre système
              (stockées sous forme hashée).
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-[#0B0F1A] mb-2 block"
            >
              Email de réponse *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0B0F1A] placeholder-[#94A3B8] focus:outline-none focus:border-[#059669] transition"
            />
          </div>

          {/* Détails */}
          <div>
            <label
              htmlFor="details"
              className="text-sm font-medium text-[#0B0F1A] mb-2 block"
            >
              {type === "access" &&
                "Précisez les données que vous souhaitez obtenir"}
              {type === "rectification" &&
                "Précisez les données à corriger"}
              {type === "deletion" &&
                "Raison de la suppression (optionnel)"}
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder={
                type === "access"
                  ? "Je souhaite obtenir une copie de toutes les données associées à mon numéro..."
                  : type === "rectification"
                    ? "Mon nom est mal orthographié, la bonne version est..."
                    : "Je souhaite que mes données soient supprimées..."
              }
              className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0B0F1A] placeholder-[#94A3B8] focus:outline-none focus:border-[#059669] transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-sm text-[#64748B]">
            <p>
              Votre demande sera traitée dans un délai de{" "}
              <strong className="text-[#0B0F1A]">10 jours ouvrables</strong>. Nous
              vérifierons votre identité avant de procéder. En cas de
              difficulté, vous pouvez saisir la{" "}
              <a
                href="https://www.cndp.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#059669] hover:underline"
              >
                CNDP
              </a>
              .
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !phone || !email}
            className="w-full py-3 bg-[#00E5A0] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00C78A] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi en cours..." : "Envoyer ma demande"}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] px-6 py-6 mt-12">
        <div className="max-w-xl mx-auto flex justify-between text-sm text-[#94A3B8]">
          <span>&copy; {new Date().getFullYear()} nortoo</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#0B0F1A] transition">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[#0B0F1A] transition">
              CGU
            </Link>
            <Link href="/data-rights" className="text-[#059669] font-medium">
              Mes données
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
