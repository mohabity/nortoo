import { Text, Section, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface InvoiceProps {
  merchantName: string;
  invoiceNumber: string;
  period: string;
  amountTTC: string;
  dueDate: string;
  rib: string;
  iban: string;
  swift: string;
  locale?: Locale;
}

export function Invoice({
  merchantName,
  invoiceNumber,
  period,
  amountTTC,
  dueDate,
  rib,
  iban,
  swift,
  locale = "fr",
}: InvoiceProps) {
  return (
    <NortooLayout
      preview={t(locale, "invoice.preview", { invoiceNumber })}
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
        {t(locale, "invoice.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "invoice.greeting", { merchantName })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "invoice.body", { invoiceNumber, period })}
      </Text>

      {/* Amount info box */}
      <Section
        style={{
          backgroundColor: "#F8FAFC",
          borderRadius: 10,
          padding: 16,
          margin: "0 0 24px",
        }}
      >
        <table
          style={{
            width: "100%",
            fontSize: "0.85rem",
            color: "#64748B",
            borderCollapse: "collapse" as const,
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "4px 0" }}>
                {t(locale, "invoice.amount_label")}
              </td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 700,
                  color: "#0B0F1A",
                }}
              >
                {amountTTC}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                {t(locale, "invoice.due_label")}
              </td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 600,
                  color: "#0B0F1A",
                }}
              >
                {dueDate}
              </td>
            </tr>
          </tbody>
        </table>
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
          {t(locale, "invoice.bank_heading")}
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
          {t(locale, "invoice.transfer_ref")}{" "}
          <strong>{invoiceNumber}</strong>
        </Text>
      </Section>

      <Button
        href="https://app.nortoo.ma/dashboard/billing"
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
        {t(locale, "invoice.cta")}
      </Button>
    </NortooLayout>
  );
}

Invoice.PreviewProps = {
  merchantName: "Ma Boutique",
  invoiceNumber: "NRT-2026-001",
  period: "F\u00e9vrier 2026",
  amountTTC: "699,00 DH",
  dueDate: "15 mars 2026",
  rib: "007 780 0001234567890123 45",
  iban: "MA64 007 780 0001234567890123 45",
  swift: "BMCEMAMC",
} satisfies InvoiceProps;

export default Invoice;
