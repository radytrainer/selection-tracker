"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getStudent, type StudentDetail } from "@/services/studentService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudent(params.studentId)
      .then(setStudent)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load student"))
      .finally(() => setLoading(false));
  }, [params.studentId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!student) {
    return <p className="text-sm text-muted-foreground">Student not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">{student.student_code}</p>
        </div>
        <Badge>{student.status.replace(/_/g, " ")}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exam">Exam</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="home-visit">Home Visit</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal</CardTitle>
              <CardDescription>Demographics and contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Gender: <span className="capitalize">{student.gender}</span></p>
              <p>Date of Birth: {student.dob}</p>
              <p>Phone: {student.phone ?? "—"}</p>
              <p>
                Location:{" "}
                {[
                  student.village_name,
                  student.commune_name,
                  student.district_name,
                  student.provinces?.name_en,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic</CardTitle>
              <CardDescription>School and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>School: {student.school_partners?.school_name ?? "—"}</p>
              <p>Grade: {student.grade ?? "—"}</p>
              <p>GPA: {student.gpa ?? "—"}</p>
              <p>English Level: {student.english_level ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
              <CardDescription>Household context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Father: {student.father_name ?? "—"}</p>
              <p>Mother: {student.mother_name ?? "—"}</p>
              <p>Occupation: {student.parent_occupation ?? "—"}</p>
              <p>Monthly Income: {student.family_income_monthly ?? "—"}</p>
              <p>Siblings: {student.siblings_count ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
              <CardDescription>Stage completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Exam: {student.exam_results ? "Completed" : "Pending"}</p>
              <p>Interview: {student.interviews ? "Completed" : "Pending"}</p>
              <p>Home Visit: {student.home_visits?.length ? "Completed" : "Pending"}</p>
              <p>Committee Decision: {student.committee_decisions?.decision ?? "Pending"}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam">
          <p className="text-sm text-muted-foreground">
            Exam score entry form — see docs/07-ui-pages.md §4.2 (next implementation pass).
          </p>
        </TabsContent>
        <TabsContent value="interview">
          <p className="text-sm text-muted-foreground">
            Interview scoring form — see docs/07-ui-pages.md §4.3 (next implementation pass).
          </p>
        </TabsContent>
        <TabsContent value="home-visit">
          <p className="text-sm text-muted-foreground">
            Home visit form — see docs/07-ui-pages.md §4.4 (next implementation pass).
          </p>
        </TabsContent>
        <TabsContent value="documents">
          <p className="text-sm text-muted-foreground">
            Document upload/preview — see docs/07-ui-pages.md §4.1 (next implementation pass).
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
