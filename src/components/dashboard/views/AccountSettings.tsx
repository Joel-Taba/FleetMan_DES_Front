"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
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

const PHONE_PLACEHOLDER = "+237 6XX XX XX XX";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;

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
  const { user, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl ?? "");
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = t("Format requis : nom@domaine.com");
    if (phone && !/^\+237\s?\d/.test(phone.trim())) next.phone = t("Format attendu : +237 6XX XX XX XX");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePassword() {
    const next: Record<string, string> = {};
    if (!oldPassword) next.oldPassword = t("Saisissez l'ancien mot de passe.");
    if (strength < 4) next.newPassword = t("Mot de passe robuste requis : 8+ car., majuscule, minuscule, chiffre, symbole.");
    if (newPassword !== confirmPassword) next.confirmPassword = t("Les mots de passe ne correspondent pas.");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handlePhotoSelect(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingPhotoUrl(String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  async function confirmPhotoChange() {
    if (!pendingPhotoUrl) return;
    setPhotoSaving(true);
    try {
      setPhotoUrl(pendingPhotoUrl);
      updateProfile({ photoUrl: pendingPhotoUrl });
      setPendingPhotoUrl(null);
    } finally {
      setPhotoSaving(false);
    }
  }

  const displayPhoto = pendingPhotoUrl ?? photoUrl;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Mon compte")}
        description={t("Paramètres personnels et sécurité.")}
      />

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
        <CardHeader><CardTitle>{t("Informations personnelles")}</CardTitle></CardHeader>
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
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={PHONE_PLACEHOLDER}
              className={cn("placeholder:text-muted-foreground/40", errors.phone && "border-destructive")}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              onClick={() => {
                if (!validateProfile()) return;
                updateProfile({ firstName, lastName, email, phone });
                alert(t("Profil enregistré (démo)"));
              }}
            >
              {t("Enregistrer")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>{t("Sécurité")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("Ancien mot de passe")}</Label>
            <PasswordInput value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            {errors.oldPassword && <p className="text-xs text-destructive">{errors.oldPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("Nouveau mot de passe")}</Label>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            {newPassword && (
              <p className={cn("text-xs", strength >= 4 ? "text-success" : "text-warning")}>
                {t("Robustesse")} : {strengthLabel}
              </p>
            )}
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("Confirmer")}</Label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>
          <Button
            type="button"
            onClick={() => validatePassword() && alert(t("Mot de passe mis à jour (démo)"))}
          >
            {t("Mettre à jour le mot de passe")}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>{t("Préférences notifications")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[t("Email"), t("Push"), t("SMS — Incidents"), t("SMS — Documents")].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox id={label} defaultChecked />
              <Label htmlFor={label}>{label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button
          variant="destructive"
          type="button"
          onClick={() => {
            if (window.confirm(t("Confirmer la désactivation de votre compte ?"))) {
              alert(t("Compte désactivé (démo)"));
            }
          }}
        >
          {t("Désactiver mon compte")}
        </Button>
      </div>
    </div>
  );
}
