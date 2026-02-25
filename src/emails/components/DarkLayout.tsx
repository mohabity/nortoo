import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface DarkLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

export function NortooDarkLayout({ children, preview }: DarkLayoutProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          backgroundColor: "#0B0F1A",
        }}
      >
        <Container
          style={{
            maxWidth: 600,
            margin: "0 auto",
            backgroundColor: "#0F172A",
            borderRadius: 16,
            border: "1px solid #1E293B",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Section
            style={{
              padding: "24px 32px",
              borderBottom: "1px solid #1E293B",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontWeight: 900,
                fontSize: "1.4rem",
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
                display: "inline",
              }}
            >
              nortoo
            </Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section
            style={{
              padding: "16px 32px",
              backgroundColor: "#0B0F1A",
              borderTop: "1px solid #1E293B",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: "#475569",
                margin: 0,
                textAlign: "center" as const,
              }}
            >
              {"nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648 \u2014 \u0632\u064a\u0631\u0648 \u0631\u062a\u0648\u0631"}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: "#334155",
                margin: "6px 0 0",
                textAlign: "center" as const,
              }}
            >
              Ce rapport est envoy&eacute; automatiquement chaque lundi.{" "}
              <Link
                href="https://app.nortoo.ma/dashboard/settings"
                style={{ color: "#64748B", textDecoration: "underline" }}
              >
                G&eacute;rer les notifications
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NortooDarkLayout;
