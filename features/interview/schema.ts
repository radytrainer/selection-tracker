import { z } from "zod";

export const interviewFormSchema = z.object({
  communication_score: z.number().min(1, "Rate every category before saving").max(5),
  leadership_score: z.number().min(1, "Rate every category before saving").max(5),
  motivation_score: z.number().min(1, "Rate every category before saving").max(5),
  confidence_score: z.number().min(1, "Rate every category before saving").max(5),
  critical_thinking_score: z.number().min(1, "Rate every category before saving").max(5),
  comments: z.string().optional().or(z.literal("")),
  recommendation: z.enum(["strongly_recommend", "recommend", "neutral", "not_recommend"]),
});

export type InterviewFormValues = z.infer<typeof interviewFormSchema>;
