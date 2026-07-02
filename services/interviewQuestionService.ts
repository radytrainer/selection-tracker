import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type InterviewCategory = Database["public"]["Tables"]["interview_categories"]["Row"];
export type InterviewQuestion = Database["public"]["Tables"]["interview_questions"]["Row"];

export type InterviewCategoryWithQuestions = InterviewCategory & {
  questions: InterviewQuestion[];
};

async function listCategoriesWithQuestions(includeInactive: boolean): Promise<InterviewCategoryWithQuestions[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_categories")
    .select("*, interview_questions(*)")
    .is("deleted_at", null)
    .order("display_order");
  if (error) throw error;

  const rows = (data ?? []) as unknown as (InterviewCategory & {
    interview_questions: InterviewQuestion[];
  })[];

  return rows.map((c) => ({
    ...c,
    questions: c.interview_questions
      .filter((q) => q.deleted_at === null && (includeInactive || q.is_active))
      .sort((a, b) => a.display_order - b.display_order),
  }));
}

/** Active questions only, grouped by category — what the interview form renders. */
export function listInterviewCategories() {
  return listCategoriesWithQuestions(false);
}

/** Includes deactivated questions too — for the admin management page. */
export function listAllInterviewCategoriesForAdmin() {
  return listCategoriesWithQuestions(true);
}

export async function createCategory(name: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from("interview_categories")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  const { data, error } = await supabase
    .from("interview_categories")
    .insert({ name, display_order: (count ?? 0) + 1 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase.from("interview_categories").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("interview_categories")
      .update({ display_order: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) throw error;
  }
}

export async function createQuestion(input: { categoryId: string; textEn: string; textKm?: string }) {
  const supabase = createClient();
  const { count } = await supabase
    .from("interview_questions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", input.categoryId)
    .is("deleted_at", null);
  const { data, error } = await supabase
    .from("interview_questions")
    .insert({
      category_id: input.categoryId,
      text_en: input.textEn,
      text_km: input.textKm || null,
      display_order: (count ?? 0) + 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id: string, input: { textEn: string; textKm?: string }) {
  const supabase = createClient();
  const { error } = await supabase
    .from("interview_questions")
    .update({ text_en: input.textEn, text_km: input.textKm || null })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleQuestionActive(id: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("interview_questions").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function softDeleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("interview_questions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function reorderQuestions(orderedIds: string[]) {
  const supabase = createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("interview_questions")
      .update({ display_order: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) throw error;
  }
}
