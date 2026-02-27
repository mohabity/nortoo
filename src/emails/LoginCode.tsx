import { Text, Section } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface LoginCodeProps {
  code: string;
  name: string;
  locale?: Locale;
}

export function LoginCode({
  code,
  name,
  locale = "fr",
}: LoginCodeProps) {
  return (
    <NortooLayout
      preview={t(locale, "loginCode.preview")}
      locale={locale}
    >
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 8px",
          fontWeight: 600,
        }}
      >
        {t(locale, "loginCode.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "loginCode.greeting", { name })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "loginCode.body")}
      </Text>

      {/* 6-digit code displayed prominently */}
      <Section
        style={{
          backgroundColor: "#F1F5F9",
          borderRadius: 10,
          padding: "20px 24px",
          margin: "0 0 24px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "#0B0F1A",
            letterSpacing: "0.3em",
            margin: 0,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          }}
        >
          {code}
        </Text>
      </Section>

      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "0",
          lineHeight: 1.5,
        }}
      >
        {t(locale, "loginCode.expiry")}
      </Text>
    </NortooLayout>
  );
}

LoginCode.PreviewProps = {
  code: "391847",
  name: "Boutique",
} satisfies LoginCodeProps;

export default LoginCode;
