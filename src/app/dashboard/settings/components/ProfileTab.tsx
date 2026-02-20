"use client";

import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Mail,
  RefreshCw,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BaseTabProps } from "../types";

export function ProfileTab({ settings, onRefresh, onToast }: BaseTabProps) {
  // Profile form
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [savingProfile, setSavingProfile] = useState(false);

  // Resend verification
  const [resending, setResending] = useState(false);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync form when settings change externally
  useEffect(() => {
    setName(settings.name);
    setEmail(settings.email);
  }, [settings.name, settings.email]);

  const isVerified = !!settings.emailVerified;
  const hasProfileChanges =
    name.trim() !== settings.name || email.trim().toLowerCase() !== settings.email;

  // Save profile (real API call)
  async function handleSaveProfile() {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      onToast("error", "Le nom doit contenir au moins 2 caractères");
      return;
    }
    if (!normalizedEmail.includes("@")) {
      onToast("error", "Adresse e-mail invalide");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "profile",
          name: trimmedName,
          email: normalizedEmail,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        onToast("error", json.error || "Erreur lors de la sauvegarde");
        return;
      }

      await onRefresh();

      if (json.emailChanged) {
        onToast(
          "info",
          "Un e-mail de vérification a été envoyé à votre nouvelle adresse"
        );
      } else {
        onToast("success", "Profil mis à jour avec succès");
      }
    } catch {
      onToast("error", "Erreur réseau. Réessayez plus tard.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Resend verification email
  async function handleResendVerification() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        onToast("error", json.error || "Impossible d'envoyer l'e-mail");
        return;
      }

      onToast("success", "E-mail de vérification envoyé !");
    } catch {
      onToast("error", "Erreur réseau. Réessayez plus tard.");
    } finally {
      setResending(false);
    }
  }

  // Change password
  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      onToast("error", "Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      onToast("error", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        onToast("error", json.error || "Erreur lors du changement de mot de passe");
        return;
      }

      onToast("success", "Mot de passe modifié avec succès");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      onToast("error", "Erreur réseau. Réessayez plus tard.");
    } finally {
      setSavingPassword(false);
    }
  }

  // Delete account
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      onToast("info", "Fonctionnalité bientôt disponible");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ Informations personnelles ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-ocean" />
            <div>
              <CardTitle className="text-base">
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Gérez les informations de votre compte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
              placeholder="Votre nom complet"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              Adresse e-mail
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
                placeholder="vous@exemple.com"
              />
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-mint-bg px-2.5 py-1 text-xs font-medium text-mint-deep whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Vérifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-sun-light px-2.5 py-1 text-xs font-medium text-sun-deep whitespace-nowrap">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Non vérifié
                </span>
              )}
            </div>
            {!isVerified && (
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs text-fog">
                  Vérifiez votre adresse e-mail pour accéder à toutes les fonctionnalités.
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ocean hover:text-ocean/80 disabled:opacity-50 whitespace-nowrap"
                >
                  {resending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Renvoyer
                </button>
              </div>
            )}
          </div>
          {hasProfileChanges && (
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="mt-2"
            >
              {savingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer les modifications
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ═══ Mot de passe ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-violet" />
            <div>
              <CardTitle className="text-base">Mot de passe</CardTitle>
              <CardDescription>
                Modifiez votre mot de passe de connexion
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
              placeholder="Minimum 8 caractères"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={
              savingPassword || !oldPassword || !newPassword || !confirmPassword
            }
            variant="secondary"
            className="mt-2"
          >
            {savingPassword ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* ═══ Zone de danger ═══ */}
      <Card className="border-rose/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose" />
            <div>
              <CardTitle className="text-base text-rose">
                Zone de danger
              </CardTitle>
              <CardDescription>
                Actions irréversibles sur votre compte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog mb-4">
            La suppression de votre compte entraînera la perte définitive de
            toutes vos données, commandes, et paramètres. Cette action ne peut
            pas être annulée.
          </p>

          <Dialog.Root
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
          >
            <Dialog.Trigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-rose-bg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-rose" />
                  </div>
                  <Dialog.Title className="font-display font-semibold text-midnight text-lg">
                    Supprimer votre compte ?
                  </Dialog.Title>
                </div>
                <Dialog.Description className="text-sm text-fog mb-6">
                  Cette action est irréversible. Toutes vos données seront
                  supprimées définitivement sous 30 jours conformément à la
                  Loi 09-08 relative à la protection des données personnelles.
                </Dialog.Description>
                <div className="flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="outline">Annuler</Button>
                  </Dialog.Close>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Supprimer définitivement
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </CardContent>
      </Card>
    </div>
  );
}
