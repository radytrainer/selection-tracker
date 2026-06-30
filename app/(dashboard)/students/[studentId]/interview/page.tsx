"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getStudent, type StudentDetail } from "@/services/studentService";
import { saveInterview } from "@/services/interviewService";
import { InterviewForm } from "@/components/forms/InterviewForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { InterviewFormValues } from "@/features/interview/schema";

export default function InterviewEntryPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudent(params.studentId)
      .then(setStudent)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load student"))
      .finally(() => setLoading(false));
  }, [params.studentId]);

  async function handleSubmit(values: InterviewFormValues) {
    if (!student) return;
    try {
      await saveInterview({
        studentId: student.id,
        cycleId: student.cycle_id,
        currentStatus: student.status,
        formValues: values,
      });
      toast.success("Interview saved");
      router.push(`/students/${student.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save interview");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return <p className="text-sm text-muted-foreground">Student not found.</p>;
  }

  const iv = student.interviews;
  const defaultValues: Partial<InterviewFormValues> | undefined = iv
    ? {
        q1_score: iv.q1_score ?? 0,
        q2_score: iv.q2_score ?? 0,
        q3_score: iv.q3_score ?? 0,
        q4_score: iv.q4_score ?? 0,
        q5_score: iv.q5_score ?? 0,
        q6_score: iv.q6_score ?? 0,
        q7_score: iv.q7_score ?? 0,
        q8_score: iv.q8_score ?? 0,
        q9_score: iv.q9_score ?? 0,
        q10_score: iv.q10_score ?? 0,
        q11_score: iv.q11_score ?? 0,
        q12_score: iv.q12_score ?? 0,
        q13_score: iv.q13_score ?? 0,
        q14_score: iv.q14_score ?? 0,
        q15_score: iv.q15_score ?? 0,
        q16_score: iv.q16_score ?? 0,
        comments: iv.comments ?? "",
      }
    : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Self-Assessment — {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">{student.student_code}</p>
      </div>
      <InterviewForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    </div>
  );
}
