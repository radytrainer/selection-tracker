import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type CommitteeDecisionInsert = Database["public"]["Tables"]["committee_decisions"]["Insert"];
type CommitteeRatingRow = Database["public"]["Tables"]["committee_ratings"]["Row"];
export type SocialAssessmentRow = Database["public"]["Tables"]["social_assessments"]["Row"];

export type CommitteeQueueItem = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  cycle_id: string;
  gpa: number | null;
  family_income_monthly: number | null;
  provinces: { name_en: string } | null;
  school_partners: { school_name: string } | null;
  // exam_results/interviews have a unique constraint on student_id, so
  // PostgREST embeds them as a single to-one object (or null).
  exam_results: { total_score: number; rank_in_cycle: number | null; pass_status: string | null } | null;
  interviews: { recommendation: string | null } | null;
  social_assessments: { final_score: number; category: string; visitor_comments: string | null }[];
  student_documents: { doc_type: string; file_path: string; uploaded_at: string }[];
  committee_ratings: CommitteeRatingRow[];
};

const QUEUE_SELECT = `
  id, student_code, first_name, last_name, gender, cycle_id, gpa, family_income_monthly,
  provinces(name_en), school_partners(school_name),
  exam_results(total_score, rank_in_cycle, pass_status),
  interviews(recommendation),
  social_assessments(final_score, category, visitor_comments),
  student_documents(doc_type, file_path, uploaded_at),
  committee_ratings(*)
`;

/** Students who've finished the pipeline but have no committee decision yet. */
export async function listCommitteeQueue(cycleId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("students")
    .select(QUEUE_SELECT)
    .eq("status", "committee_review")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (cycleId) query = query.eq("cycle_id", cycleId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as CommitteeQueueItem[];
}

/**
 * Upsert (not insert) so a decision can be freely changed later — student_id
 * is unique on committee_decisions, so re-recording just overwrites it.
 * approval_status resets to "pending" on every call: an approved decision
 * that gets changed must go through approval again rather than silently
 * keeping its old sign-off.
 */
export async function recordCommitteeDecision(input: {
  studentId: string;
  cycleId: string;
  decision: NonNullable<CommitteeDecisionInsert["decision"]>;
  poorLevel?: CommitteeDecisionInsert["poor_level"];
}) {
  const supabase = createClient();

  const { error: decisionError } = await supabase.from("committee_decisions").upsert(
    {
      student_id: input.studentId,
      cycle_id: input.cycleId,
      decision: input.decision,
      decision_date: new Date().toISOString().slice(0, 10),
      poor_level: input.poorLevel ?? null,
      approval_status: "pending",
      approved_by: null,
    },
    { onConflict: "student_id" },
  );
  if (decisionError) throw decisionError;

  const { error: statusError } = await supabase
    .from("students")
    .update({ status: input.decision })
    .eq("id", input.studentId);
  if (statusError) throw statusError;
}

export type PendingApproval = {
  id: string;
  decision: string | null;
  decision_date: string | null;
  students: {
    id: string;
    student_code: string;
    first_name: string;
    last_name: string;
  } | null;
};

/** Decisions a committee member recorded that still need Program Manager / Super Admin sign-off. */
export async function listPendingApprovals(cycleId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("committee_decisions")
    .select("id, decision, decision_date, students(id, student_code, first_name, last_name)")
    .eq("approval_status", "pending")
    .order("decision_date", { ascending: true });
  if (cycleId) query = query.eq("cycle_id", cycleId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PendingApproval[];
}

export async function approveCommitteeDecision(decisionId: string, approve: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("committee_decisions")
    .update({ approval_status: approve ? "approved" : "rejected" })
    .eq("id", decisionId);
  if (error) throw error;
}

export type CommitteeDossier = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string | null;
  status: string;
  cycle_id: string;
  gpa: number | null;
  grade: string | null;
  district_name: string | null;
  commune_name: string | null;
  village_name: string | null;
  family_income_monthly: number | null;
  provinces: { name_en: string } | null;
  school_partners: { school_name: string } | null;
  ngo_partners: { organization_name: string } | null;
  exam_results: {
    math_score: number;
    english_score: number;
    logic_score: number;
    computer_score: number;
    total_score: number;
    rank_in_cycle: number | null;
    rank_in_province: number | null;
    pass_status: string | null;
  } | null;
  interviews: {
    communication_score: number | null;
    leadership_score: number | null;
    motivation_score: number | null;
    confidence_score: number | null;
    critical_thinking_score: number | null;
    comments: string | null;
    recommendation: string | null;
  } | null;
  social_assessments: SocialAssessmentRow[];
  student_documents: { doc_type: string; file_path: string; uploaded_at: string }[];
  committee_decisions: {
    decision: string | null;
    decision_date: string | null;
    poor_level: string | null;
    approval_status: string;
  } | null;
  committee_ratings: CommitteeRatingRow[];
};

const DOSSIER_SELECT = `
  id, student_code, first_name, last_name, gender, dob, status, cycle_id, gpa, grade,
  district_name, commune_name, village_name, family_income_monthly,
  provinces(name_en), school_partners(school_name), ngo_partners(organization_name),
  exam_results(math_score, english_score, logic_score, computer_score, total_score, rank_in_cycle, rank_in_province, pass_status),
  interviews(communication_score, leadership_score, motivation_score, confidence_score, critical_thinking_score, comments, recommendation),
  social_assessments(*),
  student_documents(doc_type, file_path, uploaded_at),
  committee_decisions(decision, decision_date, poor_level, approval_status),
  committee_ratings(*)
`;

/** Single-student consolidated view backing the Committee Dossier page. */
export async function getCommitteeDossier(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(DOSSIER_SELECT)
    .eq("id", studentId)
    .single();
  if (error) throw error;
  return data as unknown as CommitteeDossier;
}

/** Manual hand-off after the home visit is done — the case is "presented" to the committee. */
export async function sendToCommittee(studentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("students").update({ status: "committee_review" }).eq("id", studentId);
  if (error) throw error;
}

/**
 * rated_by is filled server-side from the caller's own user row (see
 * migration 0009), so it's never sent here. One overall 1-5 rating per
 * voter per student (see migration 0018) — criterion is always "overall".
 */
export async function upsertCommitteeRating(input: {
  studentId: string;
  cycleId: string;
  score: number;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("committee_ratings").upsert(
    {
      student_id: input.studentId,
      cycle_id: input.cycleId,
      criterion: "overall",
      score: input.score,
    },
    { onConflict: "student_id,rated_by,criterion" },
  );
  if (error) throw error;
}
