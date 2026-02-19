"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Download,
  Pencil,
  Trash2,
  Ban,
  Clock,
  Server,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BaseTabProps } from "../types";

// ── Data right action ──
interface RightAction {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  article: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

const DATA_RIGHTS: RightAction[] = [
  {
    icon: Download,
    title: "Exporter mes données",
    description:
      "Obtenez une copie de toutes les données personnelles que nous détenons à votre sujet.",
    buttonLabel: "Exporter",
    article: "Art. 7",
    variant: "outline",
  },
  {
    icon: Pencil,
    title: "Rectifier mes données",
    description:
      "Demandez la correction d'informations inexactes ou incomplètes.",
    buttonLabel: "Demander",
    article: "Art. 7",
    variant: "outline",
  },
  {
    icon: Trash2,
    title: "Supprimer mes données",
    description:
      "Demandez la suppression définitive de vos données personnelles.",
    buttonLabel: "Demander la suppression",
    article: "Art. 8",
    variant: "destructive",
  },
  {
    icon: Ban,
    title: "Exercer mon droit d'opposition",
    description:
      "Opposez-vous au traitement de vos données à des fins de scoring automatisé.",
    buttonLabel: "S'opposer",
    article: "Art. 9",
    variant: "outline",
  },
];

// ── Sub-processors ──
const SUB_PROCESSORS = [
  {
    name: "Neon",
    service: "Base de données PostgreSQL",
    location: "EU Frankfurt",
    purpose: "Stockage des commandes et profils",
  },
  {
    name: "Vercel",
    service: "Hébergement application",
    location: "EU Frankfurt (fra1)",
    purpose: "Exécution du code applicatif",
  },
  {
    name: "Upstash",
    service: "Cache Redis",
    location: "EU Frankfurt",
    purpose: "Limitation de débit et cache",
  },
];

export function PrivacyTab({ settings, onToast }: BaseTabProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const connectedDate = settings.consentRecordedAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(settings.consentRecordedAt))
    : null;

  async function handleDataRight(title: string) {
    setLoadingAction(title);
    try {
      await new Promise((r) => setTimeout(r, 600));
      onToast(
        "info",
        "Demande enregistrée. Vous recevrez une réponse sous 48h."
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ Conformité Loi 09-08 ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">
                Conformité Loi 09-08
              </CardTitle>
              <CardDescription>
                Protection des données personnelles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink-2">
            CODPilot est conforme à la Loi 09-08 relative à la protection des
            personnes physiques à l&apos;égard du traitement des données à
            caractère personnel.
          </p>

          <div className="rounded-sm border border-border divide-y divide-border">
            {settings.cndpDeclarationRef && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink-3">
                  N° récépissé CNDP
                </span>
                <Badge variant="mint">{settings.cndpDeclarationRef}</Badge>
              </div>
            )}
            {connectedDate && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink-3">
                  Consentement enregistré le
                </span>
                <span className="text-sm text-ink-2">{connectedDate}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink-3">
                Durée de conservation
              </span>
              <span className="text-sm font-medium text-ink-1">
                {settings.dataRetentionMonths} mois
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Vos droits (Art. 7-9) ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ocean" />
            <div>
              <CardTitle className="text-base">
                Vos droits (Art. 7-9)
              </CardTitle>
              <CardDescription>
                Exercez vos droits conformément à la Loi 09-08
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DATA_RIGHTS.map((right) => {
              const Icon = right.icon;
              const isLoading = loadingAction === right.title;
              return (
                <div
                  key={right.title}
                  className="flex items-start justify-between gap-4 rounded-sm border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-8 w-8 rounded-xs bg-sand flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-ink-3" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink-1">
                          {right.title}
                        </p>
                        <Badge variant="ocean" className="text-[10px]">
                          {right.article}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {right.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={right.variant as "outline" | "destructive" | undefined}
                    size="sm"
                    onClick={() => handleDataRight(right.title)}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    {isLoading && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    {right.buttonLabel}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Conservation des données ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet" />
            <div>
              <CardTitle className="text-base">
                Conservation des données
              </CardTitle>
              <CardDescription>
                Politique de rétention (Art. 3e)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-2">
            Les données personnelles liées aux commandes sont conservées pendant{" "}
            <span className="font-mono font-bold">
              {settings.dataRetentionMonths} mois
            </span>{" "}
            après la dernière commande, conformément à l&apos;Article 3e de la
            Loi 09-08.
          </p>
          <p className="text-sm text-ink-3">
            Un processus automatique supprime les données expirées
            quotidiennement à 3h du matin. Les journaux d&apos;audit sont
            conservés 36 mois pour répondre aux obligations légales.
          </p>
        </CardContent>
      </Card>

      {/* ═══ Sous-traitants (Art. 25) ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-ink-3" />
            <div>
              <CardTitle className="text-base">
                Sous-traitants (Art. 25)
              </CardTitle>
              <CardDescription>
                Infrastructure et sous-traitants techniques
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-medium text-ink-3">
                    Sous-traitant
                  </th>
                  <th className="pb-2 text-left font-medium text-ink-3">
                    Service
                  </th>
                  <th className="pb-2 text-left font-medium text-ink-3">
                    Localisation
                  </th>
                  <th className="pb-2 text-left font-medium text-ink-3">
                    Finalité
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SUB_PROCESSORS.map((sp) => (
                  <tr key={sp.name}>
                    <td className="py-2.5 font-medium text-ink-1">
                      {sp.name}
                    </td>
                    <td className="py-2.5 text-ink-2">{sp.service}</td>
                    <td className="py-2.5">
                      <Badge variant="mint" className="text-[10px]">
                        {sp.location}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-ink-3">{sp.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xs bg-sand/50 px-3 py-2">
            <p className="text-xs text-ink-3">
              Tous les sous-traitants sont localisés dans l&apos;Union
              Européenne conformément à l&apos;Article 43 de la Loi 09-08
              relatif aux transferts de données.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
