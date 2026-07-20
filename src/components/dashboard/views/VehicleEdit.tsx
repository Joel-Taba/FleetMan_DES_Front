"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { DocumentsGrid, VEHICLE_DOC_TAB, type DocumentPreview } from "../DocumentPreviewCard";
import { DocumentUploadDialog } from "../DocumentUploadDialog";
import { DocumentEditDialog } from "../DocumentEditDialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchVehicleDocuments } from "@/lib/api/manager";
import { createClientId } from "@/lib/offline/db";
import { uploadGalleryFilesOfflineAware } from "@/lib/offline/mutations/document-mutations";
import {
  updateVehicleGalleryOfflineAware,
  updateVehicleOfflineAware,
} from "@/lib/offline/mutations/vehicle-mutations";
import { useOfflineEntity } from "@/lib/offline/hooks/useOfflineEntity";
import { fetchVehicle } from "@/lib/api/manager";
import { VehicleSyncBadge } from "@/components/offline/VehicleSyncBadge";
import { mapVehicleStatus } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function VehicleEdit({ id }: { id: string }) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: vehicle, loading, error, refetch } = useOfflineEntity("vehicle", id, () => fetchVehicle(id));
  const { data: docsPage, refetch: refetchDocs } = useApiQuery(() => fetchVehicleDocuments(id), [id]);

  const [saving, setSaving] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [editDoc, setEditDoc] = useState<DocumentPreview | null>(null);
  const [form, setForm] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    manufacturingYear: "",
    fuelType: "DIESEL",
    transmissionType: "MANUAL",
    color: "",
    status: "AVAILABLE",
  });

  useEffect(() => {
    if (!vehicle) return;
    setForm({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      manufacturingYear: String(vehicle.manufacturingYear ?? ""),
      fuelType: vehicle.fuelType ?? "DIESEL",
      transmissionType: vehicle.transmissionType ?? "MANUAL",
      color: vehicle.color ?? "",
      status: vehicle.status,
    });
    setGallery(vehicle.galleryUrls ?? (vehicle.photoUrl ? [vehicle.photoUrl] : []));
    setMainPhoto(vehicle.photoUrl);
  }, [vehicle]);

  const allDocs: DocumentPreview[] = useMemo(
    () =>
      (docsPage?.content ?? []).map((d) => ({
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
      })),
    [docsPage]
  );

  const docsByTab = useMemo(() => {
    const grouped: Record<string, DocumentPreview[]> = {
      identity: [],
      financial: [],
      maintenance: [],
      operational: [],
    };
    allDocs.forEach((doc) => {
      grouped[VEHICLE_DOC_TAB[doc.docType] ?? "maintenance"].push(doc);
    });
    return grouped;
  }, [allDocs]);

  const editDocMeta = editDoc
    ? docsPage?.content.find((d) => d.id === editDoc.id)
    : undefined;

  async function saveVehicle() {
    if (!vehicle) return;
    setSaving(true);
    try {
      await updateVehicleOfflineAware(id, {
        licensePlate: form.licensePlate,
        brand: form.brand,
        model: form.model,
        manufacturingYear: Number(form.manufacturingYear) || null,
        fuelType: form.fuelType,
        transmissionType: form.transmissionType,
        color: form.color,
        status: form.status,
      });
      await updateVehicleGalleryOfflineAware(id, { photoUrl: mainPhoto, galleryUrls: gallery });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files?.length) return;
    const clientMutationId = createClientId();
    const uploaded = await uploadGalleryFilesOfflineAware(
      Array.from(files),
      "vehicle-photo",
      clientMutationId
    );
    const urls = uploaded.map((entry) => entry.fileUrl);
    const next = [...gallery, ...urls];
    setGallery(next);
    if (!mainPhoto && next.length > 0) setMainPhoto(next[0]);
    await updateVehicleGalleryOfflineAware(
      id,
      { photoUrl: mainPhoto ?? urls[0] ?? null, galleryUrls: next },
      clientMutationId
    );
  }

  const uiStatus = vehicle ? mapVehicleStatus(vehicle.status) : "OUT_OF_SERVICE";

  return (
    <div>
      <Link
        href={`/dashboard/manager/vehicles/${id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("Retour au détail")}
      </Link>

      <DataGate loading={loading} error={error}>
        {vehicle && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">{t("Photos du véhicule")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  {mainPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mainPhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {t("Aucune photo")}
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleGalleryUpload(e.target.files)}
                />
                <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {t("Ajouter des photos")}
                </Button>
                {gallery.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {gallery.map((url) => (
                      <button
                        key={url}
                        type="button"
                        className={`relative overflow-hidden rounded-md border-2 ${mainPhoto === url ? "border-primary" : "border-transparent"}`}
                        onClick={() => setMainPhoto(url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="aspect-video w-full object-cover" />
                        {mainPhoto === url && (
                          <span className="absolute right-1 top-1 rounded bg-primary p-0.5 text-white">
                            <Star className="h-3 w-3 fill-current" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{t("Cliquez sur une vignette pour définir la photo principale.")}</p>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("Informations véhicule")}
                    <VehicleSyncBadge vehicleId={id} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("Immatriculation")}</Label>
                    <Input value={form.licensePlate} onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Statut")}</Label>
                    <select className="h-11 w-full rounded-lg border px-3 text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                      {["AVAILABLE", "ON_TRIP", "MAINTENANCE", "OUT_OF_SERVICE"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Marque")}</Label>
                    <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Modèle")}</Label>
                    <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Année")}</Label>
                    <Input type="number" value={form.manufacturingYear} onChange={(e) => setForm((f) => ({ ...f, manufacturingYear: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Couleur")}</Label>
                    <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button onClick={() => void saveVehicle()} disabled={saving}>
                      {saving ? t("Sauvegarde…") : t("Enregistrer les modifications")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <DocumentUploadDialog entityKind="vehicle" entityId={id} onUploaded={refetchDocs} />
              </div>

              <Tabs defaultValue="identity">
                <TabsList className="h-auto flex-wrap">
                  <TabsTrigger value="identity">{t("Identité")}</TabsTrigger>
                  <TabsTrigger value="financial">{t("Financier")}</TabsTrigger>
                  <TabsTrigger value="maintenance">{t("Maintenance")}</TabsTrigger>
                </TabsList>
                {(["identity", "financial", "maintenance"] as const).map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <DocumentsGrid
                      documents={docsByTab[tab]}
                      onEditDocument={setEditDoc}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        )}
      </DataGate>

      {editDoc && (
        <DocumentEditDialog
          entityKind="vehicle"
          entityId={id}
          document={editDoc}
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
