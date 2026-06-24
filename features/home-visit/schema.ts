import { z } from "zod";

export const homeVisitFormSchema = z.object({
  house_type: z.string().optional().or(z.literal("")),
  family_income: z.string().optional().or(z.literal("")),
  transportation: z.string().optional().or(z.literal("")),
  electricity_access: z.boolean(),
  internet_access: z.boolean(),
  family_condition_notes: z.string().optional().or(z.literal("")),
  recommendation: z.enum(["strongly_recommend", "recommend", "neutral", "not_recommend"]),
});

export type HomeVisitFormValues = z.infer<typeof homeVisitFormSchema>;
