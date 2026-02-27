import { Text, Section } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface AdminLoginCodeProps {
  code: string;
  name: string;
  locale?: Locale;
}

export function AdminLoginCode({
  code,
  name,
  locale = "fr",
}: AdminLoginCodeProps) {
  return (
    <NortooLayout
      preview={t(locale, "adminMfa.preview")}
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
        {t(locale, "adminMfa.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "adminMfa.greeting", { name })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "adminMfa.body")}
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
        {t(locale, "adminMfa.expiry")}
      </Text>
    </NortooLayout>
  );
}

AdminLoginCode.PreviewProps = {
  code: "483927",
  name: "Admin",
} satisfies AdminLoginCodeProps;

export default AdminLoginCode;
