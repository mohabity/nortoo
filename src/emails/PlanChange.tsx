import { Text, Section, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface PlanChangeProps {
  merchantName: string;
  type: "upgrade" | "downgrade";
  previousPlan: string;
  newPlan: string;
  effectiveDate?: string;
  invoiceAmount?: string;
  locale?: Locale;
}

export function PlanChange({
  merchantName,
  type,
  previousPlan,
  newPlan,
  effectiveDate,
  invoiceAmount,
  locale = "fr",
}: PlanChangeProps) {
  const isUpgrade = type === "upgrade";

  return (
    <NortooLayout
      preview={t(
        locale,
        isUpgrade ? "planChange.upgrade.preview" : "planChange.downgrade.preview",
        { newPlan },
      )}
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
        {t(
          locale,
          isUpgrade ? "planChange.upgrade.heading" : "planChange.downgrade.heading",
          { newPlan },
        )}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}
      >
        {t(locale, "planChange.greeting", { name: merchantName })}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(
          locale,
          isUpgrade ? "planChange.upgrade.body" : "planChange.downgrade.body",
          {
            previousPlan,
            newPlan,
            amount: invoiceAmount ?? "",
            effectiveDate: effectiveDate ?? "",
          },
        )}
      </Text>

      {/* Plan change info box */}
      <Section
        style={{
          backgroundColor: isUpgrade ? "#F0FDF4" : "#FFFBEB",
          border: `1px solid ${isUpgrade ? "#BBF7D0" : "#FDE68A"}`,
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
                {t(locale, "planChange.previousPlan")}
              </td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 600,
                  color: "#0B0F1A",
                }}
              >
                {previousPlan}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                {t(locale, "planChange.newPlan")}
              </td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 700,
                  color: isUpgrade ? "#059669" : "#D97706",
                }}
              >
                {newPlan}
              </td>
            </tr>
            {isUpgrade && invoiceAmount && (
              <tr>
                <td style={{ padding: "4px 0" }}>
                  {t(locale, "planChange.amount")}
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right" as const,
                    fontWeight: 700,
                    color: "#0B0F1A",
                  }}
                >
                  {invoiceAmount}
                </td>
              </tr>
            )}
            {!isUpgrade && effectiveDate && (
              <tr>
                <td style={{ padding: "4px 0" }}>
                  {t(locale, "planChange.effectiveDate")}
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right" as const,
                    fontWeight: 600,
                    color: "#D97706",
                  }}
                >
                  {effectiveDate}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Button
        href="https://app.nortoo.ma/dashboard/billing"
        style={{
          display: "inline-block",
          backgroundColor: isUpgrade ? "#00E5A0" : "#F59E0B",
          color: isUpgrade ? "#0B0F1A" : "#FFFFFF",
          fontWeight: 600,
          padding: "12px 32px",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: "0.9rem",
        }}
      >
        {t(
          locale,
          isUpgrade ? "planChange.upgrade.cta" : "planChange.downgrade.cta",
        )}
      </Button>
    </NortooLayout>
  );
}

PlanChange.PreviewProps = {
  merchantName: "Ma Boutique",
  type: "upgrade",
  previousPlan: "Starter",
  newPlan: "Pro",
  invoiceAmount: "466,00 DH",
} satisfies PlanChangeProps;

export default PlanChange;
