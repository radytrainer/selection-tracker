"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getStudent, type StudentDetail } from "@/services/studentService";
import { sendToCommittee } from "@/services/committeeService";
import { CATEGORY_LABELS } from "@/features/social-form/scoring";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGate } from "@/components/layout/RoleGate";

const RECOMMENDATION_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly Recommend",
  recommend: "Recommend",
  neutral: "Neutral",
  not_recommend: "Do Not Recommend",
};

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingToCommittee, setSendingToCommittee] = useState(false);

  const load = useCallback(() => {
    return getStudent(params.studentId)
      .then(setStudent)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load student"))
      .finally(() => setLoading(false));
  }, [params.studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendToCommittee() {
    if (!student) return;
    setSendingToCommittee(true);
    try {
      await sendToCommittee(student.id);
      toast.success("Case sent to the committee");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send to committee");
    } finally {
      setSendingToCommittee(false);
    }
  }

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
          <TabsTrigger value="social-form">Social Form</TabsTrigger>
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
            <CardContent className="space-y-2 text-sm">
              <p>Exam: {student.exam_results ? "Completed" : "Pending"}</p>
              <p>Interview: {student.interviews ? "Completed" : "Pending"}</p>
              <p>Home Visit: {student.social_assessments?.length ? "Completed" : "Pending"}</p>
              <p>Committee Decision: {student.committee_decisions?.decision ?? "Pending"}</p>
              {student.status === "home_visit_completed" && (
                <RoleGate capability="createEditStudents">
                  <Button size="sm" disabled={sendingToCommittee} onClick={handleSendToCommittee}>
                    {sendingToCommittee ? "Sending..." : "Send to Committee"}
                  </Button>
                </RoleGate>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam" className="max-w-md space-y-3">
          {student.exam_results ? (
            <div className="space-y-1 text-sm">
              <p>Math: {student.exam_results.math_score}</p>
              <p>English: {student.exam_results.english_score}</p>
              <p>Logic: {student.exam_results.logic_score}</p>
              <p>Computer: {student.exam_results.computer_score}</p>
              <p>Total: {student.exam_results.total_score} / 400</p>
              <p className="capitalize">Result: {student.exam_results.pass_status ?? "—"}</p>
              <p>Rank in cycle: {student.exam_results.rank_in_cycle ?? "—"}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No exam scores entered yet.</p>
          )}
          <RoleGate capability="enterExamScores">
            <Link
              href={`/students/${student.id}/exam`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {student.exam_results ? "Edit Exam Scores" : "Enter Exam Scores"}
            </Link>
          </RoleGate>
        </TabsContent>

        <TabsContent value="interview" className="max-w-md space-y-3">
          {student.interviews ? (
            <div className="space-y-1 text-sm">
              <p>Communication: {student.interviews.communication_score}/5</p>
              <p>Leadership: {student.interviews.leadership_score}/5</p>
              <p>Motivation: {student.interviews.motivation_score}/5</p>
              <p>Confidence: {student.interviews.confidence_score}/5</p>
              <p>Critical Thinking: {student.interviews.critical_thinking_score}/5</p>
              <p>
                Recommendation:{" "}
                {student.interviews.recommendation
                  ? RECOMMENDATION_LABELS[student.interviews.recommendation]
                  : "—"}
              </p>
              {student.interviews.comments && <p>Comments: {student.interviews.comments}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No interview recorded yet.</p>
          )}
          <RoleGate capability="enterInterviewScores">
            <Link
              href={`/students/${student.id}/interview`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {student.interviews ? "Edit Interview" : "Enter Interview"}
            </Link>
          </RoleGate>
        </TabsContent>

        <TabsContent value="social-form" className="max-w-md space-y-4">
          {student.social_assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No social form recorded yet.</p>
          ) : (
            student.social_assessments.map((assessment) => (
              <div key={assessment.id} className="space-y-1 border-b pb-3 text-sm last:border-0">
                <p className="font-medium">Visit #{assessment.visit_number}</p>
                <p>Final Score: {assessment.final_score}</p>
                <p>Category: {CATEGORY_LABELS[assessment.category]}</p>
                <p>Housing: {assessment.housing_type_band?.replace(/_/g, " ") ?? "—"}</p>
                <p>Monthly Income Band: {assessment.income_band?.replace(/_/g, "-") ?? "—"}</p>
                <p>Poverty Certificate: {assessment.poverty_certificate || "—"}</p>
                {assessment.visitor_comments && <p>Comments: {assessment.visitor_comments}</p>}
              </div>
            ))
          )}
          <RoleGate capability="enterHomeVisitData">
            <Link
              href={`/students/${student.id}/social-form`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {student.social_assessments.length === 0 ? "Enter Social Form" : "Edit Social Form"}
            </Link>
          </RoleGate>
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
