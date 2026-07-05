"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Upload } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchManagerKpis, fetchManagerProfile } from "@/lib/api/manager";
import { apiFetch } from "@/lib/api/mock-wrapper";
import { useLang } from "@/lib/i18n";

export function OrganizationPage() {
  const { t } = useLang();
  const { data: profile, loading, error, refetch } = useApiQuery(fetchManagerProfile, []);
  const { data: kpis } = useApiQuery(fetchManagerKpis, []);
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayCompany = companyName || profile?.companyName || "";

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
                  {profile.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photoUrl}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={t("Changer le logo")}
                  >
                    <Upload className="h-6 w-6 text-white" />
                  </button>
                </div>
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
                <Button onClick={handleSave} disabled={saving}>
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
                    <p className="font-medium">{value}</p>
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
