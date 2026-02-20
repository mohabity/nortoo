"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, AlertTriangle, X, Loader2, Send } from "lucide-react";

const DISMISS_KEY = "email-verify-dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface VerifyStatus {
  email: string;
  emailVerified: string | null;
  createdAt: string;
}

export function EmailVerificationBanner() {
  const searchParams = useSearchParams();
  const verifyParam = searchParams.get("verify");

  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [dismissed, setDismissed] = useState(true); // hidden until checked
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Show toast for verify query param
  useEffect(() => {
    if (verifyParam === "success") {
      setToast({ type: "success", message: "Email vérifié avec succès !" });
    } else if (verifyParam === "invalid") {
      setToast({ type: "error", message: "Lien de vérification invalide." });
    } else if (verifyParam === "expired") {
      setToast({ type: "info", message: "Ce lien a expiré. Renvoyez un email de vérification." });
    }

    if (verifyParam) {
      // Clear toast after 5s
      const timer = setTimeout(() => setToast(null), 5000);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      return () => clearTimeout(timer);
    }
  }, [verifyParam]);

  // Fetch verification status
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setStatus({
            email: d.data.email,
            emailVerified: d.data.emailVerified,
            createdAt: d.data.createdAt,
          });
          // Check dismissal
          if (!d.data.emailVerified) {
            const dismissedAt = sessionStorage.getItem(DISMISS_KEY);
            if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION) {
              setDismissed(true);
            } else {
              setDismissed(false);
            }
          }
        }
      })
      .catch(() => {});
  }, [verifyParam]);

  const handleResend = useCallback(async () => {
    setSending(true);
    try {
      const res = await fetch("/api/auth/verify-email/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: "Email de vérification envoyé !" });
      } else {
        setToast({ type: "error", message: data.error || "Erreur lors de l'envoi" });
      }
    } catch {
      setToast({ type: "error", message: "Erreur lors de l'envoi" });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  // Already verified or loading
  if (!status || status.emailVerified) {
    // Still show verify toasts even if verified
    return toast ? (
      <div className="mx-4 mt-3 lg:mx-6 lg:mt-4">
        <VerifyToast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    ) : null;
  }

  // Check if past 7-day grace period
  const daysSinceCreation =
    (Date.now() - new Date(status.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const isRestricted = daysSinceCreation > 7;

  // Restricted banner (non-dismissable)
  if (isRestricted) {
    return (
      <div className="mx-4 mt-3 lg:mx-6 lg:mt-4 space-y-2">
        {toast && <VerifyToast toast={toast} onDismiss={() => setToast(null)} />}
        <div className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 lg:px-5 lg:py-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose mt-0.5" />
              <div>
                <p className="text-sm font-medium text-midnight">
                  Certaines fonctionnalités sont limitées
                </p>
                <p className="text-xs text-fog mt-0.5">
                  Vérifiez votre email pour débloquer les exports et l&apos;API.
                </p>
              </div>
            </div>
            <button
              onClick={handleResend}
              disabled={sending}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-rose/30 bg-white px-3 py-2 text-xs font-medium text-rose hover:bg-rose/5 transition-colors disabled:opacity-50 sm:shrink-0"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Vérifier maintenant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Friendly reminder banner (dismissable)
  if (dismissed) {
    return toast ? (
      <div className="mx-4 mt-3 lg:mx-6 lg:mt-4">
        <VerifyToast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    ) : null;
  }

  return (
    <div className="mx-4 mt-3 lg:mx-6 lg:mt-4 space-y-2">
      {toast && <VerifyToast toast={toast} onDismiss={() => setToast(null)} />}
      <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3 lg:px-5 lg:py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 shrink-0 text-amber mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight">
                Vérifiez votre email
              </p>
              <p className="text-xs text-fog mt-0.5">
                Un email de vérification a été envoyé à{" "}
                <span className="font-medium text-slate">{status.email}</span>.
                Vérifiez vos spams si vous ne le trouvez pas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              onClick={handleResend}
              disabled={sending}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber/30 bg-white px-3 py-2 text-xs font-medium text-amber hover:bg-amber/5 transition-colors disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Renvoyer
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-mist hover:text-slate hover:bg-snow transition-colors"
              aria-label="Plus tard"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyToast({
  toast,
  onDismiss,
}: {
  toast: { type: "success" | "error" | "info"; message: string };
  onDismiss: () => void;
}) {
  const colors = {
    success: "border-l-mint bg-mint-bg/50",
    error: "border-l-rose bg-rose-bg/50",
    info: "border-l-amber bg-amber-bg/50",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-l-4 px-4 py-3 shadow-sm animate-in slide-in-from-top-2 ${colors[toast.type]}`}
    >
      <p className="flex-1 text-sm text-slate">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-mist hover:text-slate p-0.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
