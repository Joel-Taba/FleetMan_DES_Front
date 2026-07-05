"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, IdCard, Truck, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataGate } from "../DataGate";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { DocumentsGrid } from "../DocumentPreviewCard";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchDriver,
  fetchDriverDocuments,
  fetchFleets,
  fetchVehicles,
} from "@/lib/api/manager";
import { driverFullName, driverInitials, fleetNameById, vehiclePlateById } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function DriverDetail({ id }: { id: string }) {
  const { t } = useLang();
  const { data: driver, loading, error } = useApiQuery(() => fetchDriver(id), [id]);
  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: docsPage } = useApiQuery(() => fetchDriverDocuments(id), [id]);

  const docs = docsPage?.content ?? [];
  const name = driver ? driverFullName(driver) ?? driver.licenceNumber : "";
  const plate = vehiclePlateById(vehicles ?? [], driver?.assignedVehicleId ?? null);

  const statusLabel = useMemo(() => {
    const map: Record<string, string> = {
      ACTIVE: t("Actif"),
      INACTIVE: t("Inactif"),
      ON_LEAVE: t("En congé"),
    };
    return driver ? map[driver.status] ?? driver.status : "";
  }, [driver, t]);

  return (
    <div>
      <PageHeader title={t("Profil conducteur")} description={name} />

      <DataGate loading={loading} error={error}>
        {driver && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {driverInitials(driver)}
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">{name}</h2>
                <p className="text-sm text-muted-foreground">@{driver.username ?? driver.userId.slice(0, 8)}</p>
                <Badge className="mt-3" variant={driver.status === "ACTIVE" ? "success" : "warning"}>
                  {statusLabel}
                </Badge>

                <dl className="mt-6 w-full space-y-3 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.email ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{driver.licenceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{fleetNameById(fleets ?? [], driver.fleetId)}</span>
                  </div>
                </dl>

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
                <CardHeader>
                  <CardTitle className="text-base">{t("Informations complémentaires")}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("Identifiant")}</p>
                    <p className="font-mono text-xs">{driver.userId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("Flotte")}</p>
                    <p>{fleetNameById(fleets ?? [], driver.fleetId)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("Statut")}</p>
                    <p>{statusLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("Véhicule")}</p>
                    <p>{plate ?? t("Non assigné")}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("Documents du conducteur")}</CardTitle>
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
                    }))}
                    emptyMessage={t("Aucun document enregistré pour ce conducteur.")}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DataGate>
    </div>
  );
}
