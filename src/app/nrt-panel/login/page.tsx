"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, Key, User, ShieldCheck } from "lucide-react";

type Step = "loading" | "setup" | "credentials" | "mfa";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");

  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // MFA
  const [code, setCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Setup
  const [setupKey, setSetupKey] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");

  // UI
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Check if setup is needed on mount ──
  useEffect(() => {
    fetch("/api/nrt-panel/setup")
      .then((r) => r.json())
      .then((data) => setStep(data.needsSetup ? "setup" : "credentials"))
      .catch(() => setStep("credentials"));
  }, []);

  // ── Setup: create first admin ──
  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/nrt-panel/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupKey,
          email: setupEmail,
          password: setupPassword,
          name: setupName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la configuration");
        setLoading(false);
        return;
      }

      // Setup done — switch to login with pre-filled email
      setEmail(setupEmail);
      setPassword("");
      setStep("credentials");
      setLoading(false);
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  // ── Step 1: email + password → send MFA code ──
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/nrt-panel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        setLoading(false);
        return;
      }

      if (data.mfaRequired) {
        setStep("mfa");
        setLoading(false);
        // Auto-focus code input after render
        setTimeout(() => codeInputRef.current?.focus(), 100);
      }
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  // ── Step 2: MFA code verification ──
  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/nrt-panel/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code invalide");
        setLoading(false);
        return;
      }

      router.push("/nrt-panel");
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  // ── Loading state ──
  if (step === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-snow">
        <Loader2 className="w-6 h-6 animate-spin text-mint" />
      </div>
    );
  }

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
          <p className="text-sm text-fog mt-2">
            {step === "setup"
              ? "Configuration initiale"
              : step === "mfa"
                ? "Vérification en deux étapes"
                : "Panel d\u2019administration interne"}
          </p>
        </div>

        {/* ═══ SETUP FORM ═══ */}
        {step === "setup" && (
          <form onSubmit={handleSetup} className="space-y-4">
            <p className="text-xs text-fog text-center mb-2">
              Aucun compte admin n&apos;existe. Créez le premier compte.
            </p>

            <div>
              <label htmlFor="setupKey" className="block text-sm font-medium text-slate mb-1.5">
                <Key className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Clé de configuration
              </label>
              <input
                id="setupKey"
                type="password"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                placeholder="ADMIN_SECRET"
                className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="setupName" className="block text-sm font-medium text-slate mb-1.5">
                <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Nom
              </label>
              <input
                id="setupName"
                type="text"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="setupEmail" className="block text-sm font-medium text-slate mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Email
              </label>
              <input
                id="setupEmail"
                type="email"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                placeholder="admin@nortoo.ma"
                className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="setupPassword" className="block text-sm font-medium text-slate mb-1.5">
                <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Mot de passe
              </label>
              <input
                id="setupPassword"
                type="password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="8 caractères minimum"
                minLength={8}
                className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                required
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-rose/5 border border-rose/20 rounded-sm">
                <p className="text-sm text-rose">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !setupKey || !setupName || !setupEmail || !setupPassword}
              className="w-full py-2.5 bg-mint text-midnight font-semibold text-sm rounded-sm hover:bg-mint/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le compte admin"
              )}
            </button>
          </form>
        )}

        {/* ═══ CREDENTIALS FORM ═══ */}
        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nortoo.ma"
                className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate mb-1.5">
                <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-slate transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-rose/5 border border-rose/20 rounded-sm">
                <p className="text-sm text-rose">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 bg-midnight text-white font-semibold text-sm rounded-sm hover:bg-midnight/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        )}

        {/* ═══ MFA CODE FORM ═══ */}
        {step === "mfa" && (
          <form onSubmit={handleMfa} className="space-y-4">
            <div className="text-center mb-2">
              <ShieldCheck className="w-8 h-8 text-mint mx-auto mb-2" />
              <p className="text-sm text-fog">
                Un code de vérification a été envoyé à{" "}
                <strong className="text-midnight">{email}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate mb-1.5">
                Code de vérification
              </label>
              <input
                ref={codeInputRef}
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(val);
                }}
                placeholder="000000"
                className="w-full px-4 py-3 bg-white border border-silk rounded-sm text-midnight text-center text-xl font-mono tracking-[0.3em] placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-rose/5 border border-rose/20 rounded-sm">
                <p className="text-sm text-rose">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 bg-midnight text-white font-semibold text-sm rounded-sm hover:bg-midnight/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCode("");
                setError("");
                setStep("credentials");
              }}
              className="w-full text-sm text-fog hover:text-slate transition-colors"
            >
              Retour
            </button>
          </form>
        )}

        <p className="text-center text-xs text-mist mt-6">
          Accès réservé à l&apos;équipe nortoo
        </p>
      </div>
    </div>
  );
}
