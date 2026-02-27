"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Plus,
  X,
  Mail,
  User,
  ShieldCheck,
  ShieldOff,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  status: "active" | "pending" | "inactive";
  invitedByName: string | null;
  inviteExpired: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite modal
  const [showModal, setShowModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Action loading
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/nrt-panel/admin-invites");
      const json = await res.json();
      if (res.ok) {
        setAdmins(json.data);
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError("");
    setInviteSuccess("");

    try {
      const res = await fetch("/api/nrt-panel/admin-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Erreur lors de l'invitation");
      } else {
        setInviteSuccess(`Invitation envoyée à ${inviteEmail}`);
        setInviteName("");
        setInviteEmail("");
        setShowModal(false);
        fetchAdmins();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setInviting(false);
    }
  }

  async function handleToggleActive(admin: AdminUser) {
    setActionLoading(admin.id);
    setError("");

    try {
      const res = await fetch(`/api/nrt-panel/admin-invites/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Erreur");
      } else {
        fetchAdmins();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelInvite(admin: AdminUser) {
    if (!confirm(`Annuler l'invitation de ${admin.email} ?`)) return;

    setActionLoading(admin.id);
    setError("");

    try {
      const res = await fetch(`/api/nrt-panel/admin-invites/${admin.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Erreur");
      } else {
        fetchAdmins();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  }

  function statusBadge(admin: AdminUser) {
    if (admin.status === "active") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
          <ShieldCheck className="w-3 h-3" />
          Actif
        </span>
      );
    }
    if (admin.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">
          <Mail className="w-3 h-3" />
          {admin.inviteExpired ? "Expiré" : "En attente"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
        <ShieldOff className="w-3 h-3" />
        Désactivé
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-mint" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-display font-semibold text-midnight">
            Administrateurs
          </h1>
          <p className="text-sm text-fog mt-1">
            {admins.length} compte{admins.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-midnight text-white text-sm font-medium rounded-sm hover:bg-midnight/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Inviter un admin
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 px-3 py-2 bg-rose/5 border border-rose/20 rounded-sm">
          <p className="text-sm text-rose">{error}</p>
        </div>
      )}
      {inviteSuccess && (
        <div className="mb-4 px-3 py-2 bg-mint/10 border border-mint/30 rounded-sm">
          <p className="text-sm text-midnight">{inviteSuccess}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Invité par</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Dernière connexion</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-medium text-midnight">
                    {admin.name}
                  </td>
                  <td className="px-4 py-3 text-fog">{admin.email}</td>
                  <td className="px-4 py-3">{statusBadge(admin)}</td>
                  <td className="px-4 py-3 text-fog">
                    {admin.invitedByName ?? (
                      <span className="text-mist">Setup</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fog">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : <span className="text-mist">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {actionLoading === admin.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-mist" />
                      ) : admin.status === "pending" ? (
                        <button
                          onClick={() => handleCancelInvite(admin)}
                          className="p-1.5 text-gray-400 hover:text-rose transition-colors"
                          title="Annuler l'invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : admin.status === "active" ? (
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Désactiver"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Réactiver"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xl p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-midnight">
                Inviter un administrateur
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="text-gray-400 hover:text-midnight transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Nom
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nom complet"
                  required
                  minLength={2}
                  className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@nortoo.ma"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-silk rounded-sm text-midnight placeholder:text-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-fog border border-silk rounded-sm hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteName || !inviteEmail}
                  className="flex-1 py-2.5 bg-midnight text-white font-semibold text-sm rounded-sm hover:bg-midnight/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    "Envoyer l'invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
