import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type CommitteeDecisionInsert = Database["public"]["Tables"]["committee_decisions"]["Insert"];

export type CommitteeQueueItem = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  cycle_id: string;
  provinces: { name_en: string } | null;
  school_partners: { school_name: string } | null;
};

const QUEUE_SELECT =
  "id, student_code, first_name, last_name, gender, cycle_id, provinces(name_en), school_partners(school_name)";

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

export async function recordCommitteeDecision(input: {
  studentId: string;
  cycleId: string;
  decision: NonNullable<CommitteeDecisionInsert["decision"]>;
}) {
  const supabase = createClient();

  const { error: decisionError } = await supabase.from("committee_decisions").insert({
    student_id: input.studentId,
    cycle_id: input.cycleId,
    decision: input.decision,
    decision_date: new Date().toISOString().slice(0, 10),
  });
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
