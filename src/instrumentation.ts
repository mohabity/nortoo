import * as Sentry from "@sentry/nextjs";

/**
 * Next.js 15 instrumentation hook.
 * Loads Sentry config based on the runtime (Node.js or Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
