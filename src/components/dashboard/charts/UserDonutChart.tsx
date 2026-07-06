"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/dashboard/ClientOnly";
import { useLang } from "@/lib/i18n";

type Props = {
  data: { name: string; value: number; color: string }[];
};

export function UserDonutChart({ data }: Props) {
  const { t } = useLang();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Répartition utilisateurs")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ClientOnly fallback={<div className="h-[280px] animate-pulse rounded-lg bg-muted" />}>
        <div className="h-[280px] w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
