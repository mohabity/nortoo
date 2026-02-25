import { Text, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";

interface TeamInviteProps {
  inviteUrl: string;
  merchantName: string;
  roleLabel: string;
}

export function TeamInvite({
  inviteUrl,
  merchantName,
  roleLabel,
}: TeamInviteProps) {
  return (
    <NortooLayout
      preview={`Vous \u00eates invit\u00e9(e) \u00e0 rejoindre ${merchantName} sur nortoo`}
    >
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        Vous &ecirc;tes invit&eacute;(e) !
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        Vous avez &eacute;t&eacute; invit&eacute;(e) &agrave; rejoindre{" "}
        <strong style={{ color: "#0B0F1A" }}>{merchantName}</strong> sur nortoo
        en tant que <strong style={{ color: "#0B0F1A" }}>{roleLabel}</strong>.
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        Cliquez sur le bouton ci-dessous pour cr&eacute;er votre mot de passe et
        activer votre compte.
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
        Accepter l&apos;invitation
      </Button>
      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        Ce lien expire dans 7 jours. Si vous n&apos;attendiez pas cette
        invitation, ignorez cet email.
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
