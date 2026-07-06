"use client";

import Link from "next/link";
import { AlertTriangle, FileText } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchComplianceReport,
  fetchExpiredDocuments,
  fetchExpiringDocuments,
} from "@/lib/api/manager";
import { DocumentsGrid } from "../DocumentPreviewCard";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const docStatusVariant: Record<string, "success" | "warning" | "destructive"> = {
  VALID: "success",
  EXPIRING_SOON: "warning",
  EXPIRED: "destructive",
};

function entityHref(entityType: string, entityId: string) {
  if (entityType === "VEHICLE") {
    return `/dashboard/manager/vehicles/${entityId}`;
  }
  if (entityType === "DRIVER") {
    return `/dashboard/manager/drivers/${entityId}`;
  }
  return null;
}

export function DocumentsCompliance() {
  const { t } = useLang();
  const { data: report, loading: reportLoading, error: reportError } = useApiQuery(
    fetchComplianceReport,
    []
  );
  const { data: expiringPage } = useApiQuery(() => fetchExpiringDocuments(30, 0, 50), []);
  const { data: expiredPage } = useApiQuery(() => fetchExpiredDocuments(0, 50), []);

  const score = Math.round(report?.complianceRate ?? 0);
  const scoreColor = score >= 90 ? "text-success" : score >= 70 ? "text-warning" : "text-destructive";
  const expiringSoon = expiringPage?.content ?? [];
  const expired = expiredPage?.content ?? [];

  return (
    <div>
      <PageHeader
        title={t("Documents & Conformité")}
        description={t("Centre de contrôle documentaire.")}
      />

      <DataGate loading={reportLoading} error={reportError}>
        {report && (
          <>
            <div className="mb-8 grid gap-4 lg:grid-cols-4">
              <Card className="lg:col-span-1">
                <CardContent className="flex flex-col items-center p-6">
                  <p className={cn("font-display text-5xl font-bold", scoreColor)}>{score}%</p>
                  <p className="text-sm text-muted-foreground">{t("Conformité globale")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{report.totalDocuments}</p>
                  <p className="text-xs text-muted-foreground">{t("Total documents")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-success">{report.validDocuments}</p>
                  <p className="text-xs text-muted-foreground">{t("Valides")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-destructive">{report.expiredDocuments}</p>
                  <p className="text-xs text-muted-foreground">{t("Expirés")}</p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-warning">{t("Expiration imminente (≤30j)")}</h3>
                  <ul className="mt-3 space-y-2">
                    {expiringSoon.length === 0 ? (
                      <li className="text-sm text-muted-foreground">{t("Aucun document.")}</li>
                    ) : (
                      expiringSoon.map((item) => {
                        const href = entityHref(item.entityType, item.entityId);
                        return (
                          <li key={item.documentId} className="flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate">
                              {item.docType} —{" "}
                              {href ? (
                                <Link href={href} className="text-primary hover:underline">
                                  {item.entityName}
                                </Link>
                              ) : (
                                item.entityName
                              )}
                            </span>
                            <Badge variant={docStatusVariant.EXPIRING_SOON} className="shrink-0">
                              {item.expiryDate}
                            </Badge>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-destructive/30">
                <CardContent className="p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" /> {t("Expirés — action requise")}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {expired.length === 0 ? (
                      <li className="text-sm text-muted-foreground">{t("Aucun document expiré.")}</li>
                    ) : (
                      expired.map((item) => {
                        const href = entityHref(item.entityType, item.entityId);
                        return (
                          <li key={item.documentId} className="flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate">
                              {item.docType} —{" "}
                              {href ? (
                                <Link href={href} className="text-primary hover:underline">
                                  {item.entityName}
                                </Link>
                              ) : (
                                item.entityName
                              )}
                            </span>
                            <Badge variant="destructive" className="shrink-0">
                              {item.expiryDate}
                            </Badge>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DataGate>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">{t("Véhicules")}</TabsTrigger>
          <TabsTrigger value="drivers">{t("Conducteurs")}</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles">
          <DocumentsGrid
            readOnly
            documents={[...expiringSoon, ...expired]
              .filter((item) => item.entityType === "VEHICLE" && item.fileUrl)
              .map((item) => ({
                id: item.documentId,
                docType: item.docType,
                docNumber: item.docNumber,
                fileUrl: item.fileUrl!,
                fileMimeType: item.fileMimeType,
                status: item.status,
                expiryDate: item.expiryDate,
              }))}
            emptyMessage={t("Aucun document véhicule à afficher.")}
          />
        </TabsContent>
        <TabsContent value="drivers">
          <DocumentsGrid
            readOnly
            documents={[...expiringSoon, ...expired]
              .filter((item) => item.entityType === "DRIVER" && item.fileUrl)
              .map((item) => ({
                id: item.documentId,
                docType: item.docType,
                docNumber: item.docNumber,
                fileUrl: item.fileUrl!,
                fileMimeType: item.fileMimeType,
                status: item.status,
                expiryDate: item.expiryDate,
              }))}
            emptyMessage={t("Aucun document conducteur à afficher.")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
