"use client";

import { useEffect, useMemo, useState } from "react";
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
import { VisitorStatsChart } from "@/components/charts/VisitorStatsChart";
import { NgoTotalsChart } from "@/components/charts/NgoTotalsChart";
import { ProvinceChart } from "@/components/charts/ProvinceChart";
import {
  getDashboardData,
  getVisitorStats,
  type DashboardStudent,
  type VisitorStat,
} from "@/services/dashboardService";
import { getNgoYearlyStats, type NgoYearlyStat } from "@/services/ngoService";
import { cn } from "@/lib/utils";

type GenderFilter = "" | "female" | "male" | "lgbtqia+";

const GENDER_FILTERS: { value: GenderFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "lgbtqia+", label: "LGBTQIA+" },
];

function applyGender(students: DashboardStudent[], filter: GenderFilter) {
  return filter ? students.filter((s) => s.gender === filter) : students;
}

export default function DashboardPage() {
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [partnerNgos, setPartnerNgos] = useState(0);
  const [partnerSchools, setPartnerSchools] = useState(0);
  const [yearlyStats, setYearlyStats] = useState<NgoYearlyStat[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("");

  useEffect(() => {
    Promise.all([getDashboardData(), getNgoYearlyStats(), getVisitorStats()])
      .then(([d, y, v]) => {
        setStudents(d.students);
        setPartnerNgos(d.partnerNgos);
        setPartnerSchools(d.partnerSchools);
        setYearlyStats(y);
        setVisitorStats(v);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  // Gender counts — always absolute (unfiltered), used for the filter cards
  const genderCounts = useMemo(() => ({
    female: students.filter((s) => s.gender === "female").length,
    male: students.filter((s) => s.gender === "male").length,
    "lgbtqia+": students.filter((s) => s.gender === "lgbtqia+").length,
  }), [students]);

  const filtered = useMemo(() => applyGender(students, genderFilter), [students, genderFilter]);

  const kpis = useMemo(() => ({
    totalStudents: filtered.length,
    selectedStudents: filtered.filter((s) => s.decision === "selected").length,
    provincesCovered: new Set(filtered.map((s) => s.province_name).filter(Boolean)).size,
  }), [filtered]);

  const provinceStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      const name = s.province_name ?? "Unknown";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([provinceName, studentCount]) => ({ provinceName, studentCount }))
      .sort((a, b) => b.studentCount - a.studentCount);
  }, [filtered]);

  const ngoTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      if (!s.ngo_name) continue;
      map.set(s.ngo_name, (map.get(s.ngo_name) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([ngoName, studentCount]) => ({ ngoName, studentCount }))
      .sort((a, b) => b.studentCount - a.studentCount);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Program KPIs and NGO referral trends across selection cycles.
        </p>
      </div>

      {/* Gender filter cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {GENDER_FILTERS.map(({ value, label }) => {
          const count =
            value === ""
              ? students.length
              : genderCounts[value as keyof typeof genderCounts];
          const active = genderFilter === value;
          return (
            <Card
              key={value}
              className={cn(
                "cursor-pointer select-none transition-colors hover:border-primary",
                active && "border-primary bg-primary/5",
              )}
              onClick={() => setGenderFilter(active ? "" : value)}
            >
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{loading ? "—" : count}</CardTitle>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main KPI tiles — respond to gender filter */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Students", value: kpis.totalStudents },
          { label: "Selected Students", value: kpis.selectedStudents },
          { label: "Partner NGOs", value: partnerNgos },
          { label: "Partner Schools", value: partnerSchools },
          { label: "Provinces Covered", value: kpis.provincesCovered },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{loading ? "—" : value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NGO YoY + Social Forms — 2 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Social Forms Filled by Visitor</CardTitle>
            <CardDescription>
              How many distinct students each home visitor has visited and recorded a social form for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-80 w-full" /> : <VisitorStatsChart stats={visitorStats} />}
          </CardContent>
        </Card>
      </div>

      {/* NGO totals chart */}
      <Card>
        <CardHeader>
          <CardTitle>Students by NGO</CardTitle>
          <CardDescription>
            Total students referred by each NGO
            {genderFilter ? ` — ${genderFilter === "lgbtqia+" ? "LGBTQIA+" : genderFilter} only` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-80 w-full" /> : <NgoTotalsChart stats={ngoTotals} />}
        </CardContent>
      </Card>

      {/* Province chart */}
      <Card>
        <CardHeader>
          <CardTitle>Students by Province</CardTitle>
          <CardDescription>
            Number of students from each province
            {genderFilter ? ` — ${genderFilter === "lgbtqia+" ? "LGBTQIA+" : genderFilter} only` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-80 w-full" /> : <ProvinceChart stats={provinceStats} />}
        </CardContent>
      </Card>
    </div>
  );
}
