import { createClient } from "@/lib/supabase/client";
import { advanceStatus, type StudentStatus } from "@/lib/constants";
import type { Database } from "@/types/database.types";

export type HomeVisit = Database["public"]["Tables"]["home_visits"]["Row"];
type Recommendation = NonNullable<HomeVisit["recommendation"]>;

export async function listHomeVisits(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("home_visits")
    .select("*")
    .eq("student_id", studentId)
    .order("visit_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** No unique constraint on student_id alone — multiple re-visits are allowed, so this always inserts the next visit_number rather than upserting. */
export async function createHomeVisit(input: {
  studentId: string;
  cycleId: string;
  currentStatus: StudentStatus;
  houseType: string | null;
  familyIncome: number | null;
  transportation: string | null;
  electricityAccess: boolean;
  internetAccess: boolean;
  familyConditionNotes: string | null;
  recommendation: Recommendation;
}) {
  const supabase = createClient();
  const { count, error: countError } = await supabase
    .from("home_visits")
    .select("id", { count: "exact", head: true })
    .eq("student_id", input.studentId);
  if (countError) throw countError;

  const { error } = await supabase.from("home_visits").insert({
    student_id: input.studentId,
    cycle_id: input.cycleId,
    visit_number: (count ?? 0) + 1,
    house_type: input.houseType,
    family_income: input.familyIncome,
    transportation: input.transportation,
    electricity_access: input.electricityAccess,
    internet_access: input.internetAccess,
    family_condition_notes: input.familyConditionNotes,
    recommendation: input.recommendation,
  });
  if (error) throw error;

  const nextStatus = advanceStatus(input.currentStatus, "home_visit_completed");
  if (nextStatus !== input.currentStatus) {
    const { error: statusError } = await supabase
      .from("students")
      .update({ status: nextStatus })
      .eq("id", input.studentId);
    if (statusError) throw statusError;
  }
}
