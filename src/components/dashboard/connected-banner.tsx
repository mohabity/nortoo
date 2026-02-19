"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

/**
 * Shows a green success toast when ?connected=true is in the URL.
 * Auto-dismisses after 6 seconds.
 */
export function ConnectedBanner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (connected === "true") {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [connected]);

  if (!visible) return null;

  return (
    <div className="mx-6 mt-4 flex items-center gap-3 rounded-sm border border-mint/30 bg-mint-light px-4 py-3 shadow-sm animate-in slide-in-from-top-2">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-mint-deep" />
      <p className="flex-1 text-sm font-medium text-mint-deep">
        Boutique connectée avec succès ! Les commandes COD seront scorées automatiquement.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="rounded-xs p-1 text-mint-deep/60 hover:bg-mint/20 hover:text-mint-deep transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
