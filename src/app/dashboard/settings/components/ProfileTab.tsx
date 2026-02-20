"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
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

export function ProfileTab({ settings, onToast }: BaseTabProps) {
  // Profile form
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Save profile
  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      // Mock — Phase 2
      await new Promise((r) => setTimeout(r, 500));
      onToast("info", "Fonctionnalité bientôt disponible");
    } finally {
      setSavingProfile(false);
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
      await new Promise((r) => setTimeout(r, 500));
      onToast("info", "Fonctionnalité bientôt disponible");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
              placeholder="+212 6XX XXX XXX"
            />
          </div>
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
