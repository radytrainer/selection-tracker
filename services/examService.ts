import { createClient } from "@/lib/supabase/client";
import { advanceStatus, type StudentStatus } from "@/lib/constants";
import type { Database } from "@/types/database.types";

export type ExamResult = Database["public"]["Tables"]["exam_results"]["Row"];

export async function getExamResult(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exam_results")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveExamResult(input: {
  studentId: string;
  cycleId: string;
  currentStatus: StudentStatus;
  mathScore: number;
  englishScore: number;
  logicScore: number;
  computerScore: number;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("exam_results").upsert(
    {
      student_id: input.studentId,
      cycle_id: input.cycleId,
      math_score: input.mathScore,
      english_score: input.englishScore,
      logic_score: input.logicScore,
      computer_score: input.computerScore,
    },
    { onConflict: "student_id" },
  );
  if (error) throw error;

  const nextStatus = advanceStatus(input.currentStatus, "exam_completed");
  if (nextStatus !== input.currentStatus) {
    const { error: statusError } = await supabase
      .from("students")
      .update({ status: nextStatus })
      .eq("id", input.studentId);
    if (statusError) throw statusError;
  }
}
