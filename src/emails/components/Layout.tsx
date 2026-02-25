import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
}

export function NortooLayout({ children, preview }: LayoutProps) {
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
          padding: "40px 20px",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          backgroundColor: "#F8FAFC",
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Section
            style={{
              padding: "24px 32px",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontWeight: 900,
                fontSize: "1.3rem",
                letterSpacing: "-0.04em",
                color: "#0B0F1A",
              }}
            >
              nortoo
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: 32 }}>{children}</Section>

          {/* Footer */}
          <Section
            style={{
              padding: "16px 32px",
              backgroundColor: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <Text
              style={{
                fontSize: "0.65rem",
                color: "#CBD5E1",
                margin: 0,
              }}
            >
              {"nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NortooLayout;
