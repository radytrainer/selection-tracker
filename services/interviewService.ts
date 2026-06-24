import { createClient } from "@/lib/supabase/client";
import { advanceStatus, type StudentStatus } from "@/lib/constants";
import type { Database } from "@/types/database.types";

export type Interview = Database["public"]["Tables"]["interviews"]["Row"];
type Recommendation = NonNullable<Interview["recommendation"]>;

export async function getInterview(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveInterview(input: {
  studentId: string;
  cycleId: string;
  currentStatus: StudentStatus;
  communicationScore: number;
  leadershipScore: number;
  motivationScore: number;
  confidenceScore: number;
  criticalThinkingScore: number;
  comments: string | null;
  recommendation: Recommendation;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("interviews").upsert(
    {
      student_id: input.studentId,
      cycle_id: input.cycleId,
      communication_score: input.communicationScore,
      leadership_score: input.leadershipScore,
      motivation_score: input.motivationScore,
      confidence_score: input.confidenceScore,
      critical_thinking_score: input.criticalThinkingScore,
      comments: input.comments,
      recommendation: input.recommendation,
    },
    { onConflict: "student_id" },
  );
  if (error) throw error;

  const nextStatus = advanceStatus(input.currentStatus, "interview_completed");
  if (nextStatus !== input.currentStatus) {
    const { error: statusError } = await supabase
      .from("students")
      .update({ status: nextStatus })
      .eq("id", input.studentId);
    if (statusError) throw statusError;
  }
}
