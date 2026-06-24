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
        communicationScore: values.communication_score,
        leadershipScore: values.leadership_score,
        motivationScore: values.motivation_score,
        confidenceScore: values.confidence_score,
        criticalThinkingScore: values.critical_thinking_score,
        comments: values.comments || null,
        recommendation: values.recommendation,
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Interview — {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">{student.student_code}</p>
      </div>
      <InterviewForm
        defaultValues={
          student.interviews
            ? {
                communication_score: student.interviews.communication_score ?? 0,
                leadership_score: student.interviews.leadership_score ?? 0,
                motivation_score: student.interviews.motivation_score ?? 0,
                confidence_score: student.interviews.confidence_score ?? 0,
                critical_thinking_score: student.interviews.critical_thinking_score ?? 0,
                comments: student.interviews.comments ?? "",
                recommendation: student.interviews.recommendation ?? "neutral",
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}
