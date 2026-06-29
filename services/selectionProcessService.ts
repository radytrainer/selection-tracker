import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type InformationSessionStats = Database["public"]["Tables"]["information_session_stats"]["Row"];
export type ExamCenterStats = Database["public"]["Tables"]["exam_center_stats"]["Row"];
export type ExamResultStats = Database["public"]["Tables"]["exam_result_stats"]["Row"];
export type InterviewCenterStats = Database["public"]["Tables"]["interview_center_stats"]["Row"];
export type InterviewResultStats = Database["public"]["Tables"]["interview_result_stats"]["Row"];

export type SelectionProcessStats = {
  informationSessions: InformationSessionStats | null;
  examCenters: ExamCenterStats | null;
  examResults: ExamResultStats | null;
  interviewCenters: InterviewCenterStats | null;
  interviewResults: InterviewResultStats | null;
};

/** One manually-maintained row per section per cycle (0027) — missing means never edited yet, treat as all-zero. */
export async function getSelectionProcessStats(cycleId: string): Promise<SelectionProcessStats> {
  const supabase = createClient();
  const [informationSessions, examCenters, examResults, interviewCenters, interviewResults] = await Promise.all([
    supabase.from("information_session_stats").select("*").eq("cycle_id", cycleId).maybeSingle(),
    supabase.from("exam_center_stats").select("*").eq("cycle_id", cycleId).maybeSingle(),
    supabase.from("exam_result_stats").select("*").eq("cycle_id", cycleId).maybeSingle(),
    supabase.from("interview_center_stats").select("*").eq("cycle_id", cycleId).maybeSingle(),
    supabase.from("interview_result_stats").select("*").eq("cycle_id", cycleId).maybeSingle(),
  ]);

  for (const res of [informationSessions, examCenters, examResults, interviewCenters, interviewResults]) {
    if (res.error) throw res.error;
  }

  return {
    informationSessions: informationSessions.data,
    examCenters: examCenters.data,
    examResults: examResults.data,
    interviewCenters: interviewCenters.data,
    interviewResults: interviewResults.data,
  };
}

export async function saveInformationSessionStats(
  cycleId: string,
  values: Omit<Database["public"]["Tables"]["information_session_stats"]["Insert"], "cycle_id">,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("information_session_stats")
    .upsert({ cycle_id: cycleId, ...values }, { onConflict: "cycle_id" });
  if (error) throw error;
}

export async function saveExamCenterStats(
  cycleId: string,
  values: Omit<Database["public"]["Tables"]["exam_center_stats"]["Insert"], "cycle_id">,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("exam_center_stats")
    .upsert({ cycle_id: cycleId, ...values }, { onConflict: "cycle_id" });
  if (error) throw error;
}

export async function saveExamResultStats(
  cycleId: string,
  values: Omit<Database["public"]["Tables"]["exam_result_stats"]["Insert"], "cycle_id">,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("exam_result_stats")
    .upsert({ cycle_id: cycleId, ...values }, { onConflict: "cycle_id" });
  if (error) throw error;
}

export async function saveInterviewCenterStats(
  cycleId: string,
  values: Omit<Database["public"]["Tables"]["interview_center_stats"]["Insert"], "cycle_id">,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("interview_center_stats")
    .upsert({ cycle_id: cycleId, ...values }, { onConflict: "cycle_id" });
  if (error) throw error;
}

export async function saveInterviewResultStats(
  cycleId: string,
  values: Omit<Database["public"]["Tables"]["interview_result_stats"]["Insert"], "cycle_id">,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("interview_result_stats")
    .upsert({ cycle_id: cycleId, ...values }, { onConflict: "cycle_id" });
  if (error) throw error;
}
