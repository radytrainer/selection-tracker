import { createClient } from "@/lib/supabase/client";
import { advanceStatus, type StudentStatus } from "@/lib/constants";
import { computeSocialFormScore, type SocialFormScoreInput } from "@/features/social-form/scoring";
import type { Database } from "@/types/database.types";

export type SocialAssessment = Database["public"]["Tables"]["social_assessments"]["Row"];

/** Most recently recorded visit for this student, or null if none yet. */
export async function getLatestSocialAssessment(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_assessments")
    .select("*")
    .eq("student_id", studentId)
    .order("visit_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

type SaveInput = SocialFormScoreInput & {
  /** Updates this row if set; otherwise inserts a new visit. */
  id?: string;
  studentId: string;
  cycleId: string;
  visitNumber: number;
  currentStatus: StudentStatus;
  ok_to_join_training: string | null;
  household_size_note: string | null;
  dependents_note: string | null;
  father_age: number | null;
  father_job: string | null;
  mother_age: number | null;
  mother_job: string | null;
  house_owner: string | null;
  income_note: string | null;
  expenses_note: string | null;
  education_support_note: string | null;
  school_aged_children_studying: number | null;
  school_aged_children_working: number | null;
  debt_amount: string | null;
  poverty_certificate: string | null;
  distance_from_town: string | null;
  visitor_name: string | null;
  visitor_comments: string | null;
};

export async function saveSocialAssessment(input: SaveInput) {
  const supabase = createClient();
  const score = computeSocialFormScore(input);

  const row = {
    student_id: input.studentId,
    cycle_id: input.cycleId,
    visit_number: input.visitNumber,
    health_status: input.health_status,
    ok_to_join_training: input.ok_to_join_training,
    academic_rank: input.academic_rank,
    household_size_band: input.household_size_band,
    household_size_note: input.household_size_note,
    dependents_band: input.dependents_band,
    dependents_note: input.dependents_note,
    father_age: input.father_age,
    father_job: input.father_job,
    mother_age: input.mother_age,
    mother_job: input.mother_job,
    parent_occupation_band: input.parent_occupation_band,
    house_owner: input.house_owner,
    housing_type_band: input.housing_type_band,
    house_status_band: input.house_status_band,
    water_access_band: input.water_access_band,
    electricity_access_band: input.electricity_access_band,
    assets_furniture: input.assets_furniture,
    assets_transport: input.assets_transport,
    assets_electronics: input.assets_electronics,
    assets_livestock: input.assets_livestock,
    income_band: input.income_band,
    income_note: input.income_note,
    expenses_band: input.expenses_band,
    expenses_note: input.expenses_note,
    education_support_band: input.education_support_band,
    education_support_note: input.education_support_note,
    father_education_band: input.father_education_band,
    mother_education_band: input.mother_education_band,
    school_aged_children_studying: input.school_aged_children_studying,
    school_aged_children_working: input.school_aged_children_working,
    school_attendance_band: input.school_attendance_band,
    debt_band: input.debt_band,
    debt_amount: input.debt_amount,
    farm_land_band: input.farm_land_band,
    farm_income_band: input.farm_income_band,
    plantation_land_band: input.plantation_land_band,
    plantation_income_band: input.plantation_income_band,
    vulnerability_orphan_single_parent: input.vulnerability_orphan_single_parent,
    vulnerability_disability: input.vulnerability_disability,
    vulnerability_chronic_illness: input.vulnerability_chronic_illness,
    vulnerability_debt_burden: input.vulnerability_debt_burden,
    vulnerability_landless: input.vulnerability_landless,
    husbandry_band: input.husbandry_band,
    total_score: score.totalScore,
    vulnerability_deduction: score.vulnerabilityDeduction,
    final_score: score.finalScore,
    category: score.category,
    poverty_certificate: input.poverty_certificate,
    distance_from_town: input.distance_from_town,
    visitor_name: input.visitor_name,
    visitor_comments: input.visitor_comments,
  };

  const { error } = input.id
    ? await supabase.from("social_assessments").update(row).eq("id", input.id)
    : await supabase.from("social_assessments").insert(row);
  if (error) throw error;

  const nextStatus = advanceStatus(input.currentStatus, "home_visit_completed");
  if (nextStatus !== input.currentStatus) {
    const { error: statusError } = await supabase
      .from("students")
      .update({ status: nextStatus })
      .eq("id", input.studentId);
    if (statusError) throw statusError;
  }

  return score;
}
