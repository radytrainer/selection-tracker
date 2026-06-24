import { z } from "zod";

// Band/select fields are left optional rather than required — this form is
// filled in the field where connectivity/time is limited, and partial saves
// should still be possible. Unanswered bands simply score 0 (see scoring.ts).
export const socialFormSchema = z.object({
  health_status: z.enum(["healthy", "simple_disease", "chronic_disease"]).optional(),
  ok_to_join_training: z.string().optional().or(z.literal("")),
  academic_rank: z.enum(["outstanding_ab", "good_cd", "average_e"]).optional(),

  household_size_band: z.enum(["1_3", "4_6", "7_plus"]).optional(),
  household_size_note: z.string().optional().or(z.literal("")),
  dependents_band: z.enum(["none", "1_2", "3_plus"]).optional(),
  dependents_note: z.string().optional().or(z.literal("")),
  father_age: z.string().optional().or(z.literal("")),
  father_job: z.string().optional().or(z.literal("")),
  mother_age: z.string().optional().or(z.literal("")),
  mother_job: z.string().optional().or(z.literal("")),
  parent_occupation_band: z
    .enum(["unemployed", "daily_laborer", "farmer", "small_business", "stable_salaried"])
    .optional(),

  house_owner: z.string().optional().or(z.literal("")),
  housing_type_band: z.enum(["makeshift", "wooden_zinc", "brick_concrete", "permanent"]).optional(),
  house_status_band: z.enum(["rented", "family_fragile", "family_fair", "family_strong"]).optional(),
  water_access_band: z.enum(["river_pond", "communal_well", "own_well", "piped"]).optional(),
  electricity_access_band: z.enum(["none", "shared_solar", "regular"]).optional(),

  assets_furniture: z.number().min(0).max(3),
  assets_transport: z.number().min(0).max(3),
  assets_electronics: z.number().min(0).max(3),
  assets_livestock: z.number().min(0).max(3),

  income_band: z.enum(["lt_100", "101_200", "201_400", "gt_400"]).optional(),
  income_note: z.string().optional().or(z.literal("")),
  expenses_band: z.enum(["lt_100", "101_200", "201_400", "gt_400"]).optional(),
  expenses_note: z.string().optional().or(z.literal("")),

  education_support_band: z.enum(["no", "maybe", "yes"]).optional(),
  education_support_note: z.string().optional().or(z.literal("")),

  father_education_band: z.enum(["none", "primary", "secondary", "high_school_above"]).optional(),
  mother_education_band: z.enum(["none", "primary", "secondary", "high_school_above"]).optional(),
  school_aged_children_studying: z.string().optional().or(z.literal("")),
  school_aged_children_working: z.string().optional().or(z.literal("")),
  school_attendance_band: z.enum(["none", "some_irregular", "most_attend", "all_attend"]).optional(),

  debt_band: z.enum(["no_debt", "small_manageable", "high_burden", "very_high_risk"]).optional(),
  debt_amount: z.string().optional().or(z.literal("")),

  farm_land_band: z.enum(["landless", "small", "medium", "large"]).optional(),
  farm_income_band: z.enum(["none", "minimal", "moderate", "major"]).optional(),
  plantation_land_band: z.enum(["landless", "small", "medium", "large"]).optional(),
  plantation_income_band: z.enum(["none", "minimal", "moderate", "major"]).optional(),

  vulnerability_orphan_single_parent: z.boolean(),
  vulnerability_disability: z.boolean(),
  vulnerability_chronic_illness: z.boolean(),
  vulnerability_debt_burden: z.boolean(),
  vulnerability_landless: z.boolean(),

  husbandry_band: z.enum(["none", "small", "medium", "large"]).optional(),

  poverty_certificate: z.string().optional().or(z.literal("")),
  distance_from_town: z.string().optional().or(z.literal("")),
  visitor_name: z.string().optional().or(z.literal("")),
  visitor_comments: z.string().optional().or(z.literal("")),
});

export type SocialFormValues = z.infer<typeof socialFormSchema>;
