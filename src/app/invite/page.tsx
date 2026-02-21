"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InviteData {
  email: string;
  name: string;
  role: string;
  merchantName: string;
}

function InvitePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError("Token d'invitation manquant");
      setLoading(false);
      return;
    }

    async function validate() {
      try {
        const res = await fetch(
          `/api/team/accept-invite?token=${encodeURIComponent(token!)}`
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Invitation invalide");
        } else {
          setInviteData(json.data);
          setName(json.data.name);
        }
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }

    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/team/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de l'activation");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snow">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snow px-4">
        <div className="w-full max-w-md rounded-xl border border-silk bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-mint" />
          <h1 className="mt-4 font-display text-xl font-bold text-midnight">
            Compte activé !
          </h1>
          <p className="mt-2 text-sm text-fog">
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  // Error (no invite data)
  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snow px-4">
        <div className="w-full max-w-md rounded-xl border border-silk bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-rose" />
          <h1 className="mt-4 font-display text-xl font-bold text-midnight">
            Invitation invalide
          </h1>
          <p className="mt-2 text-sm text-fog">
            {error ?? "Ce lien d'invitation n'est plus valide."}
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => router.push("/login")}
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-snow px-4">
      <div className="w-full max-w-md rounded-xl border border-silk bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-mint">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0F1A"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M3 6h18M7 12h10M10 18h4" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-midnight">
            Rejoindre {inviteData.merchantName}
          </h1>
          <p className="mt-1 text-sm text-fog">
            Vous êtes invité(e) en tant que{" "}
            <span className="font-medium text-slate">{inviteData.role}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-rose/10 border border-rose/20 px-4 py-3">
            <p className="text-sm text-rose">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              Email
            </label>
            <input
              type="email"
              value={inviteData.email}
              readOnly
              className="w-full rounded-lg border border-silk bg-snow px-3 py-2.5 text-sm text-fog"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-silk px-3 py-2.5 text-sm text-midnight focus:border-mint focus:ring-1 focus:ring-mint outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 caractères"
              className="w-full rounded-lg border border-silk px-3 py-2.5 text-sm text-midnight focus:border-mint focus:ring-1 focus:ring-mint outline-none"
            />
          </div>

          {/* Password confirm */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-silk px-3 py-2.5 text-sm text-midnight focus:border-mint focus:ring-1 focus:ring-mint outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Activer mon compte
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-snow">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
        </div>
      }
    >
      <InvitePageInner />
    </Suspense>
  );
}
