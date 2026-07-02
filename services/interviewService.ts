import { createClient } from "@/lib/supabase/client";
import { advanceStatus, type StudentStatus } from "@/lib/constants";
import { computeTotal, computeMaxScore, computeGrade, type InterviewFormValues } from "@/features/interview/schema";
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

/** Existing per-question scores for a saved interview, keyed by question_id — used to prefill the form. */
export async function getInterviewAnswers(interviewId: string): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_answers")
    .select("question_id, score")
    .eq("interview_id", interviewId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.question_id, r.score]));
}

export async function saveInterview(input: {
  studentId: string;
  cycleId: string;
  currentStatus: StudentStatus;
  formValues: InterviewFormValues;
  questionIds: string[];
}) {
  const supabase = createClient();
  const { formValues, questionIds } = input;

  const total = computeTotal(formValues.answers);
  const maxScore = computeMaxScore(questionIds.length);
  const recommendation = computeGrade(total, maxScore);

  const { data: interview, error } = await supabase
    .from("interviews")
    .upsert(
      {
        student_id: input.studentId,
        cycle_id: input.cycleId,
        comments: formValues.comments || null,
        recommendation,
      },
      { onConflict: "student_id" },
    )
    .select("id")
    .single();
  if (error) throw error;

  const answerRows = questionIds.map((questionId) => ({
    interview_id: interview.id,
    question_id: questionId,
    score: formValues.answers[questionId],
  }));
  const { error: answersError } = await supabase
    .from("interview_answers")
    .upsert(answerRows, { onConflict: "interview_id,question_id" });
  if (answersError) throw answersError;

  const nextStatus = advanceStatus(input.currentStatus, "interview_completed");
  if (nextStatus !== input.currentStatus) {
    const { error: statusError } = await supabase
      .from("students")
      .update({ status: nextStatus })
      .eq("id", input.studentId);
    if (statusError) throw statusError;
  }
}

export type InterviewCategoryTotal = { label: string; total: number; max: number };
export type InterviewSummary = {
  total: number;
  maxScore: number;
  categoryTotals: InterviewCategoryTotal[];
  recommendation: Interview["recommendation"];
  comments: string | null;
};

/** Aggregated view for the student profile Interview tab — groups a student's answers by category, dynamically (not tied to a fixed 3-category shape). */
export async function getInterviewSummary(studentId: string): Promise<InterviewSummary | null> {
  const supabase = createClient();
  const { data: interview, error } = await supabase
    .from("interviews")
    .select("id, recommendation, comments")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!interview) return null;

  const { data: answers, error: answersError } = await supabase
    .from("interview_answers")
    .select("score, interview_questions(category_id, interview_categories(name, display_order))")
    .eq("interview_id", interview.id);
  if (answersError) throw answersError;

  const rows = (answers ?? []) as unknown as {
    score: number;
    interview_questions: {
      category_id: string;
      interview_categories: { name: string; display_order: number } | null;
    } | null;
  }[];

  const byCategory = new Map<string, { label: string; order: number; total: number; count: number }>();
  for (const row of rows) {
    const question = row.interview_questions;
    const category = question?.interview_categories;
    if (!question || !category) continue;
    const entry = byCategory.get(question.category_id) ?? {
      label: category.name,
      order: category.display_order,
      total: 0,
      count: 0,
    };
    entry.total += row.score;
    entry.count += 1;
    byCategory.set(question.category_id, entry);
  }

  const categoryTotals = Array.from(byCategory.values())
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ label: c.label, total: c.total, max: c.count * 5 }));

  return {
    total: categoryTotals.reduce((sum, c) => sum + c.total, 0),
    maxScore: categoryTotals.reduce((sum, c) => sum + c.max, 0),
    categoryTotals,
    recommendation: interview.recommendation,
    comments: interview.comments,
  };
}
