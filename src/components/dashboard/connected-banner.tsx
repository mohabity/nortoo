"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Rocket, X } from "lucide-react";

const DISMISS_KEY_CONNECTED = "codpilot_dismiss_connected";
const DISMISS_KEY_WELCOME = "codpilot_dismiss_welcome";

/**
 * Shows a success toast when ?connected=true or ?welcome=true is in the URL.
 * - connected=true: green mint banner (reconnect/link)
 * - welcome=true: warm sun banner (new account)
 * Auto-dismisses after 6s / 10s. Persists dismiss in localStorage.
 */
export function ConnectedBanner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const welcome = searchParams.get("welcome");
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<"connected" | "welcome">("connected");

  useEffect(() => {
    if (welcome === "true") {
      if (localStorage.getItem(DISMISS_KEY_WELCOME)) return;
      setVariant("welcome");
      setVisible(true);
      const timer = setTimeout(() => dismiss("welcome"), 10000);
      return () => clearTimeout(timer);
    }
    if (connected === "true") {
      if (localStorage.getItem(DISMISS_KEY_CONNECTED)) return;
      setVariant("connected");
      setVisible(true);
      const timer = setTimeout(() => dismiss("connected"), 6000);
      return () => clearTimeout(timer);
    }
  }, [connected, welcome]);

  function dismiss(v: "connected" | "welcome") {
    setVisible(false);
    localStorage.setItem(
      v === "welcome" ? DISMISS_KEY_WELCOME : DISMISS_KEY_CONNECTED,
      "1"
    );
  }

  if (!visible) return null;

  const isWelcome = variant === "welcome";

  return (
    <div
      className={`mx-6 mt-4 flex items-center gap-3 rounded-sm border px-4 py-3 shadow-sm animate-in slide-in-from-top-2 ${
        isWelcome
          ? "border-sun/30 bg-sun-light"
          : "border-mint/30 bg-mint-light"
      }`}
    >
      {isWelcome ? (
        <Rocket className="h-5 w-5 flex-shrink-0 text-sun-deep" />
      ) : (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-mint-deep" />
      )}
      <p
        className={`flex-1 text-sm font-medium ${
          isWelcome ? "text-sun-deep" : "text-mint-deep"
        }`}
      >
        {isWelcome
          ? "Bienvenue sur CODPilot ! Votre boutique est connectée et prête à scorer vos commandes COD."
          : "Boutique connectée avec succès ! Les commandes COD seront scorées automatiquement."}
      </p>
      <button
        onClick={() => dismiss(variant)}
        className={`rounded-xs p-1 transition-colors ${
          isWelcome
            ? "text-sun-deep/60 hover:bg-sun/20 hover:text-sun-deep"
            : "text-mint-deep/60 hover:bg-mint/20 hover:text-mint-deep"
        }`}
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
