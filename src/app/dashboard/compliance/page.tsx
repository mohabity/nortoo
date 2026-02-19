"use client";

import { Shield, FileText, Eye, Trash2, Ban, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock data rights requests
const dataRightsRequests = [
  {
    id: 1,
    phoneHash: "a3f2...8c41",
    rightType: "access",
    status: "completed",
    createdAt: "2026-02-10T14:30:00Z",
    deadline: "2026-03-12T14:30:00Z",
  },
  {
    id: 2,
    phoneHash: "b7e1...2d55",
    rightType: "deletion",
    status: "processing",
    createdAt: "2026-02-15T09:00:00Z",
    deadline: "2026-03-17T09:00:00Z",
  },
  {
    id: 3,
    phoneHash: "c9d4...6f78",
    rightType: "opposition",
    status: "completed",
    createdAt: "2026-02-05T11:20:00Z",
    deadline: "2026-03-07T11:20:00Z",
  },
];

// Mock audit logs
const recentAuditLogs = [
  { id: 1, actor: "system", action: "score", target: "Commande #1847", createdAt: "2026-02-18T10:30:01Z" },
  { id: 2, actor: "system", action: "score", target: "Commande #1848", createdAt: "2026-02-18T09:15:02Z" },
  { id: 3, actor: "merchant", action: "override", target: "Commande #1840", createdAt: "2026-02-17T16:00:00Z" },
  { id: 4, actor: "system", action: "score", target: "Commande #1849", createdAt: "2026-02-18T08:45:01Z" },
  { id: 5, actor: "consumer", action: "access_request", target: "Client a3f2...8c41", createdAt: "2026-02-10T14:30:00Z" },
  { id: 6, actor: "merchant", action: "settings_change", target: "Seuils scoring", createdAt: "2026-02-08T10:00:00Z" },
  { id: 7, actor: "system", action: "delete", target: "Données expirées (12 fiches)", createdAt: "2026-02-18T03:00:00Z" },
  { id: 8, actor: "consumer", action: "access_request", target: "Client c9d4...6f78", createdAt: "2026-02-05T11:20:00Z" },
];

const rightTypeLabels: Record<string, { label: string; icon: typeof Eye }> = {
  access: { label: "Droit d'accès (Art. 7)", icon: Eye },
  deletion: { label: "Droit de suppression (Art. 8)", icon: Trash2 },
  opposition: { label: "Droit d'opposition (Art. 9)", icon: Ban },
};

const statusLabels: Record<string, { label: string; variant: "mint" | "sun" | "default" | "coral" }> = {
  pending: { label: "En attente", variant: "sun" },
  processing: { label: "En cours", variant: "sun" },
  completed: { label: "Traité", variant: "mint" },
  refused: { label: "Refusé", variant: "coral" },
};

const actionLabels: Record<string, string> = {
  score: "Scoring",
  override: "Override",
  access_request: "Demande d'accès",
  delete: "Suppression",
  settings_change: "Paramètres",
  login: "Connexion",
  export: "Export",
};

const actorLabels: Record<string, string> = {
  system: "Système",
  merchant: "Marchand",
  consumer: "Consommateur",
  admin: "Admin",
};

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sora text-2xl font-bold text-ink-1">Conformité</h1>
        <p className="text-sm text-ink-3">
          Gestion des droits des données — Loi 09-08
        </p>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-mint" />
            <p className="text-xs font-medium text-ink-3">Hachage Art. 23</p>
          </div>
          <p className="mt-2 font-sora text-lg font-bold text-mint-deep">Actif</p>
          <p className="text-xs text-ink-4">SHA-256 + sel</p>
        </div>
        <div className="rounded bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sun" />
            <p className="text-xs font-medium text-ink-3">Rétention Art. 3e</p>
          </div>
          <p className="mt-2 font-sora text-lg font-bold text-ink-1">24 mois</p>
          <p className="text-xs text-ink-4">Purge auto à 3h</p>
        </div>
        <div className="rounded bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ocean" />
            <p className="text-xs font-medium text-ink-3">Journal audit</p>
          </div>
          <p className="mt-2 font-sora text-lg font-bold text-ink-1">1 247</p>
          <p className="text-xs text-ink-4">Entrées ce mois</p>
        </div>
        <div className="rounded bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-violet" />
            <p className="text-xs font-medium text-ink-3">Oppositions Art. 9</p>
          </div>
          <p className="mt-2 font-sora text-lg font-bold text-ink-1">3</p>
          <p className="text-xs text-ink-4">Consommateurs opposés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Data Rights Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demandes de droits</CardTitle>
            <CardDescription>Requêtes Art. 7, 8 et 9 — Délai de réponse: 30 jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataRightsRequests.map((req) => {
                const rightConfig = rightTypeLabels[req.rightType];
                const statusConfig = statusLabels[req.status];
                const RightIcon = rightConfig?.icon ?? Eye;

                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-sm border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <RightIcon className="h-4 w-4 text-ink-3" />
                      <div>
                        <p className="text-sm font-medium text-ink-1">
                          {rightConfig?.label ?? req.rightType}
                        </p>
                        <p className="font-mono text-xs text-ink-4">{req.phoneHash}</p>
                        <p className="text-xs text-ink-4">
                          {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig?.variant ?? "default"}>
                      {statusConfig?.label ?? req.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Journal d&apos;audit</CardTitle>
            <CardDescription>Art. 23 — Traçabilité de chaque opération</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xs px-3 py-2 hover:bg-sand/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="default" className="shrink-0">
                      {actorLabels[log.actor] ?? log.actor}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm text-ink-2 truncate">
                        <span className="font-medium">{actionLabels[log.action] ?? log.action}</span>
                        {" — "}
                        {log.target}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-ink-4 ml-2">
                    {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Voir tout le journal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
