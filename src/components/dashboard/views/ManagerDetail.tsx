"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataGate } from "../DataGate";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchFleetManager } from "@/lib/api/admin";
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

  const active = manager ? managerIsActive(manager) : false;

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
                  {manager.roles.map((r) => (
                    <Badge key={r} variant="outline">{r}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DataGate>
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
