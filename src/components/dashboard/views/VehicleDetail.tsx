"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import {
  DocumentsGrid,
  VEHICLE_DOC_TAB,
  type DocumentPreview,
} from "../DocumentPreviewCard";
import { DocumentUploadDialog } from "../DocumentUploadDialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchDrivers, fetchVehicle, fetchVehicleDocuments } from "@/lib/api/manager";
import { driverFullName, mapVehicleStatus, vehicleMileage } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function VehicleDetail({ id }: { id: string }) {
  const { t } = useLang();
  const { data: vehicle, loading, error } = useApiQuery(() => fetchVehicle(id), [id]);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);
  const { data: docsPage, refetch: refetchDocs } = useApiQuery(() => fetchVehicleDocuments(id), [id]);

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

  const driverName = driver ? driverFullName(driver) ?? driver.licenceNumber : null;

  return (
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
                        <Link href={`/dashboard/manager/drivers/${driver.userId}`} className="text-primary font-medium">
                          {driverName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-col gap-2">
                  <Button size="sm" variant="secondary">{t("Envoyer en maintenance")}</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-end">
              <DocumentUploadDialog
                entityKind="vehicle"
                entityId={id}
                onUploaded={refetchDocs}
              />
            </div>
            <Tabs defaultValue="identity">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="identity">{t("Identité")}</TabsTrigger>
                <TabsTrigger value="financial">{t("Financier")}</TabsTrigger>
                <TabsTrigger value="maintenance">{t("Maintenance")}</TabsTrigger>
                <TabsTrigger value="operational">{t("Opérationnel")}</TabsTrigger>
              </TabsList>

              <TabsContent value="identity">
                <Card className="mb-4">
                  <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-muted-foreground">{t("Carburant")}</p><p>{vehicle.fuelType ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Transmission")}</p><p>{vehicle.transmissionType ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Couleur")}</p><p>{vehicle.color ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Places")}</p><p>{vehicle.totalSeatNumber ?? "—"}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("Documents — Identité")}</CardTitle></CardHeader>
                  <CardContent>
                    <DocumentsGrid documents={docsByTab.identity} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial">
                <Card className="mb-4">
                  <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-muted-foreground">{t("Assurance")}</p><p>{vehicle.financialParameters?.insuranceNumber ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Expiration assurance")}</p><p>{vehicle.financialParameters?.insuranceExpiryDate ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Coût/km")}</p><p>{vehicle.financialParameters?.costPerKm != null ? `${vehicle.financialParameters.costPerKm} XAF` : "—"}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("Documents — Financier")}</CardTitle></CardHeader>
                  <CardContent>
                    <DocumentsGrid documents={docsByTab.financial} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance">
                <Card className="mb-4">
                  <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-muted-foreground">{t("Dernière maintenance")}</p><p>{vehicle.maintenanceParameters?.lastMaintenanceDate ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Prochaine échéance")}</p><p>{vehicle.maintenanceParameters?.nextMaintenanceDue ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("État moteur")}</p><p>{vehicle.maintenanceParameters?.engineStatus ?? "—"}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("Documents — Maintenance")}</CardTitle></CardHeader>
                  <CardContent>
                    <DocumentsGrid documents={docsByTab.maintenance} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="operational">
                <Card className="mb-4">
                  <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-muted-foreground">{t("Vitesse")}</p><p>{vehicle.operationalParameters?.currentSpeed ?? "—"} km/h</p></div>
                    <div><p className="text-muted-foreground">{t("Carburant")}</p><p>{vehicle.operationalParameters?.fuelLevel ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">{t("Position")}</p><p>
                      {vehicle.operationalParameters?.currentLocation
                        ? `${vehicle.operationalParameters.currentLocation.latitude}, ${vehicle.operationalParameters.currentLocation.longitude}`
                        : "—"}
                    </p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("Documents — Opérationnel")}</CardTitle></CardHeader>
                  <CardContent>
                    <DocumentsGrid documents={docsByTab.operational} emptyMessage={t("Aucun document rattaché à l'onglet opérationnel.")} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </DataGate>
  );
}
