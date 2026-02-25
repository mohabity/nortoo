import { Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";

interface WelcomeProps {
  name: string;
  dashboardUrl: string;
}

export function Welcome({ name, dashboardUrl }: WelcomeProps) {
  return (
    <NortooLayout preview="Bienvenue sur nortoo — votre essai de 14 jours commence">
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        Bienvenue sur nortoo, {name}&nbsp;!
      </Text>

      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        Votre compte est cr&eacute;&eacute; et votre essai gratuit de{" "}
        <strong style={{ color: "#0B0F1A" }}>14 jours</strong> commence
        d&egrave;s maintenant. nortoo analyse chaque commande COD et vous aide
        &agrave; bloquer les retours avant qu&apos;ils ne co&ucirc;tent cher.
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
        3 &eacute;tapes pour d&eacute;marrer&nbsp;:
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
        <strong style={{ color: "#0B0F1A" }}>Connectez votre boutique</strong>{" "}
        — YouCan en un clic, ou via notre API universelle.
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
          Configurez vos seuils de scoring
        </strong>{" "}
        — choisissez un preset (Permissif, &Eacute;quilibr&eacute; ou Strict)
        ou ajustez finement.
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
          Regardez vos commandes se scorer
        </strong>{" "}
        — chaque commande re&ccedil;oit un score 0-100 en temps r&eacute;el.
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
        Acc&eacute;der &agrave; mon dashboard
      </Button>

      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        Besoin d&apos;aide ? R&eacute;pondez &agrave; cet email ou contactez{" "}
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
