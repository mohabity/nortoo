import { Text, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";

interface PasswordResetProps {
  resetUrl: string;
}

export function PasswordReset({ resetUrl }: PasswordResetProps) {
  return (
    <NortooLayout preview="R\u00e9initialisez votre mot de passe nortoo">
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        R&eacute;initialisation de mot de passe
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        Vous avez demand&eacute; &agrave; r&eacute;initialiser votre mot de
        passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de
        passe.
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
        R&eacute;initialiser mon mot de passe
      </Button>
      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        Ce lien expire dans 1 heure. Si vous n&apos;avez pas fait cette
        demande, ignorez cet email.
      </Text>
    </NortooLayout>
  );
}

PasswordReset.PreviewProps = {
  resetUrl: "https://app.nortoo.ma/auth/reset-password?token=example-token",
} satisfies PasswordResetProps;

export default PasswordReset;
