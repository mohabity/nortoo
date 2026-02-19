"use client";

import { useState, useEffect } from "react";
import { Link2, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "codpilot-connect-banner-dismissed";

interface ConnectStoreBannerProps {
  isStoreConnected: boolean;
}

export function ConnectStoreBanner({
  isStoreConnected,
}: ConnectStoreBannerProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check sessionStorage only on client
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
    setDismissed(wasDismissed);
  }, []);

  if (isStoreConnected || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="rounded-lg border border-sun/20 bg-gradient-to-r from-sun/10 to-sun-light p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: icon + text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sun/20">
            <Link2 className="h-4.5 w-4.5 text-sun-deep" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink-1 text-sm">
              Connectez votre boutique YouCan
            </p>
            <p className="text-sm text-ink-3 truncate">
              Recevez vos commandes COD et scoring en temps réel
            </p>
          </div>
        </div>

        {/* Right: CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm">
            <a href="/api/auth/youcan">
              Connecter YouCan
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
          <button
            onClick={handleDismiss}
            className="rounded-sm p-1.5 text-ink-4 hover:bg-sun/20 hover:text-ink-2 transition-colors"
            aria-label="Masquer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
