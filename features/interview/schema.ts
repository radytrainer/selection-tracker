import { z } from "zod";

const scoreField = z.number().min(1, "Rate every question before saving").max(5);

export const interviewFormSchema = z.object({
  q1_score: scoreField,
  q2_score: scoreField,
  q3_score: scoreField,
  q4_score: scoreField,
  q5_score: scoreField,
  q6_score: scoreField,
  q7_score: scoreField,
  q8_score: scoreField,
  q9_score: scoreField,
  q10_score: scoreField,
  q11_score: scoreField,
  q12_score: scoreField,
  q13_score: scoreField,
  q14_score: scoreField,
  q15_score: scoreField,
  q16_score: scoreField,
  comments: z.string().optional().or(z.literal("")),
});

export type InterviewFormValues = z.infer<typeof interviewFormSchema>;

export type ScoreKey = keyof Omit<InterviewFormValues, "comments">;

export function computeTotal(values: Omit<InterviewFormValues, "comments">): number {
  return (Object.values(values) as number[]).reduce((sum, v) => sum + (v || 0), 0);
}

export function computeGrade(total: number): "A1" | "A2" | "not_recommended" {
  if (total >= 48) return "A1";
  if (total >= 40) return "A2";
  return "not_recommended";
}
