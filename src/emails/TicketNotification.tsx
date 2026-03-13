import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";

interface TicketNotificationProps {
  ticketId: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  merchantName: string;
  merchantEmail: string;
  adminUrl: string;
  locale?: Locale;
}

export function TicketNotification({
  ticketId,
  subject,
  description,
  category,
  priority,
  merchantName,
  merchantEmail,
  adminUrl,
  locale = "fr",
}: TicketNotificationProps) {
  return (
    <NortooLayout
      preview={t(locale, "ticket.preview", { id: ticketId })}
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
        {t(locale, "ticket.heading")}
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 20px",
        }}
      >
        {t(locale, "ticket.body", { merchantName, merchantEmail })}
      </Text>

      {/* Ticket details */}
      <Section
        style={{
          backgroundColor: "#F1F5F9",
          borderRadius: 10,
          padding: "16px 20px",
          margin: "0 0 20px",
        }}
      >
        <Text
          style={{
            fontSize: "0.8rem",
            color: "#94A3B8",
            margin: "0 0 4px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
          }}
        >
          #{ticketId} · {category} · {priority}
        </Text>
        <Text
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#0B0F1A",
            margin: "0 0 8px",
          }}
        >
          {subject}
        </Text>
        <Text
          style={{
            fontSize: "0.85rem",
            color: "#64748B",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {description.length > 300
            ? description.slice(0, 300) + "..."
            : description}
        </Text>
      </Section>

      <Link
        href={adminUrl}
        style={{
          display: "inline-block",
          backgroundColor: "#00E5A0",
          color: "#0B0F1A",
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "10px 24px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        {t(locale, "ticket.cta")}
      </Link>
    </NortooLayout>
  );
}

TicketNotification.PreviewProps = {
  ticketId: 42,
  subject: "Mon webhook ne fonctionne pas",
  description:
    "Bonjour, depuis hier mon webhook YouCan ne reçoit plus de commandes. Le point est rouge dans le dashboard.",
  category: "integration",
  priority: "high",
  merchantName: "Boutique Test",
  merchantEmail: "test@example.com",
  adminUrl: "https://app.nortoo.ma/nrt-panel/tickets",
} satisfies TicketNotificationProps;

export default TicketNotification;
