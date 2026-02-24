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
          setError("Trop de demandes. Veuillez r\u00e9essayer dans quelques minutes.");
        } else if (res.status === 400) {
          setError("Veuillez v\u00e9rifier les informations saisies.");
        } else {
          setError(data.error || "Une erreur est survenue. R\u00e9essayez plus tard.");
        }
        return;
      }

      setResult({
        reference: data.reference,
        deadlineFormatted: data.deadlineFormatted,
      });
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur. V\u00e9rifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const types: { id: RequestType; label: string; article: string }[] = [
    { id: "access", label: "Droit d\u2019acc\u00e8s", article: "Art. 7" },
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
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] text-2xl">
            &#10003;
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Demande enregistr\u00e9e
          </h1>
          <p className="text-[#94A3B8] mb-6">
            Votre demande de{" "}
            {types.find((t) => t.id === type)?.label.toLowerCase()} a \u00e9t\u00e9
            envoy\u00e9e. Nous vous r\u00e9pondrons dans un d\u00e9lai de{" "}
            <strong className="text-white">10 jours ouvrables</strong> maximum,
            conform\u00e9ment \u00e0 l&apos;article 7 de la Loi 09-08.
          </p>
          <div className="bg-[#1E293B] rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#64748B]">R\u00e9f\u00e9rence</span>
              <span className="text-white font-mono font-bold">{result.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">R\u00e9ponse avant le</span>
              <span className="text-[#00E5A0] font-semibold">{result.deadlineFormatted}</span>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mb-6">
            Un email de confirmation a \u00e9t\u00e9 envoy\u00e9 \u00e0 votre adresse.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 bg-[#00E5A0] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00C78A] transition"
          >
            Retour \u00e0 l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#E2E8F0]">
      {/* Header */}
      <header className="border-b border-[#1E293B] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            nortoo<span className="text-[#00E5A0]">.</span>
          </Link>
          <nav className="flex gap-4 text-sm text-[#94A3B8]">
            <Link href="/privacy" className="hover:text-white transition">
              Confidentialit\u00e9
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              CGU
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">
          Exercer vos droits
        </h1>
        <p className="text-[#94A3B8] mb-8">
          Conform\u00e9ment \u00e0 la Loi 09-08, vous pouvez demander l&apos;acc\u00e8s, la
          rectification ou la suppression de vos donn\u00e9es personnelles.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de demande */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
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
                      ? "border-[#00E5A0] bg-[#00E5A0]/10 text-[#00E5A0]"
                      : "border-[#334155] bg-[#1E293B] text-[#94A3B8] hover:border-[#475569]"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs mt-1 opacity-70">{t.article}</div>
                </button>
              ))}
            </div>
          </div>

          {/* T\u00e9l\u00e9phone */}
          <div>
            <label
              htmlFor="phone"
              className="text-sm font-medium text-white mb-2 block"
            >
              Num\u00e9ro de t\u00e9l\u00e9phone associ\u00e9 \u00e0 vos commandes *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A0] transition"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Ce num\u00e9ro permet d&apos;identifier vos donn\u00e9es dans notre syst\u00e8me
              (stock\u00e9es sous forme hash\u00e9e).
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-white mb-2 block"
            >
              Email de r\u00e9ponse *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A0] transition"
            />
          </div>

          {/* D\u00e9tails */}
          <div>
            <label
              htmlFor="details"
              className="text-sm font-medium text-white mb-2 block"
            >
              {type === "access" &&
                "Pr\u00e9cisez les donn\u00e9es que vous souhaitez obtenir"}
              {type === "rectification" &&
                "Pr\u00e9cisez les donn\u00e9es \u00e0 corriger"}
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
                  ? "Je souhaite obtenir une copie de toutes les donn\u00e9es associ\u00e9es \u00e0 mon num\u00e9ro..."
                  : type === "rectification"
                    ? "Mon nom est mal orthographi\u00e9, la bonne version est..."
                    : "Je souhaite que mes donn\u00e9es soient supprim\u00e9es..."
              }
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A0] transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#F43F5E]/10 border border-[#F43F5E]/30 rounded-xl p-4 text-sm text-[#F43F5E]">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-[#1E293B] rounded-xl p-4 text-sm text-[#94A3B8]">
            <p>
              Votre demande sera trait\u00e9e dans un d\u00e9lai de{" "}
              <strong className="text-white">10 jours ouvrables</strong>. Nous
              v\u00e9rifierons votre identit\u00e9 avant de proc\u00e9der. En cas de
              difficult\u00e9, vous pouvez saisir la{" "}
              <a
                href="https://www.cndp.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5A0] hover:underline"
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
      <footer className="border-t border-[#1E293B] px-6 py-6 mt-12">
        <div className="max-w-xl mx-auto flex justify-between text-sm text-[#64748B]">
          <span>&copy; {new Date().getFullYear()} nortoo</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition">
              Confidentialit\u00e9
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
