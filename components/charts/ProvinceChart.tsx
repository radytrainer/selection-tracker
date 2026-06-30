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
import type { ProvinceStat } from "@/services/dashboardService";

export function ProvinceChart({ stats }: { stats: ProvinceStat[] }) {
  if (stats.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No province data yet.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats} layout="vertical" margin={{ left: 16, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="provinceName"
            tick={{ fontSize: 11 }}
            width={110}
          />
          <Tooltip />
          <Bar dataKey="studentCount" name="Students" fill="#d97706" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
