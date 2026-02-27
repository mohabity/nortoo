import { Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface TrialReminderProps {
  name: string;
  daysRemaining: number;
  billingUrl: string;
  locale?: Locale;
}

export function TrialReminder({
  name,
  daysRemaining,
  billingUrl,
  locale = "fr",
}: TrialReminderProps) {
  // Pick body text based on urgency
  const bodyKey =
    daysRemaining <= 1
      ? "trialReminder.body_1"
      : daysRemaining <= 3
        ? "trialReminder.body_3"
        : "trialReminder.body_7";

  // Urgency color: green (7d), orange (3d), red (1d)
  const accentColor =
    daysRemaining <= 1 ? "#EF4444" : daysRemaining <= 3 ? "#F59E0B" : "#00E5A0";

  return (
    <NortooLayout
      preview={t(locale, "trialReminder.preview", { daysRemaining })}
      locale={locale}
    >
      {/* Badge */}
      <Text
        style={{
          display: "inline-block",
          backgroundColor: accentColor + "18",
          color: accentColor,
          fontSize: "0.75rem",
          fontWeight: 700,
          padding: "4px 12px",
          borderRadius: 20,
          margin: "0 0 16px",
        }}
      >
        {t(locale, "trialReminder.badge", { daysRemaining })}
      </Text>

      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 8px",
          fontWeight: 600,
        }}
      >
        {t(locale, "trialReminder.greeting", { name })}
      </Text>

      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, bodyKey as Parameters<typeof t>[1], { daysRemaining })}
      </Text>

      <Hr
        style={{
          borderColor: "#E2E8F0",
          margin: "0 0 20px",
        }}
      />

      <Text
        style={{
          fontSize: "0.85rem",
          color: "#0B0F1A",
          fontWeight: 600,
          margin: "0 0 12px",
        }}
      >
        {t(locale, "trialReminder.features_heading")}
      </Text>

      {/* Feature 1 */}
      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
          paddingLeft: 4,
        }}
      >
        <strong style={{ color: "#00E5A0" }}>✓</strong>{" "}
        {t(locale, "trialReminder.feature_1")}
      </Text>

      {/* Feature 2 */}
      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
          paddingLeft: 4,
        }}
      >
        <strong style={{ color: "#00E5A0" }}>✓</strong>{" "}
        {t(locale, "trialReminder.feature_2")}
      </Text>

      {/* Feature 3 */}
      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
          paddingLeft: 4,
        }}
      >
        <strong style={{ color: "#00E5A0" }}>✓</strong>{" "}
        {t(locale, "trialReminder.feature_3")}
      </Text>

      <Button
        href={billingUrl}
        style={{
          display: "inline-block",
          backgroundColor: "#00E5A0",
          color: "#0B0F1A",
          fontWeight: 600,
          padding: "12px 32px",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: "0.9rem",
        }}
      >
        {t(locale, "trialReminder.cta")}
      </Button>

      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        {t(locale, "global.support_hint")}{" "}
        <a
          href="mailto:support@nortoo.ma"
          style={{ color: "#00E5A0", textDecoration: "underline" }}
        >
          support@nortoo.ma
        </a>
      </Text>
    </NortooLayout>
  );
}

TrialReminder.PreviewProps = {
  name: "Fatima",
  daysRemaining: 3,
  billingUrl: "https://app.nortoo.ma/dashboard/billing",
} satisfies TrialReminderProps;

export default TrialReminder;
