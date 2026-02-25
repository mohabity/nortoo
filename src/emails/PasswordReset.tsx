import { Text, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface PasswordResetProps {
  resetUrl: string;
  locale?: Locale;
}

export function PasswordReset({
  resetUrl,
  locale = "fr",
}: PasswordResetProps) {
  return (
    <NortooLayout
      preview={t(locale, "passwordReset.preview")}
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
        {t(locale, "passwordReset.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "passwordReset.body")}
      </Text>
      <Button
        href={resetUrl}
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
        {t(locale, "passwordReset.cta")}
      </Button>
      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        {t(locale, "passwordReset.expiry")}
      </Text>
    </NortooLayout>
  );
}

PasswordReset.PreviewProps = {
  resetUrl: "https://app.nortoo.ma/auth/reset-password?token=example-token",
} satisfies PasswordResetProps;

export default PasswordReset;
