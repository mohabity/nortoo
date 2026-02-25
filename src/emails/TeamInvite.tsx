import { Text, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface TeamInviteProps {
  inviteUrl: string;
  merchantName: string;
  roleLabel: string;
  locale?: Locale;
}

export function TeamInvite({
  inviteUrl,
  merchantName,
  roleLabel,
  locale = "fr",
}: TeamInviteProps) {
  return (
    <NortooLayout
      preview={t(locale, "teamInvite.preview", { merchantName })}
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
        {t(locale, "teamInvite.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "teamInvite.body1", { merchantName, roleLabel })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "teamInvite.body2")}
      </Text>
      <Button
        href={inviteUrl}
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
        {t(locale, "teamInvite.cta")}
      </Button>
      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        {t(locale, "teamInvite.expiry")}
      </Text>
    </NortooLayout>
  );
}

TeamInvite.PreviewProps = {
  inviteUrl: "https://app.nortoo.ma/auth/invite?token=example-token",
  merchantName: "Ma Boutique",
  roleLabel: "Manager",
} satisfies TeamInviteProps;

export default TeamInvite;
