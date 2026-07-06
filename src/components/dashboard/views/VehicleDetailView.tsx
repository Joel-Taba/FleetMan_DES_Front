"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { PageHeader } from "../PageHeader";
import { DocumentsGrid, VEHICLE_DOC_TAB, type DocumentPreview } from "../DocumentPreviewCard";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchDrivers, fetchVehicle, fetchVehicleDocuments } from "@/lib/api/manager";
import { driverLabel, mapVehicleStatus, vehicleMileage } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function VehicleDetailView({ id }: { id: string }) {
  const { t } = useLang();
  const { data: vehicle, loading, error } = useApiQuery(() => fetchVehicle(id), [id]);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);
  const { data: docsPage } = useApiQuery(() => fetchVehicleDocuments(id), [id]);

  const driver = (drivers ?? []).find((d) => d.assignedVehicleId === id);
  const uiStatus = vehicle ? mapVehicleStatus(vehicle.status) : "OUT_OF_SERVICE";

  const statusLabels: Record<string, string> = {
    IN_SERVICE: t("En service"),
    ON_TRIP: t("En mission"),
    MAINTENANCE: t("Maintenance"),
    OUT_OF_SERVICE: t("Hors service"),
  };

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
      const tab = VEHICLE_DOC_TAB[doc.docType] ?? "maintenance";
      grouped[tab].push(doc);
    });
    return grouped;
  }, [allDocs]);

  const gallery = vehicle?.galleryUrls?.length
    ? vehicle.galleryUrls
    : vehicle?.photoUrl
      ? [vehicle.photoUrl]
      : [];

  return (
    <div>
      <PageHeader
        title={vehicle?.licensePlate ?? t("Détail véhicule")}
        description={vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}
      >
        <Button asChild size="sm">
          <Link href={`/dashboard/manager/vehicles/${id}/edit`}>
            <Pencil className="h-4 w-4" /> {t("Modifier")}
          </Link>
        </Button>
      </PageHeader>

      <DataGate loading={loading} error={error}>
        {vehicle && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
              <Card>
                <CardContent className="p-4">
                  <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
                    {vehicle.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vehicle.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Image src="/assets/login-truck-highway.jpg" alt="" fill className="object-cover" />
                    )}
                  </div>
                  {gallery.length > 1 && (
                    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                      {gallery.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
                      ))}
                    </div>
                  )}
                  <LicensePlate plate={vehicle.licensePlate} className="text-lg" />
                  <Badge className="mt-3">{statusLabels[uiStatus] ?? vehicle.status}</Badge>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("Marque / Modèle")}</dt>
                      <dd className="font-medium">
                        {vehicle.brand} {vehicle.model} ({vehicle.manufacturingYear ?? "—"})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("N° série")}</dt>
                      <dd className="font-mono text-xs">{vehicle.vehicleSerialNumber ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("Kilométrage")}</dt>
                      <dd>{vehicleMileage(vehicle).toLocaleString()} km</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("Chauffeur")}</dt>
                      <dd>
                        {driver ? (
                          <Link href={`/dashboard/manager/drivers/${driver.userId}`} className="font-medium text-primary">
                            {driverLabel(driver)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Tabs defaultValue="identity">
                <TabsList className="h-auto flex-wrap">
                  <TabsTrigger value="identity">{t("Identité")}</TabsTrigger>
                  <TabsTrigger value="financial">{t("Financier")}</TabsTrigger>
                  <TabsTrigger value="maintenance">{t("Maintenance")}</TabsTrigger>
                  <TabsTrigger value="operational">{t("Opérationnel")}</TabsTrigger>
                </TabsList>

                {(["identity", "financial", "maintenance", "operational"] as const).map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{t("Documents")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DocumentsGrid documents={docsByTab[tab]} readOnly />
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        )}
      </DataGate>
    </div>
  );
}
