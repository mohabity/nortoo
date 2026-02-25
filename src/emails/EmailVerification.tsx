import { Text, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";

interface EmailVerificationProps {
  verifyUrl: string;
}

export function EmailVerification({ verifyUrl }: EmailVerificationProps) {
  return (
    <NortooLayout preview="V\u00e9rifiez votre adresse email nortoo">
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        V&eacute;rifiez votre email
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        Bienvenue sur nortoo ! Cliquez sur le bouton ci-dessous pour
        v&eacute;rifier votre adresse email.
      </Text>
      <Button
        href={verifyUrl}
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
        V&eacute;rifier mon email
      </Button>
      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        Ce lien expire dans 24 heures.
      </Text>
    </NortooLayout>
  );
}

EmailVerification.PreviewProps = {
  verifyUrl: "https://app.nortoo.ma/api/auth/verify-email?token=example-token",
} satisfies EmailVerificationProps;

export default EmailVerification;
