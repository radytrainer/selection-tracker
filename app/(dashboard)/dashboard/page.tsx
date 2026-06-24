"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NgoYearlyChart } from "@/components/charts/NgoYearlyChart";
import { getDashboardKpis, type DashboardKpis } from "@/services/dashboardService";
import { getNgoYearlyStats, type NgoYearlyStat } from "@/services/ngoService";

const KPI_FIELDS: { key: keyof DashboardKpis; label: string }[] = [
  { key: "totalStudents", label: "Total Students" },
  { key: "femaleStudents", label: "Female Students" },
  { key: "maleStudents", label: "Male Students" },
  { key: "selectedStudents", label: "Selected Students" },
  { key: "partnerNgos", label: "Partner NGOs" },
  { key: "partnerSchools", label: "Partner Schools" },
  { key: "provincesCovered", label: "Provinces Covered" },
];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [yearlyStats, setYearlyStats] = useState<NgoYearlyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardKpis(), getNgoYearlyStats()])
      .then(([k, y]) => {
        setKpis(k);
        setYearlyStats(y);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Program KPIs and NGO referral trends across selection cycles.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_FIELDS.map(({ key, label }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{loading || !kpis ? "—" : kpis[key]}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students Referred by NGO, Year over Year</CardTitle>
          <CardDescription>
            Filter by year to compare NGOs, or by NGO to see their trend across years.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-80 w-full" /> : <NgoYearlyChart stats={yearlyStats} />}
        </CardContent>
      </Card>
    </div>
  );
}
