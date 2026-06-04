"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/dashboard/ClientOnly";

type Props = { value: number };

export function FleetHealthGauge({ value }: Props) {
  const data = [
    { name: "score", value },
    { name: "rest", value: 100 - value },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Santé du parc</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ClientOnly fallback={<div className="h-[200px] w-full max-w-[280px] animate-pulse rounded-lg bg-muted" />}>
        <div className="relative h-[200px] w-full max-w-[280px] min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={70}
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#10B981" />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <span className="font-display text-4xl font-bold text-foreground">
              {value}%
            </span>
            <p className="text-xs text-muted-foreground">Disponibilité & conformité</p>
          </div>
        </div>
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
