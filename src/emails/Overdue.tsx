import { Text, Section, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface OverdueProps {
  merchantName: string;
  invoiceNumber: string;
  amountTTC: string;
  dueDate: string;
  rib: string;
  iban: string;
  swift: string;
  locale?: Locale;
}

export function Overdue({
  merchantName,
  invoiceNumber,
  amountTTC,
  dueDate,
  rib,
  iban,
  swift,
  locale = "fr",
}: OverdueProps) {
  return (
    <NortooLayout
      preview={t(locale, "overdue.preview", { invoiceNumber })}
      locale={locale}
    >
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#F43F5E",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        {t(locale, "overdue.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "overdue.greeting", { merchantName })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "overdue.body", { invoiceNumber, amountTTC, dueDate })}
      </Text>

      {/* Warning box */}
      <Section
        style={{
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 10,
          padding: 16,
          margin: "0 0 24px",
        }}
      >
        <Text
          style={{
            fontSize: "0.85rem",
            color: "#DC2626",
            fontWeight: 600,
            margin: "0 0 6px",
          }}
        >
          {t(locale, "overdue.warning_heading")}
        </Text>
        <Text
          style={{
            fontSize: "0.8rem",
            color: "#64748B",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {t(locale, "overdue.warning_body")}
        </Text>
      </Section>

      {/* Bank details box */}
      <Section
        style={{
          backgroundColor: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: 10,
          padding: 16,
          margin: "0 0 24px",
        }}
      >
        <Text
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#059669",
            margin: "0 0 8px",
          }}
        >
          {t(locale, "overdue.bank_heading")}
        </Text>
        <Text
          style={{
            fontSize: "0.8rem",
            color: "#64748B",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          RIB : {rib}
          <br />
          IBAN : {iban}
          <br />
          SWIFT : {swift}
        </Text>
        <Text
          style={{
            fontSize: "0.75rem",
            color: "#94A3B8",
            margin: "8px 0 0",
          }}
        >
          {t(locale, "overdue.transfer_ref")}{" "}
          <strong>{invoiceNumber}</strong>
        </Text>
      </Section>

      <Button
        href="https://app.nortoo.ma/dashboard/billing"
        style={{
          display: "inline-block",
          backgroundColor: "#F43F5E",
          color: "#FFFFFF",
          fontWeight: 600,
          padding: "12px 32px",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: "0.9rem",
        }}
      >
        {t(locale, "overdue.cta")}
      </Button>
    </NortooLayout>
  );
}

Overdue.PreviewProps = {
  merchantName: "Ma Boutique",
  invoiceNumber: "NRT-2026-001",
  amountTTC: "699,00 DH",
  dueDate: "15 f\u00e9vrier 2026",
  rib: "007 780 0001234567890123 45",
  iban: "MA64 007 780 0001234567890123 45",
  swift: "BMCEMAMC",
} satisfies OverdueProps;

export default Overdue;
