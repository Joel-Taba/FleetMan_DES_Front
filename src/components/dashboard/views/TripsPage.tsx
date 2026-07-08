"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Radio, Eye, Trash2, RotateCcw, Play } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { MapView, type MapPoint, type LatLng } from "../MapView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query";
import { deleteTrip, fetchDrivers, fetchTrips, fetchVehicles, startTrip } from "@/lib/api/manager";
import type { ApiDriver, ApiTrip, ApiVehicle } from "@/lib/api/types/manager";
import {
  completedTrips,
  driverLabel,
  formatTripDateTime,
  formatTripDistance,
  ongoingTrips,
  scheduledTrips,
  tripDisplayDistance,
  tripStatusBadgeVariant,
  tripStatusLabel,
  vehiclePlateById,
} from "@/lib/api/mappers/manager";
import {
  filterTripsByPeriod,
  periodLabel,
  type TripPeriodPreset,
} from "@/lib/trips-period-filter";
import { useLang } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const TripsHistoryToolbar = dynamic(
  () =>
    import("../TripsHistoryToolbar").then((mod) => ({
      default: mod.TripsHistoryToolbar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="mb-4 h-36 animate-pulse rounded-2xl border border-border/60 bg-muted/20" />
    ),
  }
);

const VALID_TABS = new Set(["created", "ongoing", "history", "live"]);

function sortTripsByDeparture(trips: ApiTrip[]) {
  return [...trips].sort((a, b) => {
    const da = `${a.startDate ?? ""}T${a.startTime ?? ""}`;
    const db = `${b.startDate ?? ""}T${b.startTime ?? ""}`;
    return db.localeCompare(da);
  });
}

function exportTripsCsv(trips: ApiTrip[], vehicles: ApiVehicle[], drivers: ApiDriver[]) {
  const headers = ["Code", "Départ", "Fin", "Conducteur", "Véhicule", "Distance km", "Statut"];
  const rows = trips.map((trip) => {
    const driver = drivers.find((d) => d.userId === trip.driverId);
    return [
      trip.tripCode ?? trip.id,
      formatTripDateTime(trip.startDate, trip.startTime),
      trip.endDate ? formatTripDateTime(trip.endDate, trip.endTime) : "",
      driver ? driverLabel(driver) : trip.driverId,
      vehiclePlateById(vehicles, trip.vehicleId) ?? trip.vehicleId,
      tripDisplayDistance(trip) ?? "",
      tripStatusLabel(trip.status),
    ];
  });
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trajets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type TripTableProps = {
  trips: ApiTrip[];
  vehicles: ApiVehicle[];
  driverName: (driverId: string) => string;
  emptyMessage: string;
  showEndColumn?: boolean;
  showReturnAction?: boolean;
  showStartAction?: boolean;
  returnTab?: string;
  onDelete: (id: string, code?: string | null) => void;
  onStart?: (id: string) => void;
  startingId?: string | null;
  deletingId: string | null;
  t: (key: string) => string;
};

function TripTable({
  trips,
  vehicles,
  driverName,
  emptyMessage,
  showEndColumn = false,
  showReturnAction = false,
  showStartAction = false,
  returnTab,
  onDelete,
  onStart,
  startingId,
  deletingId,
  t,
}: TripTableProps) {
  const detailHref = (tripId: string) => {
    const base = `/dashboard/manager/trips/${tripId}`;
    return returnTab ? `${base}?returnTab=${returnTab}` : base;
  };

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
          <tr>
            <th>{t("Code")}</th>
            <th>{t("Départ")}</th>
            {showEndColumn && <th>{t("Fin")}</th>}
            <th>{t("Chauffeur")}</th>
            <th>{t("Véhicule")}</th>
            <th>{t("Distance")}</th>
            <th>{t("Statut")}</th>
            <th className="text-right">{t("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {trips.length === 0 ? (
            <tr>
              <td colSpan={showEndColumn ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            trips.map((trip, i) => (
              <tr key={trip.id} className={cn(i % 2 && "bg-muted/20")}>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{trip.tripCode ?? "—"}</td>
                <td className="px-4 py-3">{formatTripDateTime(trip.startDate, trip.startTime)}</td>
                {showEndColumn && (
                  <td className="px-4 py-3">
                    {trip.endDate ? formatTripDateTime(trip.endDate, trip.endTime) : "—"}
                  </td>
                )}
                <td className="px-4 py-3">{driverName(trip.driverId)}</td>
                <td className="px-4 py-3">
                  <LicensePlate plate={vehiclePlateById(vehicles, trip.vehicleId) ?? "—"} />
                </td>
                <td className="px-4 py-3">{formatTripDistance(trip)}</td>
                <td className="px-4 py-3">
                  <Badge variant={tripStatusBadgeVariant(trip.status)}>{tripStatusLabel(trip.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {showStartAction && onStart && (
                      <Tooltip label={t("Lancer le trajet")}>
                        <button
                          type="button"
                          className="rounded-full p-2 text-muted-foreground hover:bg-success/10 hover:text-success disabled:opacity-50"
                          aria-label={t("Lancer le trajet")}
                          disabled={startingId === trip.id}
                          onClick={() => onStart(trip.id)}
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    {showReturnAction && (
                      <Tooltip label={t("Enregistrer le retour")}>
                        <Link
                          href={`/dashboard/manager/trips/return?code=${encodeURIComponent(trip.tripCode ?? "")}`}
                          className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                          aria-label={t("Enregistrer le retour")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Link>
                      </Tooltip>
                    )}
                    <Tooltip label={t("Voir les détails")}>
                      <Link
                        href={detailHref(trip.id)}
                        className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                        aria-label={t("Voir les détails")}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Tooltip>
                    <Tooltip label={t("Supprimer")}>
                        <button
                          type="button"
                          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                          aria-label={t("Supprimer")}
                          disabled={deletingId === trip.id}
                          onClick={() => onDelete(trip.id, trip.tripCode)}
                        >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TripsPage() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "ongoing";

  const { data: trips, loading, error, refetch } = useApiQuery(() => fetchTrips(), []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code?: string | null } | null>(null);
  const [periodPreset, setPeriodPreset] = useState<TripPeriodPreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const created = useMemo(() => sortTripsByDeparture(scheduledTrips(trips ?? [])), [trips]);
  const ongoing = useMemo(() => sortTripsByDeparture(ongoingTrips(trips ?? [])), [trips]);
  const allHistory = useMemo(() => sortTripsByDeparture(completedTrips(trips ?? [])), [trips]);
  const filteredHistory = useMemo(
    () => filterTripsByPeriod(allHistory, periodPreset, customFrom, customTo),
    [allHistory, periodPreset, customFrom, customTo]
  );

  const [selectedOngoing, setSelectedOngoing] = useState<string | undefined>();
  const selectedId = selectedOngoing ?? ongoing[0]?.id;

  const driverName = (driverId: string) => {
    const d = (drivers ?? []).find((x) => x.userId === driverId);
    return d ? driverLabel(d) : driverId.slice(0, 8);
  };

  const selectedTrip = ongoing.find((trip) => trip.id === selectedId);

  const selectedMap = useMemo(() => {
    if (!selectedTrip) {
      return {
        center: [3.9, 11.0] as LatLng,
        points: [] as MapPoint[],
        route: [] as LatLng[],
      };
    }

    const departure: LatLng | null =
      selectedTrip.departureLat != null && selectedTrip.departureLng != null
        ? [selectedTrip.departureLat, selectedTrip.departureLng]
        : null;

    const vehicle = (vehicles ?? []).find((v) => v.id === selectedTrip.vehicleId);
    const current = vehicle?.operationalParameters?.currentLocation;
    const currentPos: LatLng | null = current
      ? [current.latitude, current.longitude]
      : null;

    const points: MapPoint[] = [];
    if (departure) {
      points.push({
        position: departure,
        label: `Départ — ${selectedTrip.departureLocation ?? selectedTrip.tripCode}`,
        color: "#22c55e",
      });
    }
    if (currentPos) {
      points.push({
        position: currentPos,
        label: `${vehiclePlateById(vehicles ?? [], selectedTrip.vehicleId) ?? "Véhicule"} — ${driverName(selectedTrip.driverId)}`,
        color: "#2696e4",
      });
    }

    const route: LatLng[] = [];
    if (departure) route.push(departure);
    if (currentPos) route.push(currentPos);

    return {
      center: currentPos ?? departure ?? ([3.9, 11.0] as LatLng),
      points,
      route,
    };
  }, [selectedTrip, vehicles, drivers]);

  function changeTab(tab: string) {
    router.replace(`/dashboard/manager/trips?tab=${tab}`, { scroll: false });
  }

  async function handleStartTrip(id: string) {
    setStartingId(id);
    try {
      await startTrip(id);
      refetch();
      router.replace("/dashboard/manager/trips?tab=ongoing", { scroll: false });
    } finally {
      setStartingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);
    try {
      await deleteTrip(id);
      refetch();
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExportPdf() {
    if (filteredHistory.length === 0) return;
    setExportingPdf(true);
    try {
      const { exportTripsHistoryPdf } = await import("@/lib/export/trips-history-pdf");
      await exportTripsHistoryPdf({
        trips: filteredHistory,
        vehicles: vehicles ?? [],
        drivers: drivers ?? [],
        periodLabel: periodLabel(periodPreset, customFrom, customTo),
      });
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div>
      <PageHeader title="Trajets" description="Historique et suivi temps réel.">
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/dashboard/manager/trips/return">Enregistrer un retour</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/manager/trips/plan">
              <Plus className="h-4 w-4" /> {t("Planifier un trajet")}
            </Link>
          </Button>
        </div>
      </PageHeader>

      <DataGate loading={loading} error={error}>
        <Tabs value={activeTab} onValueChange={changeTab}>
          <TabsList>
            <TabsTrigger value="created">
              {t("Créés")} ({created.length})
            </TabsTrigger>
            <TabsTrigger value="ongoing">
              {t("En cours")} ({ongoing.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              {t("Historique")} ({filteredHistory.length})
            </TabsTrigger>
            <TabsTrigger value="live">{t("Temps réel")}</TabsTrigger>
          </TabsList>

          <TabsContent value="created">
            <TripTable
              trips={created}
              vehicles={vehicles ?? []}
              driverName={driverName}
              emptyMessage={t("Aucun trajet créé en attente de lancement.")}
              showStartAction
              returnTab="created"
              onStart={handleStartTrip}
              startingId={startingId}
              onDelete={(id, code) => setDeleteTarget({ id, code })}
              deletingId={deletingId}
              t={t}
            />
          </TabsContent>

          <TabsContent value="ongoing">
            <TripTable
              trips={ongoing}
              vehicles={vehicles ?? []}
              driverName={driverName}
              emptyMessage={t("Aucun trajet en cours.")}
              showReturnAction
              returnTab="ongoing"
              onDelete={(id, code) => setDeleteTarget({ id, code })}
              deletingId={deletingId}
              t={t}
            />
          </TabsContent>

          <TabsContent value="history">
            <TripsHistoryToolbar
              periodPreset={periodPreset}
              onPeriodChange={setPeriodPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              filteredCount={filteredHistory.length}
              totalCount={allHistory.length}
              onExportCsv={() => exportTripsCsv(filteredHistory, vehicles ?? [], drivers ?? [])}
              onExportPdf={handleExportPdf}
              exportingPdf={exportingPdf}
            />
            <TripTable
              trips={filteredHistory}
              vehicles={vehicles ?? []}
              driverName={driverName}
              emptyMessage="Aucun trajet dans l'historique pour cette période."
              showEndColumn
              returnTab="history"
              onDelete={(id, code) => setDeleteTarget({ id, code })}
              deletingId={deletingId}
              t={t}
            />
          </TabsContent>

          <TabsContent value="live">
            {ongoing.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t("Aucun trajet en cours.")}</p>
            ) : (
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {selectedTrip && (
                      <div className="border-b bg-muted/30 px-4 py-2 text-sm">
                        <span className="font-mono font-semibold text-primary">{selectedTrip.tripCode}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span>{driverName(selectedTrip.driverId)}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <LicensePlate plate={vehiclePlateById(vehicles ?? [], selectedTrip.vehicleId) ?? "—"} />
                      </div>
                    )}
                    <MapView
                      key={selectedId}
                      className="h-[380px] w-full"
                      center={selectedMap.center}
                      zoom={8}
                      points={selectedMap.points}
                      route={selectedMap.route}
                      fitToContent
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ongoing.map((trip) => (
                    <Card
                      key={trip.id}
                      className={cn(
                        "cursor-pointer transition hover:border-primary/40",
                        selectedId === trip.id && "border-primary ring-2 ring-primary/20"
                      )}
                      onClick={() => setSelectedOngoing(trip.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-success">
                            <Radio className="h-4 w-4 animate-pulse" />
                            <span className="text-xs font-semibold">{t("En direct")}</span>
                          </div>
                          <Badge variant={tripStatusBadgeVariant(trip.status)}>
                            {tripStatusLabel(trip.status)}
                          </Badge>
                        </div>
                        <p className="mt-2 font-mono text-xs font-semibold text-primary">{trip.tripCode}</p>
                        <p className="mt-1 font-medium">{driverName(trip.driverId)}</p>
                        <LicensePlate plate={vehiclePlateById(vehicles ?? [], trip.vehicleId) ?? "—"} className="mt-1" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Départ {formatTripDateTime(trip.startDate, trip.startTime)}
                          {tripDisplayDistance(trip) != null ? ` · ${formatTripDistance(trip)}` : ""}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DataGate>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("Supprimer le trajet")}
        description={
          deleteTarget
            ? t(`Confirmez la suppression du trajet ${deleteTarget.code ?? deleteTarget.id}. Cette action est irréversible.`)
            : ""
        }
        confirmLabel={t("Supprimer")}
        variant="destructive"
        loading={!!deletingId}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
