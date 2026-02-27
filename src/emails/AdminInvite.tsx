import { Text, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface AdminInviteProps {
  inviteUrl: string;
  inviterName: string;
  locale?: Locale;
}

export function AdminInvite({
  inviteUrl,
  inviterName,
  locale = "fr",
}: AdminInviteProps) {
  return (
    <NortooLayout
      preview={t(locale, "adminInvite.preview")}
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
        {t(locale, "adminInvite.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "adminInvite.body1", { inviterName })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "adminInvite.body2")}
      </Text>

      <Button
        href={inviteUrl}
        style={{
          display: "inline-block",
          backgroundColor: "#0B0F1A",
          color: "#FFFFFF",
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "12px 32px",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        {t(locale, "adminInvite.cta")}
      </Button>

      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        {t(locale, "adminInvite.expiry")}
      </Text>
    </NortooLayout>
  );
}

AdminInvite.PreviewProps = {
  inviteUrl: "https://app.nortoo.ma/nrt-panel/accept-invite?token=abc123",
  inviterName: "Mohamed",
} satisfies AdminInviteProps;

export default AdminInvite;
