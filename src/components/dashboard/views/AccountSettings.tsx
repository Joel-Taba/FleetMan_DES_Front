"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useLang } from "@/lib/i18n";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Mon compte")}
        description={t("Paramètres personnels et sécurité.")}
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col items-center pt-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {initials}
          </div>
          <Button variant="secondary" size="sm" className="mt-3">
            {t("Changer la photo")}
          </Button>
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
            <Button type="button" onClick={() => validateProfile() && alert(t("Profil enregistré (démo)"))}>
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
            <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            {errors.oldPassword && <p className="text-xs text-destructive">{errors.oldPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("Nouveau mot de passe")}</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            {newPassword && (
              <p className={cn("text-xs", strength >= 4 ? "text-success" : "text-warning")}>
                {t("Robustesse")} : {strengthLabel}
              </p>
            )}
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("Confirmer")}</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
        <Button variant="destructive" type="button">
          {t("Désactiver mon compte")}
        </Button>
      </div>
    </div>
  );
}
