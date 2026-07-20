"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Car, Users, Eye } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchDrivers } from "@/lib/api/manager";
import { useManagerFleets } from "@/lib/offline/hooks/useManagerResources";
import { FleetSyncBadge } from "@/components/offline/EntitySyncBadges";
import { useLang } from "@/lib/i18n";

export function FleetsList() {
  const { t } = useLang();
  const [search, setSearch] = useState("");

  const { data: fleets, loading, error } = useManagerFleets();
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const driverCountByFleet = useMemo(() => {
    const map = new Map<string, number>();
    (drivers ?? []).forEach((d) => {
      map.set(d.fleetId, (map.get(d.fleetId) ?? 0) + 1);
    });
    return map;
  }, [drivers]);

  const filtered = (fleets ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={t("Mes Flottes")}
        description={t("Flottes qui vous ont été assignées par votre administrateur.")}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={t("Rechercher par nom...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataGate
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyMessage={t("Aucune flotte ne vous a encore été assignée.")}
      >
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((fleet) => (
            <Card key={fleet.id} className="h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <Link href={`/dashboard/manager/fleets/${fleet.id}`} className="flex-1">
                    <h3 className="font-display text-xl font-semibold hover:text-primary">
                      {fleet.name}
                      <FleetSyncBadge entityId={fleet.id} />
                    </h3>
                    <Badge variant="success" className="mt-2">{t("Actif")}</Badge>
                  </Link>
                  <Tooltip label={t("Voir les détails")}>
                    <Link
                      href={`/dashboard/manager/fleets/${fleet.id}`}
                      className="rounded p-1 hover:bg-muted"
                      aria-label={t("Voir les détails")}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Tooltip>
                </div>
                <Link href={`/dashboard/manager/fleets/${fleet.id}`}>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("Créée le")}{" "}
                    {fleet.creationDate ? new Date(fleet.creationDate).toLocaleDateString("fr-FR") : "—"}
                  </p>
                  <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Car className="h-4 w-4" /> {fleet.vehicleCount ?? 0}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {driverCountByFleet.get(fleet.id) ?? 0}</span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataGate>
    </div>
  );
}
