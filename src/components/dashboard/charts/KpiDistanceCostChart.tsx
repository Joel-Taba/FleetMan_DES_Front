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
import { mockKpiTrend } from "@/lib/mock-manager-data";

export function KpiDistanceCostChart() {
  return (
    <div className="h-full min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockKpiTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="distance"
            stroke="#2696e4"
            name="km"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            stroke="#10B981"
            name="XAF"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
