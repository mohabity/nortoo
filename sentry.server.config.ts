import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: 0.2,

  // CRITICAL: Never send request bodies to Sentry (Loi 09-08 — PII protection)
  beforeSend(event) {
    if (event.request?.data) {
      delete event.request.data;
    }

    // Strip IP
    if (event.user) {
      delete event.user.ip_address;
    }

    return event;
  },
});
