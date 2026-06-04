"use client";

import { AlertTriangle, FileText } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockDocumentsCompliance } from "@/lib/mock-manager-data";
import { cn } from "@/lib/utils";

const docStatusVariant = {
  VALID: "success",
  EXPIRING_SOON: "warning",
  EXPIRED: "destructive",
} as const;

export function DocumentsCompliance() {
  const d = mockDocumentsCompliance;
  const scoreColor = d.score >= 90 ? "text-success" : d.score >= 70 ? "text-warning" : "text-destructive";

  return (
    <div>
      <PageHeader title="Documents & Conformité" description="Centre de contrôle documentaire." />

      <div className="mb-8 grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6">
            <p className={cn("font-display text-5xl font-bold", scoreColor)}>{d.score}%</p>
            <p className="text-sm text-muted-foreground">Conformité globale</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{d.total}</p><p className="text-xs text-muted-foreground">Total documents</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{d.valid}</p><p className="text-xs text-muted-foreground">Valides</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{d.critical}</p><p className="text-xs text-muted-foreground">Critiques</p></CardContent></Card>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-warning">Expiration imminente (≤30j)</h3>
            <ul className="mt-3 space-y-2">
              {d.expiringSoon.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.type} — {item.entity}</span>
                  <Badge variant="warning">{item.date}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <h3 className="flex items-center gap-2 font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Expirés — action requise
            </h3>
            <ul className="mt-3 space-y-2">
              {d.expired.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.type} — {item.entity}</span>
                  <div className="flex gap-2">
                    {item.blocked && <Badge variant="destructive">BLOQUÉ</Badge>}
                    <Button size="sm" variant="secondary">Renouveler</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Documents véhicules</TabsTrigger>
          <TabsTrigger value="drivers">Documents conducteurs</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.vehicleDocs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <FileText className="mb-2 h-8 w-8 text-primary" />
                  <p className="font-semibold">{doc.label}</p>
                  <LicensePlate plate={doc.plate} className="mt-2" />
                  <Badge variant={docStatusVariant[doc.status as keyof typeof docStatusVariant]} className="mt-2">
                    {doc.expiry}
                  </Badge>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="ghost">Aperçu</Button>
                    <Button size="sm">Renouveler</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="drivers">
          <p className="text-muted-foreground">Documents conducteurs — même structure, données API à brancher.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
