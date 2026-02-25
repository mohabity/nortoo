"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Ticket, CheckCircle2, AlertTriangle, Loader2, LogIn } from "lucide-react";

interface CouponInfo {
  valid: boolean;
  type: string;
  description: string;
}

/**
 * /redeem?code=PROMO30
 * Public coupon redemption page.
 * Wrapped in Suspense because useSearchParams() requires it in Next.js 15.
 */
export default function RedeemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <RedeemContent />
    </Suspense>
  );
}

function RedeemContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";
  const { data: session, status: authStatus } = useSession();

  const [code, setCode] = useState(codeFromUrl);
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  // Auto-validate if code is in URL
  useEffect(() => {
    if (codeFromUrl) {
      validateCode(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  async function validateCode(c: string) {
    const trimmed = c.trim().toUpperCase();
    if (!trimmed) return;
    setValidating(true);
    setValidationError("");
    setCoupon(null);

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (res.ok && json.valid) {
        setCoupon(json);
      } else {
        setValidationError(json.error ?? "Coupon invalide ou expiré.");
      }
    } catch {
      setValidationError("Erreur de connexion.");
    } finally {
      setValidating(false);
    }
  }

  async function handleRedeem() {
    if (!code.trim() || redeeming) return;
    setRedeeming(true);
    setRedeemError("");

    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      if (res.ok) {
        setRedeemSuccess(true);
      } else {
        const json = await res.json().catch(() => null);
        setRedeemError(json?.error ?? "Erreur lors de l'application du coupon.");
      }
    } catch {
      setRedeemError("Erreur de connexion.");
    } finally {
      setRedeeming(false);
    }
  }

  const isAuthenticated = authStatus === "authenticated";
  const isLoading = authStatus === "loading";

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#00E5A0]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#00E5A0]" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M6 18V6l12 12V6" />
              </svg>
            </div>
            <span className="text-lg font-display font-bold text-[#0B0F1A]">nortoo</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {redeemSuccess ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-display font-bold text-[#0B0F1A] mb-2">
                Coupon appliqué !
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {coupon?.type === "trial_extension"
                  ? "Votre période d'essai a été prolongée."
                  : "Votre plan a été mis à jour avec succès."}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00E5A0] text-[#0B0F1A] font-medium text-sm hover:bg-[#00E5A0]/90 transition-colors"
              >
                Accéder au dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00E5A0]/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-[#00E5A0]" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-[#0B0F1A]">
                    Utiliser un coupon
                  </h2>
                  <p className="text-xs text-gray-500">
                    Entrez votre code pour activer votre offre
                  </p>
                </div>
              </div>

              {/* Code input + validate */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setValidationError("");
                    setCoupon(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && validateCode(code)}
                  placeholder="CODE PROMO"
                  className="flex-1 h-11 rounded-lg border border-gray-200 px-3 font-mono text-sm tracking-wider placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00E5A0]/40 focus:border-[#00E5A0]"
                  disabled={redeeming}
                />
                <button
                  onClick={() => validateCode(code)}
                  disabled={!code.trim() || validating}
                  className="h-11 px-4 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vérifier"}
                </button>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {validationError}
                </div>
              )}

              {/* Coupon details */}
              {coupon && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">Coupon valide</span>
                  </div>
                  <p className="text-sm text-emerald-600 ml-6">{coupon.description}</p>
                </div>
              )}

              {/* Redeem error */}
              {redeemError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {redeemError}
                </div>
              )}

              {/* Action button */}
              {coupon && (
                <div className="mt-2">
                  {isLoading ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : isAuthenticated ? (
                    <button
                      onClick={handleRedeem}
                      disabled={redeeming}
                      className="w-full h-11 rounded-lg bg-[#00E5A0] text-[#0B0F1A] font-medium text-sm hover:bg-[#00E5A0]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {redeeming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Application en cours...
                        </>
                      ) : (
                        "Appliquer le coupon"
                      )}
                    </button>
                  ) : (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/redeem?code=${code}`)}`}
                      className="w-full h-11 rounded-lg bg-[#0B0F1A] text-white font-medium text-sm hover:bg-[#0B0F1A]/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Se connecter pour appliquer
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Scoring anti-fraude COD &middot; Maroc
        </p>
      </div>
    </div>
  );
}
