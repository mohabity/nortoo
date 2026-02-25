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
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface DarkLayoutProps {
  children: React.ReactNode;
  preview?: string;
  locale?: Locale;
}

export function NortooDarkLayout({ children, preview, locale = "fr" }: DarkLayoutProps) {
  return (
    <Html lang={locale} dir="ltr">
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
              {t(locale, "global.footer.tagline")}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: "#334155",
                margin: "6px 0 0",
                textAlign: "center" as const,
              }}
            >
              {t(locale, "global.footer.weekly_auto")}{" "}
              <Link
                href="https://app.nortoo.ma/dashboard/settings"
                style={{ color: "#64748B", textDecoration: "underline" }}
              >
                {t(locale, "global.footer.manage_notifications")}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NortooDarkLayout;
