"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  MoreHorizontal,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BaseTabProps } from "../types";

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-violet/10 text-violet border-violet/20" },
  manager: { label: "Responsable", className: "bg-amber/10 text-amber border-amber/20" },
  operator: { label: "Opérateur", className: "bg-ocean/10 text-ocean border-ocean/20" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-mint/10 text-mint-deep border-mint/20" },
  pending: { label: "En attente", className: "bg-amber/10 text-amber border-amber/20" },
  disabled: { label: "Désactivé", className: "bg-rose/10 text-rose border-rose/20" },
};

export function TeamTab({ onToast }: BaseTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(2);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "operator">("operator");
  const [inviting, setInviting] = useState(false);

  // Action menus
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (json.data) {
        setMembers(json.data);
        setLimit(json.meta?.limit ?? 2);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Close menu on click outside
  useEffect(() => {
    if (openMenu === null) return;
    const handler = () => setOpenMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenu]);

  // Invite handler
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          name: inviteName || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        onToast("success", "Invitation envoyée");
        setShowInvite(false);
        setInviteEmail("");
        setInviteName("");
        setInviteRole("operator");
        await fetchTeam();
      } else {
        onToast("error", json.error ?? "Erreur lors de l'invitation");
      }
    } catch {
      onToast("error", "Erreur de connexion");
    } finally {
      setInviting(false);
    }
  }

  // Change role
  async function handleChangeRole(id: number, role: string) {
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (res.ok) {
        onToast("success", "Rôle modifié");
        await fetchTeam();
      } else {
        onToast("error", json.error ?? "Erreur");
      }
    } catch {
      onToast("error", "Erreur de connexion");
    }
  }

  // Toggle status
  async function handleToggleStatus(id: number, currentStatus: string) {
    setOpenMenu(null);
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok) {
        onToast("success", newStatus === "active" ? "Utilisateur activé" : "Utilisateur désactivé");
        await fetchTeam();
      } else {
        onToast("error", json.error ?? "Erreur");
      }
    } catch {
      onToast("error", "Erreur de connexion");
    }
  }

  // Resend invite
  async function handleResend(id: number) {
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/team/${id}/resend`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        onToast("success", "Invitation renvoyée");
      } else {
        onToast("error", json.error ?? "Erreur");
      }
    } catch {
      onToast("error", "Erreur de connexion");
    }
  }

  // Remove user
  async function handleRemove(id: number) {
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        onToast("success", "Membre supprimé");
        await fetchTeam();
      } else {
        onToast("error", json.error ?? "Erreur");
      }
    } catch {
      onToast("error", "Erreur de connexion");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet" />
              <div>
                <CardTitle className="text-base">Gestion de l&apos;équipe</CardTitle>
                <CardDescription>
                  {members.length}/{limit} membres
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowInvite(true)}
              disabled={members.length >= limit}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Inviter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Members table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silk text-left">
                  <th className="pb-3 font-medium text-fog">Membre</th>
                  <th className="pb-3 font-medium text-fog hidden sm:table-cell">Rôle</th>
                  <th className="pb-3 font-medium text-fog hidden sm:table-cell">Statut</th>
                  <th className="pb-3 font-medium text-fog hidden lg:table-cell">Dernière connexion</th>
                  <th className="pb-3 font-medium text-fog w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silk">
                {members.map((member) => {
                  const roleBadge = ROLE_BADGES[member.role] ?? ROLE_BADGES.operator;
                  const statusBadge = STATUS_BADGES[member.status] ?? STATUS_BADGES.pending;

                  return (
                    <tr key={member.id} className="group">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-midnight">{member.name}</p>
                          <p className="text-xs text-fog">{member.email}</p>
                          {/* Mobile-only badges */}
                          <div className="flex gap-1.5 mt-1 sm:hidden">
                            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", roleBadge.className)}>
                              {roleBadge.label}
                            </span>
                            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", statusBadge.className)}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", roleBadge.className)}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", statusBadge.className)}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        <span className="text-xs text-fog">
                          {member.lastLoginAt
                            ? new Date(member.lastLoginAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Jamais"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(openMenu === member.id ? null : member.id);
                            }}
                            className="p-1 rounded hover:bg-snow text-fog hover:text-slate"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openMenu === member.id && (
                            <div
                              className="absolute right-0 top-8 z-50 w-52 rounded-lg border border-silk bg-white py-1 shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Role changes */}
                              {member.role !== "admin" && (
                                <button
                                  onClick={() => handleChangeRole(member.id, "admin")}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate hover:bg-snow"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-violet" />
                                  Promouvoir Admin
                                </button>
                              )}
                              {member.role !== "manager" && (
                                <button
                                  onClick={() => handleChangeRole(member.id, "manager")}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate hover:bg-snow"
                                >
                                  <Shield className="h-3.5 w-3.5 text-amber" />
                                  Définir Responsable
                                </button>
                              )}
                              {member.role !== "operator" && (
                                <button
                                  onClick={() => handleChangeRole(member.id, "operator")}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate hover:bg-snow"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5 text-ocean" />
                                  Définir Opérateur
                                </button>
                              )}

                              <div className="my-1 border-t border-silk" />

                              {/* Status toggle */}
                              {member.status !== "pending" && (
                                <button
                                  onClick={() => handleToggleStatus(member.id, member.status)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate hover:bg-snow"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  {member.status === "active" ? "Désactiver" : "Activer"}
                                </button>
                              )}

                              {/* Resend invite */}
                              {member.status === "pending" && (
                                <button
                                  onClick={() => handleResend(member.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate hover:bg-snow"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  Renvoyer l&apos;invitation
                                </button>
                              )}

                              <div className="my-1 border-t border-silk" />

                              {/* Remove */}
                              <button
                                onClick={() => handleRemove(member.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose hover:bg-rose/5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {members.length === 1 && (
            <div className="mt-4 rounded-lg bg-snow border border-silk px-4 py-3">
              <p className="text-sm text-fog">
                Vous êtes le seul membre. Invitez votre équipe pour collaborer !
              </p>
            </div>
          )}

          {members.length >= limit && (
            <div className="mt-4 rounded-lg bg-amber/5 border border-amber/20 px-4 py-3">
              <p className="text-sm text-amber">
                Limite de membres atteinte ({limit}). Passez à un plan supérieur pour ajouter plus de membres.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-silk bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-midnight">
              Inviter un membre
            </h2>
            <p className="mt-1 text-sm text-fog">
              Un email d&apos;invitation sera envoyé avec un lien d&apos;activation.
            </p>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="membre@exemple.com"
                  className="w-full rounded-lg border border-silk px-3 py-2.5 text-sm text-midnight focus:border-mint focus:ring-1 focus:ring-mint outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate mb-1">
                  Nom (optionnel)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Prénom Nom"
                  className="w-full rounded-lg border border-silk px-3 py-2.5 text-sm text-midnight focus:border-mint focus:ring-1 focus:ring-mint outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate mb-1">
                  Rôle *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "manager" | "operator")}
                  className="w-full rounded-lg border border-silk px-3 py-2.5 text-sm text-midnight focus:border-mint focus:ring-1 focus:ring-mint outline-none"
                >
                  <option value="operator">Opérateur — Lecture commandes</option>
                  <option value="manager">Responsable — Commandes + Analytique</option>
                  <option value="admin">Administrateur — Accès complet</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowInvite(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={inviting}>
                  {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer l&apos;invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
