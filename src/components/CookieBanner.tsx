"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = document.cookie
      .split("; ")
      .find((c) => c.startsWith("nortoo_cookies="));
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    document.cookie =
      "nortoo_cookies=accepted; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-2xl mx-auto bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-[#CBD5E1]">
          <p>
            nortoo utilise uniquement des{" "}
            <strong className="text-white">cookies techniques</strong>{" "}
            nécessaires au fonctionnement du service (session, langue). Aucun
            cookie publicitaire ou de tracking.{" "}
            <Link
              href="/privacy#cookies"
              className="text-[#00E5A0] hover:underline"
            >
              En savoir plus
            </Link>
          </p>
        </div>
        <button
          onClick={accept}
          className="px-5 py-2.5 bg-[#00E5A0] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00C78A] transition text-sm whitespace-nowrap"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
