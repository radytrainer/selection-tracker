import { z } from "zod";

export const studentFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().min(1, "Date of birth is required"),
  phone: z.string().optional().or(z.literal("")),

  province_id: z.string().uuid().optional().or(z.literal("")),
  district_name: z.string().optional().or(z.literal("")),
  commune_name: z.string().optional().or(z.literal("")),
  village_name: z.string().optional().or(z.literal("")),

  school_id: z.string().uuid().optional().or(z.literal("")),
  referred_by_ngo_id: z.string().uuid().optional().or(z.literal("")),
  grade: z.string().optional().or(z.literal("")),
  // Kept as strings (native input values) rather than z.coerce.number() —
  // mixing coercion into a zodResolver schema makes useForm's input/output
  // generics diverge and breaks typing throughout the form tree. Convert to
  // numbers at the call site (see students/new/page.tsx) instead.
  gpa: z.string().optional().or(z.literal("")),
  english_level: z.enum(["none", "beginner", "intermediate", "advanced"]).optional(),

  father_name: z.string().optional().or(z.literal("")),
  mother_name: z.string().optional().or(z.literal("")),
  parent_occupation: z.string().optional().or(z.literal("")),
  family_income_monthly: z.string().optional().or(z.literal("")),
  siblings_count: z.string().optional().or(z.literal("")),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
