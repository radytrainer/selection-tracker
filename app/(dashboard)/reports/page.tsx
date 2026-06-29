"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getProvinceStats, type ProvinceStats } from "@/services/mapService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CycleSelect } from "@/components/forms/CycleSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useCycleFilter } from "@/hooks/useCycleFilter";
import { Download } from "lucide-react";

function toCsv(rows: ProvinceStats[]) {
  const header = [
    "Province",
    "Total Students",
    "Male",
    "Female",
    "Exam Completed",
    "Interview Completed",
    "Home Visit Completed",
    "Selected",
  ];
  const lines = rows.map((r) =>
    [
      r.nameEn,
      r.totalStudents,
      r.maleStudents,
      r.femaleStudents,
      r.examCompleted,
      r.interviewCompleted,
      r.homeVisitCompleted,
      r.selectedStudents,
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export default function ReportsPage() {
  const { cycles, cycleId, setCycleId } = useCycleFilter();
  const [stats, setStats] = useState<ProvinceStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProvinceStats(cycleId || undefined)
      .then(setStats)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load report data"))
      .finally(() => setLoading(false));
  }, [cycleId]);

  function handleExport() {
    const blob = new Blob([toCsv(stats)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `province-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totals = stats.reduce(
    (acc, r) => ({
      totalStudents: acc.totalStudents + r.totalStudents,
      selectedStudents: acc.selectedStudents + r.selectedStudents,
      examCompleted: acc.examCompleted + r.examCompleted,
      interviewCompleted: acc.interviewCompleted + r.interviewCompleted,
      homeVisitCompleted: acc.homeVisitCompleted + r.homeVisitCompleted,
    }),
    { totalStudents: 0, selectedStudents: 0, examCompleted: 0, interviewCompleted: 0, homeVisitCompleted: 0 },
  );
  const selectionRate =
    totals.totalStudents > 0 ? `${Math.round((totals.selectedStudents / totals.totalStudents) * 100)}%` : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Selection pipeline progress by province, current cycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CycleSelect cycles={cycles} value={cycleId} allowAll onChange={setCycleId} className="w-48" />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{totals.totalStudents}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selected</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{totals.selectedStudents}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selection Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{selectionRate}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Provinces Covered</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{stats.filter((s) => s.totalStudents > 0).length}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Province</CardTitle>
          <CardDescription>Pipeline completion and selection counts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Province</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Male</TableHead>
                <TableHead>Female</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Home Visit</TableHead>
                <TableHead>Selected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((row) => (
                <TableRow key={row.provinceId}>
                  <TableCell>{row.nameEn}</TableCell>
                  <TableCell>{row.totalStudents}</TableCell>
                  <TableCell>{row.maleStudents}</TableCell>
                  <TableCell>{row.femaleStudents}</TableCell>
                  <TableCell>{row.examCompleted}</TableCell>
                  <TableCell>{row.interviewCompleted}</TableCell>
                  <TableCell>{row.homeVisitCompleted}</TableCell>
                  <TableCell>{row.selectedStudents}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
