"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Building2, Star, Upload } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchManagerKpis, fetchManagerProfile } from "@/lib/api/manager";
import { apiFetch, apiUploadFile } from "@/lib/api/mock-wrapper";
import { useLang } from "@/lib/i18n";

export function OrganizationPage() {
  const { t } = useLang();
  const { data: profile, loading, error, refetch } = useApiQuery(fetchManagerProfile, []);
  const { data: kpis } = useApiQuery(fetchManagerKpis, []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [gallery, setGallery] = useState<string[] | null>(null);
  const [mainPhoto, setMainPhoto] = useState<string | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const displayCompany = companyName || profile?.companyName || "";
  const displayGallery = gallery ?? profile?.galleryUrls ?? [];
  const displayMainPhoto = mainPhoto !== undefined ? mainPhoto : (profile?.photoUrl ?? null);

  async function handleSave() {
    if (!displayCompany.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch<void>("/api/v1/fleet-managers/me/company", {
        method: "PUT",
        body: JSON.stringify({ companyName: displayCompany.trim() }),
      });
      refetch();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : t("Erreur lors de la sauvegarde"));
    } finally {
      setSaving(false);
    }
  }

  async function persistGallery(photoUrl: string | null, galleryUrls: string[]) {
    await apiFetch<void>("/api/v1/fleet-managers/me/gallery", {
      method: "PUT",
      body: JSON.stringify({ photoUrl, galleryUrls }),
    });
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setPhotoError(null);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => apiUploadFile(file, "organization-photo"))
      );
      const urls = uploaded.map((entry) => entry.fileUrl);
      const nextGallery = [...displayGallery, ...urls];
      const nextMain = displayMainPhoto ?? urls[0] ?? null;
      setGallery(nextGallery);
      setMainPhoto(nextMain);
      await persistGallery(nextMain, nextGallery);
      refetch();
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : t("Échec de l'upload photo."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSelectMainPhoto(url: string) {
    setMainPhoto(url);
    setPhotoError(null);
    try {
      await persistGallery(url, displayGallery);
      refetch();
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : t("Échec de la sauvegarde."));
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Profil Entreprise")}
        description={t("Informations de votre organisation et compte manager.")}
      />

      <DataGate loading={loading} error={error}>
        {profile && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("Informations entreprise")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="group relative mx-auto flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
                  {displayMainPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayMainPhoto}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                    aria-label={t("Changer le logo")}
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-white" />
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleGalleryUpload(e.target.files)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? t("Envoi…") : t("Ajouter des photos")}
                </Button>
                {photoError && <p className="text-sm text-destructive">{photoError}</p>}
                {displayGallery.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {displayGallery.map((url) => (
                      <button
                        key={url}
                        type="button"
                        className={`relative overflow-hidden rounded-md border-2 ${
                          displayMainPhoto === url ? "border-primary" : "border-transparent"
                        }`}
                        onClick={() => void handleSelectMainPhoto(url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="aspect-square w-full object-cover" />
                        {displayMainPhoto === url && (
                          <span className="absolute right-1 top-1 rounded bg-primary p-0.5 text-white">
                            <Star className="h-3 w-3 fill-current" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {displayGallery.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("Cliquez sur une vignette pour définir la photo principale.")}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="company">{t("Nom de l'entreprise")}</Label>
                  <Input
                    id="company"
                    value={displayCompany}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={profile.companyName}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t("Statut")}</dt>
                    <dd className="font-medium">{profile.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("Flottes")}</dt>
                    <dd className="font-medium">{profile.fleetCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("Véhicules")}</dt>
                    <dd className="font-medium">{kpis?.totalVehicles ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("Conducteurs")}</dt>
                    <dd className="font-medium">{kpis?.totalDrivers ?? "—"}</dd>
                  </div>
                </dl>
                {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                <Button onClick={handleSave} disabled={saving || !displayCompany.trim()}>
                  {saving ? t("Sauvegarde…") : t("Sauvegarder les modifications")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Mes informations personnelles")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  [t("Prénom"), profile.firstName],
                  [t("Nom"), profile.lastName],
                  [t("Email"), profile.email],
                  [t("Téléphone"), profile.phone],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || "—"}</p>
                  </div>
                ))}
                <Link
                  href="/dashboard/manager/settings"
                  className="text-sm text-primary hover:underline"
                >
                  {t("Gérer mon compte →")}
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </DataGate>
    </div>
  );
}
