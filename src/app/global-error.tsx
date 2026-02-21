"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Global error boundary — captures unhandled errors to Sentry.
 * This is the last resort error handler for the entire app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#0B0F1A",
          color: "#e2e8f0",
          gap: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Une erreur est survenue
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
          L&apos;erreur a été signalée automatiquement.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#00E5A0",
            color: "#0B0F1A",
            border: "none",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
