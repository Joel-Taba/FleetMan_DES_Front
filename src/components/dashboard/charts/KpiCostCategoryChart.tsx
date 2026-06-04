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

const data = [
  { cat: "Carburant", val: 45 },
  { cat: "Maint.", val: 25 },
  { cat: "Incidents", val: 15 },
  { cat: "Assur.", val: 15 },
];

export function KpiCostCategoryChart() {
  return (
    <div className="h-full min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="cat" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="val" fill="#2696e4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
