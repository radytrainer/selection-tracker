import { createClient } from "@/lib/supabase/client";
import { advanceStatus, type StudentStatus } from "@/lib/constants";
import { computeTotal, computeGrade, type InterviewFormValues, type ScoreKey } from "@/features/interview/schema";
import type { Database } from "@/types/database.types";

export type Interview = Database["public"]["Tables"]["interviews"]["Row"];

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

const SCORE_KEYS: ScoreKey[] = [
  "q1_score", "q2_score", "q3_score", "q4_score",
  "q5_score", "q6_score", "q7_score", "q8_score",
  "q9_score", "q10_score", "q11_score", "q12_score",
  "q13_score", "q14_score", "q15_score", "q16_score",
];

export async function saveInterview(input: {
  studentId: string;
  cycleId: string;
  currentStatus: StudentStatus;
  formValues: InterviewFormValues;
}) {
  const supabase = createClient();
  const { formValues } = input;

  const scoreEntries = Object.fromEntries(
    SCORE_KEYS.map((k) => [k, formValues[k]])
  ) as Omit<InterviewFormValues, "comments">;

  const total = computeTotal(scoreEntries);
  const recommendation = computeGrade(total);

  const { error } = await supabase.from("interviews").upsert(
    {
      student_id: input.studentId,
      cycle_id: input.cycleId,
      ...scoreEntries,
      comments: formValues.comments || null,
      recommendation,
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
