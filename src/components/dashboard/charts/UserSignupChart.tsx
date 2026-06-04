"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/dashboard/ClientOnly";

type Props = { data: { month: string; count: number }[] };

export function UserSignupChart({ data }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Évolution des inscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <ClientOnly fallback={<div className="h-[280px] animate-pulse rounded-lg bg-muted" />}>
        <div className="h-[280px] w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2696e4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2696e4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2696e4"
                fill="url(#signupGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
