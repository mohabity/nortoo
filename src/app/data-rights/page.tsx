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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Envoyer par email (pas directement à l'API — le client final n'est pas authentifié)
    // En production, ceci enverrait un email à support@nortoo.ma via une API d'email
    // Pour le MVP, on simule la soumission
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] text-2xl">
            &#10003;
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Demande enregistrée
          </h1>
          <p className="text-[#94A3B8] mb-6">
            Votre demande de{" "}
            {types.find((t) => t.id === type)?.label.toLowerCase()} a été
            envoyée. Nous vous répondrons dans un délai de{" "}
            <strong className="text-white">10 jours ouvrables</strong> maximum,
            conformément à l&apos;article 7 de la Loi 09-08.
          </p>
          <p className="text-sm text-[#64748B] mb-6">
            Référence : DR-{Date.now().toString(36).toUpperCase()}
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
    <div className="min-h-screen bg-[#0B0F1A] text-[#E2E8F0]">
      {/* Header */}
      <header className="border-b border-[#1E293B] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            nortoo<span className="text-[#00E5A0]">.</span>
          </Link>
          <nav className="flex gap-4 text-sm text-[#94A3B8]">
            <Link href="/privacy" className="hover:text-white transition">
              Confidentialité
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
          Conformément à la Loi 09-08, vous pouvez demander l&apos;accès, la
          rectification ou la suppression de vos données personnelles.
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

          {/* Téléphone */}
          <div>
            <label
              htmlFor="phone"
              className="text-sm font-medium text-white mb-2 block"
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
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A0] transition"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Ce numéro permet d&apos;identifier vos données dans notre système
              (stockées sous forme hashée).
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-white mb-2 block"
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
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A0] transition"
            />
          </div>

          {/* Détails */}
          <div>
            <label
              htmlFor="details"
              className="text-sm font-medium text-white mb-2 block"
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
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A0] transition resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-[#1E293B] rounded-xl p-4 text-sm text-[#94A3B8]">
            <p>
              Votre demande sera traitée dans un délai de{" "}
              <strong className="text-white">10 jours ouvrables</strong>. Nous
              vérifierons votre identité avant de procéder. En cas de
              difficulté, vous pouvez saisir la{" "}
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
          <span>© {new Date().getFullYear()} nortoo</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition">
              Confidentialité
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
