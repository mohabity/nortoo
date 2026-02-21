import * as Sentry from "@sentry/nextjs";

// Required by Sentry SDK for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample 20% of transactions in production
  tracesSampleRate: 0.2,

  // Disable session replays (Loi 09-08 — no PII recording)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // CRITICAL: Strip PII before sending to Sentry (Loi 09-08 Art. 23)
  beforeSend(event) {
    // Redact Moroccan phone numbers from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((bc) => {
        if (bc.message) {
          bc.message = bc.message.replace(
            /(\+?212|0)[5-7]\d{8}/g,
            "[REDACTED_PHONE]"
          );
        }
        return bc;
      });
    }

    // Strip IP address
    if (event.user) {
      delete event.user.ip_address;
    }

    return event;
  },
});
