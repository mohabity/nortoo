import { Text, Section, Button } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";

interface DataRightsNotificationProps {
  reference: string;
  typeLabel: string;
  phoneHashPartial: string;
  requesterEmail: string;
  details: string | null;
  deadline: string;
  merchantCount: number;
}

export function DataRightsNotification({
  reference,
  typeLabel,
  phoneHashPartial,
  requesterEmail,
  details,
  deadline,
  merchantCount,
}: DataRightsNotificationProps) {
  return (
    <NortooLayout
      preview={`[Action requise] Demande ${reference} \u2014 ${typeLabel}`}
    >
      {/* Amber header banner - rendered inside the layout content area */}
      <Section
        style={{
          backgroundColor: "#FFFBEB",
          borderRadius: 10,
          padding: "12px 16px",
          margin: "0 0 24px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
          <tbody>
            <tr>
              <td>
                <Text
                  style={{
                    margin: 0,
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    letterSpacing: "-0.04em",
                    color: "#0B0F1A",
                  }}
                >
                  nortoo
                </Text>
              </td>
              <td style={{ textAlign: "right" as const }}>
                <Text
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "#92400E",
                    fontWeight: 600,
                  }}
                >
                  NOUVELLE DEMANDE
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        Demande d&apos;exercice de droits
      </Text>

      {/* Info box */}
      <Section
        style={{
          backgroundColor: "#F8FAFC",
          borderRadius: 10,
          padding: 16,
          margin: "0 0 16px",
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
              <td style={{ padding: "4px 0" }}>R&eacute;f&eacute;rence</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 700,
                  color: "#0B0F1A",
                  fontFamily: "monospace",
                }}
              >
                {reference}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>Type</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 600,
                  color: "#0B0F1A",
                }}
              >
                {typeLabel}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>Phone hash</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "#64748B",
                }}
              >
                {phoneHashPartial}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>Email demandeur</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  color: "#0B0F1A",
                }}
              >
                {requesterEmail}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>Marchands concern&eacute;s</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 600,
                  color: "#0B0F1A",
                }}
              >
                {merchantCount}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>&Eacute;ch&eacute;ance</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 600,
                  color: "#F59E0B",
                }}
              >
                {deadline}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Optional details */}
      {details && (
        <Section
          style={{
            backgroundColor: "#F1F5F9",
            borderRadius: 10,
            padding: "12px 16px",
            margin: "0 0 16px",
          }}
        >
          <Text
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#64748B",
              margin: "0 0 4px",
            }}
          >
            D&eacute;tails :
          </Text>
          <Text
            style={{
              fontSize: "0.85rem",
              color: "#0B0F1A",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {details}
          </Text>
        </Section>
      )}

      <Button
        href="https://app.nortoo.ma/dashboard/compliance"
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
        Voir dans le dashboard
      </Button>
    </NortooLayout>
  );
}

DataRightsNotification.PreviewProps = {
  reference: "DR-2026-001",
  typeLabel: "Droit d'acc\u00e8s",
  phoneHashPartial: "a1b2c3...f4e5d6",
  requesterEmail: "client@example.com",
  details: "Je souhaite obtenir une copie de toutes mes donn\u00e9es personnelles.",
  deadline: "10 mars 2026",
  merchantCount: 3,
} satisfies DataRightsNotificationProps;

export default DataRightsNotification;
