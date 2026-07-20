"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useLang } from "@/lib/i18n";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import {
  changeMyPassword,
  fetchMyAccount,
  updateMyAccount,
  uploadMyProfilePicture,
} from "@/lib/api/account";
import { ApiError } from "@/lib/api/mock-wrapper";
import { PhoneInput } from "@/components/ui/phone-input";
import { parsePhoneValue, validatePhone } from "@/lib/phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export function AccountSettings() {
  const { t } = useLang();
  const { user, updateProfile, logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setPhotoUrl(user.photoUrl ?? "");
  }, [user]);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "FM";
  const strength = passwordStrength(newPassword);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return "";
    if (strength <= 2) return t("Faible");
    if (strength <= 4) return t("Moyen");
    return t("Robuste");
  }, [newPassword, strength, t]);

  function validateProfile() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t("L'email est obligatoire.");
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = t("Format email invalide.");
    if (phone.trim()) {
      const { country, national } = parsePhoneValue(phone);
      const phoneError = validatePhone(country, national);
      if (phoneError) next.phone = phoneError;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePassword() {
    const next: Record<string, string> = {};
    if (!oldPassword) next.oldPassword = t("Saisissez l'ancien mot de passe.");
    if (strength < 4) {
      next.newPassword = t(
        "Mot de passe robuste requis : 8+ car., majuscule, minuscule, chiffre, symbole."
      );
    }
    if (newPassword !== confirmPassword) {
      next.confirmPassword = t("Les mots de passe ne correspondent pas.");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handlePhotoSelect(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPendingPhotoUrl(String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  async function confirmPhotoChange() {
    if (!pendingFile && !pendingPhotoUrl) return;
    setPhotoSaving(true);
    setSuccessMsg(null);
    try {
      if (pendingFile) {
        await uploadMyProfilePicture(pendingFile);
        // Le backend ne renvoie pas l'URL de la photo à l'upload (204 sans
        // corps) : on relit le profil pour récupérer la véritable URL courte
        // hébergée par le serveur. Persister l'aperçu base64 local à la place
        // (potentiellement plusieurs Mo) faisait planter saveSession() —
        // localStorage rejette l'écriture (QuotaExceededError) au-delà de sa
        // limite par origine.
        const refreshed = await fetchMyAccount();
        setPhotoUrl(refreshed.photoUrl ?? "");
        updateProfile({ photoUrl: refreshed.photoUrl ?? undefined });
      } else if (pendingPhotoUrl) {
        setPhotoUrl(pendingPhotoUrl);
        updateProfile({ photoUrl: pendingPhotoUrl });
      }
      setPendingPhotoUrl(null);
      setPendingFile(null);
      setSuccessMsg(t("Photo mise à jour."));
    } catch (err) {
      setErrors({
        photo: err instanceof ApiError ? err.message : t("Échec de l'upload photo."),
      });
    } finally {
      setPhotoSaving(false);
    }
  }

  async function handleSaveProfile() {
    if (!validateProfile()) return;
    setProfileSaving(true);
    setSuccessMsg(null);
    try {
      const updated = await updateMyAccount({
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      updateProfile({
        firstName: updated.firstName ?? firstName,
        lastName: updated.lastName ?? lastName,
        email: updated.email ?? email,
        phone: updated.phone ?? phone,
        photoUrl: updated.photoUrl ?? photoUrl,
      });
      setSuccessMsg(t("Profil enregistré."));
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : t("Impossible d'enregistrer le profil."),
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!validatePassword()) return;
    setPasswordSaving(true);
    setSuccessMsg(null);
    try {
      await changeMyPassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg(t("Mot de passe mis à jour."));
    } catch (err) {
      setErrors({
        oldPassword:
          err instanceof ApiError ? err.message : t("Échec du changement de mot de passe."),
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  const displayPhoto = pendingPhotoUrl ?? photoUrl;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Mon compte")}
        description={t("Paramètres personnels et sécurité.")}
      />

      {successMsg && (
        <p className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {successMsg}
        </p>
      )}
      {errors.form && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}

      <Card className="mb-6">
        <CardContent className="flex flex-col items-center pt-6">
          <div className="relative">
            {displayPhoto ? (
              <Image
                src={displayPhoto}
                alt={t("Photo de profil")}
                width={96}
                height={96}
                unoptimized
                className={cn(
                  "h-24 w-24 rounded-full object-cover ring-2",
                  pendingPhotoUrl ? "ring-warning/60" : "ring-primary/20"
                )}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
            <button
              type="button"
              className="absolute bottom-0 right-0 rounded-full border bg-card p-2 shadow-md hover:bg-muted"
              onClick={() => fileRef.current?.click()}
              aria-label={t("Téléverser une photo")}
            >
              <Camera className="h-4 w-4 text-primary" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handlePhotoSelect(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          {errors.photo && <p className="mt-2 text-xs text-destructive">{errors.photo}</p>}
          {pendingPhotoUrl && (
            <Button
              type="button"
              size="sm"
              className="mt-3"
              disabled={photoSaving}
              onClick={confirmPhotoChange}
            >
              {photoSaving ? t("Enregistrement…") : t("Valider la photo")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("Informations personnelles")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Prénom")}</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("Nom")}</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("Email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@entreprise.com"
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("Téléphone")}</Label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              inputClassName={cn(errors.phone && "border-destructive")}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <Button type="button" onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? t("Enregistrement…") : t("Enregistrer")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("Sécurité")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("Ancien mot de passe")}</Label>
            <PasswordInput value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            {errors.oldPassword && (
              <p className="text-xs text-destructive">{errors.oldPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("Nouveau mot de passe")}</Label>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            {newPassword && (
              <p className={cn("text-xs", strength >= 4 ? "text-success" : "text-warning")}>
                {t("Robustesse")} : {strengthLabel}
              </p>
            )}
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("Confirmer")}</Label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
          <Button type="button" onClick={handleChangePassword} disabled={passwordSaving}>
            {passwordSaving ? t("Mise à jour…") : t("Mettre à jour le mot de passe")}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("Préférences notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[t("Email"), t("Push"), t("SMS — Incidents"), t("SMS — Documents")].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox id={label} defaultChecked />
              <Label htmlFor={label}>{label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("Session")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t("Déconnexion")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
