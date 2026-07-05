"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type KpiCostPoint = {
  cat: string;
  val: number;
};

type Props = {
  /** Données réelles depuis le KpiSnapshot. Si non fourni, affiche des zéros. */
  data?: KpiCostPoint[];
};

export function KpiCostCategoryChart({ data }: Props) {
  const points: KpiCostPoint[] =
    data && data.length > 0
      ? data
      : [
          { cat: "Carburant", val: 0 },
          { cat: "Maint.", val: 0 },
          { cat: "Incidents", val: 0 },
        ];

  return (
    <div className="h-full min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="cat" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(val: number) => [`${val.toLocaleString()} XAF`]}
          />
          <Bar dataKey="val" fill="#2696e4" radius={[4, 4, 0, 0]} name="Montant" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
