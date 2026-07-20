"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Mail, Phone, IdCard, Truck, FileText, Pencil, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataGate } from "../DataGate";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { DocumentsGrid, type DocumentPreview } from "../DocumentPreviewCard";
import { DocumentUploadDialog } from "../DocumentUploadDialog";
import { DocumentEditDialog } from "../DocumentEditDialog";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchDriver,
  fetchDriverDocuments,
  fetchFleets,
  fetchVehicles,
} from "@/lib/api/manager";
import { createClientId } from "@/lib/offline/db";
import { uploadDocumentFileOfflineAware } from "@/lib/offline/mutations/document-mutations";
import { updateDriverOfflineAware } from "@/lib/offline/mutations/driver-mutations";
import { driverFullName, driverInitials, driverLabel, fleetNameById, vehiclePlateById } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function DriverDetail({ id }: { id: string }) {
  const { t } = useLang();
  const photoRef = useRef<HTMLInputElement>(null);
  const { data: driver, loading, error, refetch } = useApiQuery(() => fetchDriver(id), [id]);
  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: docsPage, refetch: refetchDocs } = useApiQuery(() => fetchDriverDocuments(id), [id]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentPreview | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    licenceNumber: "",
    status: "ACTIVE",
    fleetId: "",
  });

  useEffect(() => {
    if (!driver) return;
    setForm({
      firstName: driver.firstName ?? "",
      lastName: driver.lastName ?? "",
      email: driver.email ?? "",
      phone: driver.phone ?? "",
      licenceNumber: driver.licenceNumber,
      status: driver.status,
      fleetId: driver.fleetId,
    });
  }, [driver]);

  const docs = docsPage?.content ?? [];
  const name = driver ? driverLabel(driver) : "";
  const plate = vehiclePlateById(vehicles ?? [], driver?.assignedVehicleId ?? null);

  const statusLabel = useMemo(() => {
    const map: Record<string, string> = {
      ACTIVE: t("Actif"),
      INACTIVE: t("Inactif"),
      ON_LEAVE: t("En congé"),
    };
    return driver ? map[driver.status] ?? driver.status : "";
  }, [driver, t]);

  const editDocMeta = editDoc ? docs.find((d) => d.id === editDoc.id) : undefined;

  async function saveProfile() {
    setSaving(true);
    try {
      await updateDriverOfflineAware(id, form);
      setEditing(false);
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!driver) return;
    const next = driver.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateDriverOfflineAware(id, { status: next });
    refetch();
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    const clientMutationId = createClientId();
    const uploaded = await uploadDocumentFileOfflineAware(
      file,
      "driver-photo",
      clientMutationId
    );
    await updateDriverOfflineAware(id, { photoUrl: uploaded.fileUrl }, clientMutationId);
    refetch();
  }

  return (
    <div>
      <PageHeader title={t("Profil conducteur")} description={name}>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing((e) => !e)}>
            <Pencil className="h-4 w-4" /> {editing ? t("Annuler") : t("Modifier")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void toggleStatus()}>
            {driver?.status === "ACTIVE" ? t("Désactiver") : t("Activer")}
          </Button>
        </div>
      </PageHeader>

      <DataGate loading={loading} error={error}>
        {driver && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative">
                  {driver.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={driver.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                      {driverInitials(driver)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-white"
                    onClick={() => photoRef.current?.click()}
                    aria-label={t("Changer la photo")}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoUpload(e.target.files?.[0] ?? null)} />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">{name}</h2>
                <Badge className="mt-3" variant={driver.status === "ACTIVE" ? "success" : "warning"}>
                  {statusLabel}
                </Badge>

                {!editing ? (
                  <dl className="mt-6 w-full space-y-3 text-left text-sm">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{driver.email ?? "—"}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{driver.phone ?? "—"}</span></div>
                    <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-muted-foreground" /><span className="font-mono text-xs">{driver.licenceNumber}</span></div>
                    <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><span>{fleetNameById(fleets ?? [], driver.fleetId)}</span></div>
                  </dl>
                ) : (
                  <div className="mt-6 w-full space-y-3 text-left">
                    <div className="space-y-1"><Label>{t("Prénom")}</Label><Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>{t("Nom")}</Label><Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>{t("Email")}</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>{t("Téléphone")}</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>{t("N° permis")}</Label><Input value={form.licenceNumber} onChange={(e) => setForm((f) => ({ ...f, licenceNumber: e.target.value }))} /></div>
                    <Button className="w-full" onClick={() => void saveProfile()} disabled={saving}>
                      {saving ? t("Sauvegarde…") : t("Enregistrer")}
                    </Button>
                  </div>
                )}

                {plate && (
                  <div className="mt-4 w-full rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">{t("Véhicule assigné")}</p>
                    <Link href={`/dashboard/manager/vehicles/${driver.assignedVehicleId}`}>
                      <LicensePlate plate={plate} />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{t("Documents du conducteur")}</CardTitle>
                  </div>
                  <DocumentUploadDialog entityKind="driver" entityId={id} defaultDocType="DRIVING_LICENSE" onUploaded={refetchDocs} />
                </CardHeader>
                <CardContent>
                  <DocumentsGrid
                    documents={docs.map((d) => ({
                      id: d.id,
                      docType: d.docType,
                      docNumber: d.docNumber,
                      fileUrl: d.fileUrl,
                      fileMimeType: d.fileMimeType,
                      fileOriginalName: d.fileOriginalName,
                      status: d.status,
                      expiryDate: d.expiryDate,
                      issuer: d.issuer,
                      issueDate: d.issueDate,
                      notes: d.notes,
                      licenseCategories: d.licenseCategories,
                    }))}
                    onEditDocument={setEditDoc}
                    emptyMessage={t("Aucun document enregistré pour ce conducteur.")}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DataGate>

      {editDoc && (
        <DocumentEditDialog
          entityKind="driver"
          entityId={id}
          document={editDoc}
          licenseCategories={editDocMeta?.licenseCategories}
          issuer={editDocMeta?.issuer}
          issueDate={editDocMeta?.issueDate}
          notes={editDocMeta?.notes}
          open={!!editDoc}
          onOpenChange={(o) => !o && setEditDoc(null)}
          onUpdated={refetchDocs}
        />
      )}
    </div>
  );
}
