"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, X, Upload, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchPublicSubscriptionPlans, registerManager } from "@/lib/api/public";
import { uploadDocumentFile } from "@/lib/api/manager";
import {
  MAX_SUBSCRIPTION_DOCUMENTS,
  SUBSCRIPTION_DOC_TYPES,
  SUBSCRIPTION_REQUIRED_DOC_TYPES,
  validateDocumentFile,
} from "@/lib/documents";
import { docTypeLabel } from "@/components/dashboard/DocumentPreviewCard";
import { useLang } from "@/lib/i18n";

function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };
}

type PendingDoc = {
  docType: string;
  docNumber: string;
  issuer: string;
  file: File;
};

const DOC_TYPE_LABELS_FR: Record<string, string> = {
  ID_CARD: "CNI du promoteur",
  CRIMINAL_RECORD: "Extrait casier judiciaire",
  DOMICILE_PROOF: "Justificatif de domicile",
  COMPANY_REGISTRATION: "Immatriculation entreprise",
  OTHER: "Autre document",
};

export function SignupForm() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const requestedPlanId = searchParams.get("plan") ?? undefined;
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: plans } = useApiQuery(fetchPublicSubscriptionPlans, []);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [docType, setDocType] = useState<string>(SUBSCRIPTION_DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<PendingDoc[]>([]);

  const strength = useMemo(() => checkPasswordStrength(password), [password]);
  const isStrong = strength.length && strength.upper && strength.digit;
  const selectedPlan = plans?.find((p) => p.id === requestedPlanId);

  const hasRequiredDocs = SUBSCRIPTION_REQUIRED_DOC_TYPES.every((type) =>
    documents.some((d) => d.docType === type)
  );

  function addDocument() {
    if (!pendingFile) {
      setError("Sélectionnez un fichier.");
      return;
    }
    const fileError = validateDocumentFile(pendingFile);
    if (fileError) {
      setError(fileError);
      return;
    }
    if (documents.length >= MAX_SUBSCRIPTION_DOCUMENTS) {
      setError(`Maximum ${MAX_SUBSCRIPTION_DOCUMENTS} documents.`);
      return;
    }
    setDocuments((prev) => [
      ...prev,
      { docType, docNumber: docNumber || `DOC-${prev.length + 1}`, issuer, file: pendingFile },
    ]);
    setDocNumber("");
    setIssuer("");
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted || !isStrong || password !== confirmPassword) return;
    if (!hasRequiredDocs) {
      setError("La CNI et l'extrait de casier judiciaire sont obligatoires.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(
        documents.map(async (d) => {
          const up = await uploadDocumentFile(d.file, "subscription");
          return {
            docType: d.docType,
            docNumber: d.docNumber,
            fileUrl: up.fileUrl,
            fileMimeType: up.mimeType,
            fileOriginalName: up.originalName,
            issuer: d.issuer || undefined,
          };
        })
      );
      await registerManager({
        username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, ""),
        password,
        email,
        phone,
        firstName,
        lastName,
        companyName,
        requestedPlanId,
        documents: uploaded,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Demande envoyée</h1>
        <p className="mt-2 text-muted-foreground">
          Votre demande de souscription a été enregistrée. Un super-administrateur examinera vos documents et vous notifiera par email.
        </p>
        <Button asChild className="mt-8">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-bold text-foreground">Rejoignez FleetMan</h1>
      <p className="mt-2 text-muted-foreground">Créez votre compte gestionnaire de flotte</p>
      {selectedPlan && (
        <Badge className="mt-3" variant="default">
          Plan choisi : {selectedPlan.name}
        </Badge>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Nom entreprise *</Label>
          <Input id="company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Transport Express CM" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.cm" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XX XX XX" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {password && (
            <ul className="space-y-1 text-xs">
              {[
                { ok: strength.length, label: "8 caractères minimum" },
                { ok: strength.upper, label: "Une majuscule" },
                { ok: strength.digit, label: "Un chiffre" },
              ].map((rule) => (
                <li key={rule.label} className={cn("flex items-center gap-1", rule.ok ? "text-success" : "text-muted-foreground")}>
                  {rule.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents de conformité
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fournissez jusqu&apos;à {MAX_SUBSCRIPTION_DOCUMENTS} documents (CNI et casier judiciaire obligatoires).
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type de document</Label>
              <select className="h-10 w-full rounded-lg border px-3 text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
                {SUBSCRIPTION_DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOC_TYPE_LABELS_FR[type] ?? docTypeLabel(type, t)}
                    {SUBSCRIPTION_REQUIRED_DOC_TYPES.includes(type as (typeof SUBSCRIPTION_REQUIRED_DOC_TYPES)[number]) ? " *" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>N° document</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Référence" />
            </div>
            <div className="space-y-1.5">
              <Label>Émetteur</Label>
              <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Organisme" />
            </div>
            <div className="space-y-1.5">
              <Label>Fichier (PDF, JPEG, PNG)</Label>
              <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" className="gap-1" onClick={addDocument} disabled={documents.length >= MAX_SUBSCRIPTION_DOCUMENTS}>
            <Upload className="h-4 w-4" />
            Ajouter le document ({documents.length}/{MAX_SUBSCRIPTION_DOCUMENTS})
          </Button>

          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map((d, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{DOC_TYPE_LABELS_FR[d.docType] ?? d.docType}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{d.file.name}</span>
                  </span>
                  <button type="button" className="text-destructive hover:bg-destructive/10 rounded p-1" onClick={() => setDocuments((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox id="terms" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
            J&apos;accepte les CGU et la politique de confidentialité
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || !accepted || !isStrong || password !== confirmPassword || !hasRequiredDocs}>
          {loading ? "Envoi en cours…" : "Soumettre ma demande"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
