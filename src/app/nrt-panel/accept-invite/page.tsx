"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Lock, User } from "lucide-react";

interface InviteData {
  email: string;
  name: string;
}

function AcceptInviteInner() {
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
          `/api/nrt-panel/admin-invites/accept?token=${encodeURIComponent(token!)}`
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
      const res = await fetch("/api/nrt-panel/admin-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de l'activation");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/nrt-panel/login"), 2000);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-snow">
        <Loader2 className="w-6 h-6 animate-spin text-mint" />
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-snow p-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-mint" />
          <h1 className="mt-4 text-lg font-semibold text-midnight">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-snow p-4">
        <div className="w-full max-w-sm text-center">
          <XCircle className="mx-auto h-12 w-12 text-rose" />
          <h1 className="mt-4 text-lg font-semibold text-midnight">
            Invitation invalide
          </h1>
          <p className="mt-2 text-sm text-fog">
            {error ?? "Ce lien d'invitation n'est plus valide."}
          </p>
          <button
            onClick={() => router.push("/nrt-panel/login")}
            className="mt-6 text-sm text-fog hover:text-slate transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-snow p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-10 w-auto" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-mint bg-mint/10 px-2 py-0.5 rounded">
              admin
            </span>
          </div>
          <p className="text-sm text-fog mt-2">Activer votre compte admin</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-rose/5 border border-rose/20 rounded-sm">
            <p className="text-sm text-rose">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={inviteData.email}
              readOnly
              className="w-full px-4 py-2.5 bg-snow border border-silk rounded-sm text-fog text-sm"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1.5">
              <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
            />
          </div>

          {/* Password confirm */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1.5">
              <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name || !password || !passwordConfirm}
            className="w-full py-2.5 bg-midnight text-white font-semibold text-sm rounded-sm hover:bg-midnight/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activation...
              </>
            ) : (
              "Activer mon compte"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-mist mt-6">
          Accès réservé à l&apos;équipe nortoo
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-snow">
          <Loader2 className="w-6 h-6 animate-spin text-mint" />
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
