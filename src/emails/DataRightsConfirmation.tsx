import { Text, Section } from "@react-email/components";
import * as React from "react";
import { NortooLayout } from "./components/Layout";

interface DataRightsConfirmationProps {
  reference: string;
  typeLabel: string;
  deadline: string;
}

export function DataRightsConfirmation({
  reference,
  typeLabel,
  deadline,
}: DataRightsConfirmationProps) {
  return (
    <NortooLayout preview={`Demande ${reference} enregistr\u00e9e`}>
      <Text
        style={{
          fontSize: "1.1rem",
          color: "#0B0F1A",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        Demande enregistr&eacute;e
      </Text>
      <Text
        style={{
          fontSize: "0.9rem",
          color: "#64748B",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        Votre demande d&apos;exercice de droits a bien &eacute;t&eacute;
        re&ccedil;ue et sera trait&eacute;e dans les meilleurs d&eacute;lais.
      </Text>

      {/* Info box */}
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
              <td style={{ padding: "4px 0" }}>Type de demande</td>
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
              <td style={{ padding: "4px 0" }}>
                D&eacute;lai de r&eacute;ponse
              </td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right" as const,
                  fontWeight: 600,
                  color: "#0B0F1A",
                }}
              >
                {deadline}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text
        style={{
          fontSize: "0.8rem",
          color: "#64748B",
          lineHeight: 1.5,
          margin: "0 0 16px",
        }}
      >
        Conform&eacute;ment &agrave; la{" "}
        <strong style={{ color: "#0B0F1A" }}>Loi 09-08</strong>, nous vous
        r&eacute;pondrons dans un d&eacute;lai maximum de{" "}
        <strong style={{ color: "#0B0F1A" }}>10 jours ouvrables</strong>.
      </Text>
      <Text
        style={{
          fontSize: "0.75rem",
          color: "#94A3B8",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Si vous n&apos;avez pas fait cette demande, veuillez ignorer cet email
        ou contacter support@nortoo.ma.
      </Text>
    </NortooLayout>
  );
}

DataRightsConfirmation.PreviewProps = {
  reference: "DR-2026-001",
  typeLabel: "Droit d'acc\u00e8s",
  deadline: "10 mars 2026",
} satisfies DataRightsConfirmationProps;

export default DataRightsConfirmation;
