"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type KpiTrendPoint = {
  day: string;
  distance: number;
  cost: number;
};

type Props = {
  /** Points de données réels. Si non fourni, affiche un état vide. */
  data?: KpiTrendPoint[];
};

export function KpiDistanceCostChart({ data }: Props) {
  // Données de substitution si aucune donnée disponible
  const points: KpiTrendPoint[] =
    data && data.length > 0
      ? data
      : [
          { day: "J-6", distance: 0, cost: 0 },
          { day: "J-5", distance: 0, cost: 0 },
          { day: "J-4", distance: 0, cost: 0 },
          { day: "J-3", distance: 0, cost: 0 },
          { day: "J-2", distance: 0, cost: 0 },
          { day: "J-1", distance: 0, cost: 0 },
          { day: "Auj.", distance: 0, cost: 0 },
        ];

  return (
    <div className="h-full min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(val: number, name: string) =>
              name === "XAF"
                ? [`${val.toLocaleString()} XAF`, name]
                : [`${val.toLocaleString()} km`, name]
            }
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="distance"
            stroke="#2696e4"
            name="km"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            stroke="#10B981"
            name="XAF"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
