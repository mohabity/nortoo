import { Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface WelcomeProps {
  name: string;
  dashboardUrl: string;
  locale?: Locale;
}

export function Welcome({ name, dashboardUrl, locale = "fr" }: WelcomeProps) {
  return (
    <NortooLayout
      preview={t(locale, "welcome.preview")}
      locale={locale}
    >
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        {t(locale, "welcome.heading", { name })}
      </Text>

      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "welcome.body")}
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
          margin: "0 0 16px",
        }}
      >
        {t(locale, "welcome.steps_heading")}
      </Text>

      {/* Step 1 */}
      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 12px",
          paddingLeft: 4,
        }}
      >
        <strong style={{ color: "#00E5A0" }}>1.</strong>{" "}
        <strong style={{ color: "#0B0F1A" }}>
          {t(locale, "welcome.step1_label")}
        </strong>{" "}
        — {t(locale, "welcome.step1_detail")}
      </Text>

      {/* Step 2 */}
      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 12px",
          paddingLeft: 4,
        }}
      >
        <strong style={{ color: "#00E5A0" }}>2.</strong>{" "}
        <strong style={{ color: "#0B0F1A" }}>
          {t(locale, "welcome.step2_label")}
        </strong>{" "}
        — {t(locale, "welcome.step2_detail")}
      </Text>

      {/* Step 3 */}
      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
          paddingLeft: 4,
        }}
      >
        <strong style={{ color: "#00E5A0" }}>3.</strong>{" "}
        <strong style={{ color: "#0B0F1A" }}>
          {t(locale, "welcome.step3_label")}
        </strong>{" "}
        — {t(locale, "welcome.step3_detail")}
      </Text>

      <Button
        href={dashboardUrl}
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
        {t(locale, "welcome.cta")}
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

Welcome.PreviewProps = {
  name: "Fatima",
  dashboardUrl: "https://app.nortoo.ma/dashboard",
} satisfies WelcomeProps;

export default Welcome;
