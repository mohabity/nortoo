import { Text, Section, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface AdminApprovalRequestProps {
  adminName: string;
  adminEmail: string;
  createdAt: string;
  locale?: Locale;
}

export function AdminApprovalRequest({
  adminName,
  adminEmail,
  createdAt,
  locale = "fr",
}: AdminApprovalRequestProps) {
  return (
    <NortooLayout
      preview={t(locale, "adminApproval.preview")}
      locale={locale}
    >
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 8px",
          fontWeight: 600,
        }}
      >
        {t(locale, "adminApproval.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 20px",
        }}
      >
        {t(locale, "adminApproval.body")}
      </Text>

      {/* Account details */}
      <Section
        style={{
          backgroundColor: "#F1F5F9",
          borderRadius: 10,
          padding: "16px 20px",
          margin: "0 0 20px",
        }}
      >
        <Text style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 6px" }}>
          <strong style={{ color: "#0B0F1A" }}>{t(locale, "adminApproval.name_label")}</strong>
          {" : "}{adminName}
        </Text>
        <Text style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 6px" }}>
          <strong style={{ color: "#0B0F1A" }}>{t(locale, "adminApproval.email_label")}</strong>
          {" : "}{adminEmail}
        </Text>
        <Text style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>
          <strong style={{ color: "#0B0F1A" }}>{t(locale, "adminApproval.date_label")}</strong>
          {" : "}{createdAt}
        </Text>
      </Section>

      <Text
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        {t(locale, "adminApproval.action")}
      </Text>

      <Button
        href="https://app.nortoo.ma/nrt-panel"
        style={{
          display: "inline-block",
          backgroundColor: "#0B0F1A",
          color: "#FFFFFF",
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "12px 24px",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        {t(locale, "adminApproval.cta")}
      </Button>
    </NortooLayout>
  );
}

AdminApprovalRequest.PreviewProps = {
  adminName: "Mohamed",
  adminEmail: "mohamed@nortoo.ma",
  createdAt: "27/02/2026 14:30",
} satisfies AdminApprovalRequestProps;

export default AdminApprovalRequest;
