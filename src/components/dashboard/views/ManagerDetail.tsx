"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Truck, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataGate } from "../DataGate";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api/mock-wrapper";
import { fetchFleetManager, fetchManagerFleets, unassignFleetFromManager } from "@/lib/api/admin";
import type { FleetResponse } from "@/lib/api/types/manager";
import {
  formatLastLogin,
  managerFullName,
  managerInitials,
  managerIsActive,
} from "@/lib/api/mappers/admin";
import { useLang } from "@/lib/i18n";

export function ManagerDetail({ id }: { id: string }) {
  const { t } = useLang();
  const { data: manager, loading, error } = useApiQuery(() => fetchFleetManager(id), [id]);
  const { data: fleets, loading: fleetsLoading, refetch: refetchFleets } = useApiQuery(
    () => fetchManagerFleets(id),
    [id]
  );
  const [unassignTarget, setUnassignTarget] = useState<FleetResponse | null>(null);
  const [unassigning, setUnassigning] = useState(false);
  const [unassignError, setUnassignError] = useState<string | null>(null);
  // Garde synchrone anti double-clic : `disabled={loading}` ne prend effet qu'au
  // prochain rendu React, donc un double-clic rapide peut envoyer deux requêtes
  // avant que le bouton ne soit désactivé.
  const unassignInFlightRef = useRef(false);

  const active = manager ? managerIsActive(manager) : false;

  async function handleUnassign() {
    if (!unassignTarget) return;
    if (unassignInFlightRef.current) return;
    unassignInFlightRef.current = true;
    setUnassigning(true);
    setUnassignError(null);
    try {
      await unassignFleetFromManager(id, unassignTarget.id);
      setUnassignTarget(null);
      refetchFleets();
    } catch (err) {
      setUnassignError(err instanceof ApiError ? err.message : t("Désassignation impossible."));
    } finally {
      unassignInFlightRef.current = false;
      setUnassigning(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/admin/managers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Retour aux gestionnaires")}
      </Link>

      <DataGate loading={loading} error={error}>
        {manager && (
          <>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {managerInitials(manager)}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="font-display text-xl font-bold">{managerFullName(manager)}</h2>
                  <p className="text-muted-foreground">{manager.companyName ?? "—"}</p>
                  <Badge className="mt-2" variant={active ? "success" : "muted"}>
                    {active ? t("Actif") : t("Inactif")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Informations personnelles")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Mail} label={t("Email")} value={manager.email} />
                <InfoRow icon={Phone} label={t("Téléphone")} value={manager.phone ?? "—"} />
                <InfoRow icon={Users} label={t("Dernière connexion")} value={formatLastLogin(manager.lastLoginAt)} />
                <InfoRow icon={Users} label={t("Identifiant")} value={manager.username} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Rôles & service")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">{t("Service :")} </span>
                  {manager.service ?? "FLEET_MANAGEMENT"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(manager.roles ?? []).map((r) => (
                    <Badge key={r} variant="outline">{r}</Badge>
                  ))}
                  {(manager.roles ?? []).length === 0 && (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  {t("Flottes assignées")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unassignError && (
                  <p className="mb-3 text-sm text-destructive">{unassignError}</p>
                )}
                {fleetsLoading ? (
                  <p className="text-sm text-muted-foreground">{t("Chargement…")}</p>
                ) : (fleets ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("Aucune flotte assignée pour le moment.")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {(fleets ?? []).map((fleet) => (
                      <li
                        key={fleet.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Truck className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{fleet.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {fleet.vehicleCount ?? 0} {t("véhicule(s)")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setUnassignError(null);
                              setUnassignTarget(fleet);
                            }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            {t("Désassigner")}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </DataGate>

      <ConfirmDialog
        open={unassignTarget != null}
        onOpenChange={(open) => {
          if (!open) setUnassignTarget(null);
        }}
        title={t("Désassigner cette flotte ?")}
        description={
          unassignTarget
            ? `${t("La flotte")} « ${unassignTarget.name} » ${t("sera libérée et pourra être assignée à un autre gestionnaire.")}`
            : ""
        }
        confirmLabel={t("Désassigner")}
        variant="destructive"
        loading={unassigning}
        onConfirm={handleUnassign}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
