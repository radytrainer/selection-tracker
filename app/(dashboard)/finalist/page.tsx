"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Award, Building2, Clock, Download, Users } from "lucide-react";
import { listFinalists, type StudentListItem } from "@/services/studentService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { POOR_LEVELS, POOR_LEVEL_BADGE_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const POOR_LEVEL_BAR_CLASSES: Record<string, string> = {
  "A+": "bg-green-500",
  A: "bg-green-400",
  "A-": "bg-green-300",
  "B+": "bg-orange-500",
  B: "bg-orange-400",
  "B-": "bg-orange-300",
};

const EXPORT_HEADER = ["Code", "Name", "Gender", "Province", "School", "NGO", "Poor Level"];
const EXPORT_COLUMN_WIDTHS = [{ wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 18 }, { wch: 24 }, { wch: 24 }, { wch: 12 }];

function buildExportSheet(data: StudentListItem[]) {
  const rows = data.map((student) => [
    student.student_code,
    `${student.first_name} ${student.last_name}`,
    student.gender,
    student.provinces?.name_en ?? "",
    student.school_partners?.school_name ?? "",
    student.ngo_partners?.organization_name ?? "",
    student.committee_decisions?.poor_level ?? "",
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADER, ...rows]);
  sheet["!cols"] = EXPORT_COLUMN_WIDTHS;
  return sheet;
}

function exportFinalistsToExcel(selected: StudentListItem[], waitlisted: StudentListItem[]) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildExportSheet(selected), "Main List");
  XLSX.utils.book_append_sheet(workbook, buildExportSheet(waitlisted), "Waiting List");
  XLSX.writeFile(workbook, `finalists-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function emptyGenderCounts() {
  return { male: 0, female: 0, other: 0 };
}

function summarize(data: StudentListItem[]) {
  const gender = emptyGenderCounts();
  const genderByNgo = { ngo: emptyGenderCounts(), none: emptyGenderCounts() };
  let withNgo = 0;
  let withoutNgo = 0;
  const poorLevels = Object.fromEntries(POOR_LEVELS.map((level) => [level, 0])) as Record<
    (typeof POOR_LEVELS)[number],
    number
  >;

  for (const student of data) {
    gender[student.gender] += 1;
    if (student.ngo_partners) {
      withNgo += 1;
      genderByNgo.ngo[student.gender] += 1;
    } else {
      withoutNgo += 1;
      genderByNgo.none[student.gender] += 1;
    }
    const level = student.committee_decisions?.poor_level;
    if (level && level in poorLevels) poorLevels[level as (typeof POOR_LEVELS)[number]] += 1;
  }

  return { gender, genderByNgo, withNgo, withoutNgo, poorLevels };
}

function SplitBar({
  leftLabel,
  leftValue,
  leftClass,
  rightLabel,
  rightValue,
  rightClass,
}: {
  leftLabel: string;
  leftValue: number;
  leftClass: string;
  rightLabel: string;
  rightValue: number;
  rightClass: string;
}) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? Math.round((leftValue / total) * 100) : 50;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>
          {leftLabel} <span className="font-semibold">{leftValue}</span>
        </span>
        <span>
          {rightLabel} <span className="font-semibold">{rightValue}</span>
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {total > 0 ? (
          <>
            <div className={cn("h-full", leftClass)} style={{ width: `${leftPct}%` }} />
            <div className={cn("h-full", rightClass)} style={{ width: `${100 - leftPct}%` }} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function FinalistSummary({ data }: { data: StudentListItem[] }) {
  const summary = useMemo(() => summarize(data), [data]);
  const maxPoorLevel = Math.max(1, ...POOR_LEVELS.map((level) => summary.poorLevels[level]));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card size="sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <CardDescription>Gender</CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">{data.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SplitBar
            leftLabel="Male"
            leftValue={summary.gender.male}
            leftClass="bg-blue-500"
            rightLabel="Female"
            rightValue={summary.gender.female}
            rightClass="bg-rose-400"
          />
          {summary.gender.other > 0 && (
            <p className="text-xs text-muted-foreground">+{summary.gender.other} other</p>
          )}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
            <span></span>
            <span className="text-right font-medium text-muted-foreground">Male</span>
            <span className="text-right font-medium text-muted-foreground">Female</span>
            <span className="text-muted-foreground">NGO</span>
            <span className="text-right font-semibold">{summary.genderByNgo.ngo.male}</span>
            <span className="text-right font-semibold">{summary.genderByNgo.ngo.female}</span>
            <span className="text-muted-foreground">None NGO</span>
            <span className="text-right font-semibold">{summary.genderByNgo.none.male}</span>
            <span className="text-right font-semibold">{summary.genderByNgo.none.female}</span>
          </div>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4 text-muted-foreground" />
              <CardDescription>NGO</CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">{data.length} total</span>
          </div>
        </CardHeader>
        <CardContent>
          <SplitBar
            leftLabel="NGO"
            leftValue={summary.withNgo}
            leftClass="bg-indigo-500"
            rightLabel="None"
            rightValue={summary.withoutNgo}
            rightClass="bg-slate-300"
          />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="size-4 text-muted-foreground" />
              <CardDescription>Poor Levels</CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">{data.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {POOR_LEVELS.map((level) => {
            const value = summary.poorLevels[level];
            return (
              <div key={level} className="flex items-center gap-2 text-xs">
                <span className="w-6 shrink-0 font-medium text-muted-foreground">{level}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  {value > 0 && (
                    <div
                      className={cn("h-full rounded-full", POOR_LEVEL_BAR_CLASSES[level])}
                      style={{ width: `${(value / maxPoorLevel) * 100}%` }}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "w-4 shrink-0 text-right font-semibold",
                    value === 0 && "text-muted-foreground/50",
                  )}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function FinalistTable({ data, emptyLabel }: { data: StudentListItem[]; emptyLabel: string }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Province</TableHead>
            <TableHead>School</TableHead>
            <TableHead>NGO</TableHead>
            <TableHead>Poor Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Link href={`/students/${student.id}`} className="font-medium hover:underline">
                    {student.student_code}
                  </Link>
                </TableCell>
                <TableCell>
                  {student.first_name} {student.last_name}
                </TableCell>
                <TableCell className="capitalize">{student.gender}</TableCell>
                <TableCell>{student.provinces?.name_en ?? "—"}</TableCell>
                <TableCell>{student.school_partners?.school_name ?? "—"}</TableCell>
                <TableCell>{student.ngo_partners?.organization_name ?? "—"}</TableCell>
                <TableCell>
                  {student.committee_decisions?.poor_level ? (
                    <Badge className={cn(POOR_LEVEL_BADGE_CLASSES[student.committee_decisions.poor_level])}>
                      {student.committee_decisions.poor_level}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function FinalistPage() {
  const [selected, setSelected] = useState<StudentListItem[]>([]);
  const [waitlisted, setWaitlisted] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [selectedList, waitlistedList] = await Promise.all([
        listFinalists("selected"),
        listFinalists("waitlisted"),
      ]);
      setSelected(selectedList);
      setWaitlisted(waitlistedList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load finalists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finalists</h1>
          <p className="text-sm text-muted-foreground">
            Students the committee has decided on, grouped by outcome.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => exportFinalistsToExcel(selected, waitlisted)}
        >
          <Download className="size-4" />
          Export to Excel
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading finalists...</p>
      ) : (
        <Tabs defaultValue="final">
          <TabsList>
            <TabsTrigger value="final" className="gap-1.5">
              <Award className="size-4" />
              Main List ({selected.length})
            </TabsTrigger>
            <TabsTrigger value="waiting" className="gap-1.5">
              <Clock className="size-4" />
              Waiting List ({waitlisted.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="final" className="mt-4 space-y-4">
            <FinalistSummary data={selected} />
            <FinalistTable data={selected} emptyLabel="No students selected yet." />
          </TabsContent>
          <TabsContent value="waiting" className="mt-4 space-y-4">
            <FinalistSummary data={waitlisted} />
            <FinalistTable data={waitlisted} emptyLabel="No students on the waiting list." />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
