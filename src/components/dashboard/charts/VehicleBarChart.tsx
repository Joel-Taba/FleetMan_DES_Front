"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/dashboard/ClientOnly";
import { useLang } from "@/lib/i18n";

type Props = { data: { type: string; count: number }[] };

export function VehicleBarChart({ data }: Props) {
  const { t } = useLang();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Véhicules par type")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ClientOnly fallback={<div className="h-[240px] animate-pulse rounded-lg bg-muted" />}>
        <div className="h-[240px] w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2696e4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
