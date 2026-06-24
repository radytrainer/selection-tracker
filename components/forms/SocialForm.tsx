"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { socialFormSchema, type SocialFormValues } from "@/features/social-form/schema";
import {
  ACADEMIC_RANK_POINTS,
  CATEGORY_LABELS,
  DEBT_POINTS,
  DEPENDENTS_POINTS,
  EDUCATION_SUPPORT_POINTS,
  ELECTRICITY_ACCESS_POINTS,
  EXPENSES_POINTS,
  HEALTH_STATUS_POINTS,
  HOUSEHOLD_SIZE_POINTS,
  HOUSE_STATUS_POINTS,
  HOUSING_TYPE_POINTS,
  HUSBANDRY_POINTS,
  INCOME_CONTRIBUTION_POINTS,
  INCOME_POINTS,
  LAND_POINTS,
  PARENT_EDUCATION_POINTS,
  PARENT_OCCUPATION_POINTS,
  SCHOOL_ATTENDANCE_POINTS,
  WATER_ACCESS_POINTS,
  computeSocialFormScore,
} from "@/features/social-form/scoring";
import { ChoiceGroup } from "@/components/forms/ChoiceGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

function opts<T extends string>(points: Record<T, number>, labels: Record<T, string>) {
  return (Object.keys(points) as T[]).map((value) => ({ value, label: labels[value], points: points[value] }));
}

const HEALTH_OPTS = opts(HEALTH_STATUS_POINTS, {
  healthy: "Healthy",
  simple_disease: "Simple disease",
  chronic_disease: "Chronic disease",
});
const ACADEMIC_OPTS = opts(ACADEMIC_RANK_POINTS, {
  outstanding_ab: "Outstanding — Ranks A & B",
  good_cd: "Good — Ranks C & D",
  average_e: "Average — Rank E",
});
const HOUSEHOLD_SIZE_OPTS = opts(HOUSEHOLD_SIZE_POINTS, { "1_3": "1–3 people", "4_6": "4–6 people", "7_plus": "7+ people" });
const DEPENDENTS_OPTS = opts(DEPENDENTS_POINTS, { none: "None", "1_2": "1–2", "3_plus": "3+" });
const PARENT_OCCUPATION_OPTS = opts(PARENT_OCCUPATION_POINTS, {
  unemployed: "Unemployed",
  daily_laborer: "Daily laborer",
  farmer: "Farmer",
  small_business: "Small business",
  stable_salaried: "Stable salaried job",
});
const HOUSING_TYPE_OPTS = opts(HOUSING_TYPE_POINTS, {
  makeshift: "Makeshift (bamboo, plastic, temporary)",
  wooden_zinc: "Wooden / basic zinc roof",
  brick_concrete: "Brick/Concrete simple",
  permanent: "Permanent well-structured house",
});
const HOUSE_STATUS_OPTS = opts(HOUSE_STATUS_POINTS, {
  rented: "Rented / temporary",
  family_fragile: "Family-owned but fragile",
  family_fair: "Family-owned in fair condition",
  family_strong: "Family-owned and strong/permanent",
});
const WATER_ACCESS_OPTS = opts(WATER_ACCESS_POINTS, {
  river_pond: "River/pond/unprotected source",
  communal_well: "Communal well / shared",
  own_well: "Own well / filtered water",
  piped: "Piped water supply",
});
const ELECTRICITY_OPTS = opts(ELECTRICITY_ACCESS_POINTS, {
  none: "No electricity",
  shared_solar: "Shared / limited solar",
  regular: "Regular connection",
});
const ASSET_OPTS = [
  { value: 0, label: "0 — None", points: 0 },
  { value: 1, label: "1 — Very few/old", points: 1 },
  { value: 2, label: "2 — Some", points: 2 },
  { value: 3, label: "3 — Many/modern", points: 3 },
];
const INCOME_OPTS = opts(INCOME_POINTS, { lt_100: "< $100", "101_200": "$101–200", "201_400": "$201–400", gt_400: "> $400" });
const EXPENSES_OPTS = opts(EXPENSES_POINTS, { lt_100: "< $100", "101_200": "$101–200", "201_400": "$201–400", gt_400: "> $400" });
const EDUCATION_SUPPORT_OPTS = opts(EDUCATION_SUPPORT_POINTS, {
  no: "No (cannot afford)",
  maybe: "Maybe (very limited)",
  yes: "Yes (can manage)",
});
const PARENT_EDUCATION_OPTS = opts(PARENT_EDUCATION_POINTS, {
  none: "No formal education",
  primary: "Primary school",
  secondary: "Secondary school",
  high_school_above: "High school or above",
});
const SCHOOL_ATTENDANCE_OPTS = opts(SCHOOL_ATTENDANCE_POINTS, {
  none: "None attend",
  some_irregular: "Some, irregular attendance",
  most_attend: "Most attend",
  all_attend: "All attend regularly",
});
const DEBT_OPTS = opts(DEBT_POINTS, {
  no_debt: "No debt",
  small_manageable: "Small manageable debt",
  high_burden: "High debt with repayment burden",
  very_high_risk: "Very high debt / at risk",
});
const LAND_OPTS = opts(LAND_POINTS, {
  landless: "Landless",
  small: "Small plot (<0.5 ha)",
  medium: "Medium plot (0.5–2 ha)",
  large: "Large (>2 ha)",
});
const INCOME_CONTRIBUTION_OPTS = opts(INCOME_CONTRIBUTION_POINTS, {
  none: "None",
  minimal: "Minimal / subsistence only",
  moderate: "Moderate income support",
  major: "Major household income",
});
const HUSBANDRY_OPTS = opts(HUSBANDRY_POINTS, {
  none: "No animal husbandry",
  small: "A few (2 pigs / 2 goats / 50 poultry)",
  medium: "Some (~2 cows / 2 buffaloes / 10 pigs / 10 goats / 100 poultry)",
  large: "Many (2+ cows / buffaloes / 10+ pigs / goats / 100+ poultry)",
});

const VULNERABILITY_OPTS: { name: keyof SocialFormValues; label: string }[] = [
  { name: "vulnerability_orphan_single_parent", label: "Orphan / Single parent" },
  { name: "vulnerability_disability", label: "Disability in family" },
  { name: "vulnerability_chronic_illness", label: "Chronic illness" },
  { name: "vulnerability_debt_burden", label: "Debt burden" },
  { name: "vulnerability_landless", label: "Landless" },
];

const STEPS = [
  "Health & Academic",
  "Household Profile",
  "Housing & Utilities",
  "Household Assets",
  "Income & Expenses",
  "Education Background",
  "Debt",
  "Farming & Plantation",
  "Vulnerability & Husbandry",
  "Summary",
];

const DEFAULT_VALUES: SocialFormValues = {
  ok_to_join_training: "",
  household_size_note: "",
  dependents_note: "",
  father_age: "",
  father_job: "",
  mother_age: "",
  mother_job: "",
  house_owner: "",
  assets_furniture: 0,
  assets_transport: 0,
  assets_electronics: 0,
  assets_livestock: 0,
  income_note: "",
  expenses_note: "",
  education_support_note: "",
  school_aged_children_studying: "",
  school_aged_children_working: "",
  debt_amount: "",
  vulnerability_orphan_single_parent: false,
  vulnerability_disability: false,
  vulnerability_chronic_illness: false,
  vulnerability_debt_burden: false,
  vulnerability_landless: false,
  poverty_certificate: "",
  distance_from_town: "",
  visitor_name: "",
  visitor_comments: "",
};

function draftKey(studentId: string) {
  return `social-form-draft-${studentId}`;
}

export function SocialForm({
  studentId,
  defaultValues,
  onSubmit,
}: {
  studentId: string;
  defaultValues?: Partial<SocialFormValues>;
  onSubmit: (values: SocialFormValues) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditingExisting = !!defaultValues;

  const form = useForm<SocialFormValues>({
    resolver: zodResolver(socialFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  // Recover an in-progress draft on a brand-new entry only — editing an
  // existing saved assessment trusts the server data, not a possibly-stale
  // local draft from a previous abandoned attempt.
  useEffect(() => {
    if (isEditingExisting) return;
    const raw = localStorage.getItem(draftKey(studentId));
    if (!raw) return;
    try {
      form.reset(JSON.parse(raw));
    } catch {
      // corrupt draft — ignore and start fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = form.watch();
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(draftKey(studentId), JSON.stringify(values));
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  const score = useMemo(() => computeSocialFormScore(values), [values]);

  async function handleSubmit(submitted: SocialFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit(submitted);
      localStorage.removeItem(draftKey(studentId));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pb-20">
        <div className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 py-2 sm:-mx-0 sm:rounded-md sm:border">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Step {step + 1}/{STEPS.length}: {STEPS[step]}
            </span>
            <span className="text-muted-foreground">
              Score {score.finalScore} · {CATEGORY_LABELS[score.category]}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Health</p>
              <ChoiceGroup
                value={form.watch("health_status")}
                onChange={(v) => form.setValue("health_status", v)}
                options={HEALTH_OPTS}
              />
            </div>
            <FormField
              control={form.control}
              name="ok_to_join_training"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OK to join the training?</FormLabel>
                  <FormControl>
                    <Input placeholder="Notes if a health condition affects training" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Academic Performance</p>
              <ChoiceGroup
                value={form.watch("academic_rank")}
                onChange={(v) => form.setValue("academic_rank", v)}
                options={ACADEMIC_OPTS}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Household Size</p>
              <ChoiceGroup
                value={form.watch("household_size_band")}
                onChange={(v) => form.setValue("household_size_band", v)}
                options={HOUSEHOLD_SIZE_OPTS}
              />
              <FormField
                control={form.control}
                name="household_size_note"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <Input placeholder="Specify..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Dependents (children/elderly/disabled)</p>
              <ChoiceGroup
                value={form.watch("dependents_band")}
                onChange={(v) => form.setValue("dependents_band", v)}
                options={DEPENDENTS_OPTS}
              />
              <FormField
                control={form.control}
                name="dependents_note"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <Input placeholder="Specify..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="father_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father&apos;s Age</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="father_job"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father&apos;s Job</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mother_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother&apos;s Age</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mother_job"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother&apos;s Job</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Parent/Guardian Occupation</p>
              <ChoiceGroup
                value={form.watch("parent_occupation_band")}
                onChange={(v) => form.setValue("parent_occupation_band", v)}
                options={PARENT_OCCUPATION_OPTS}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="house_owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Owner</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Type of Housing</p>
              <ChoiceGroup
                value={form.watch("housing_type_band")}
                onChange={(v) => form.setValue("housing_type_band", v)}
                options={HOUSING_TYPE_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Status of the House</p>
              <ChoiceGroup
                value={form.watch("house_status_band")}
                onChange={(v) => form.setValue("house_status_band", v)}
                options={HOUSE_STATUS_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Water Access</p>
              <ChoiceGroup
                value={form.watch("water_access_band")}
                onChange={(v) => form.setValue("water_access_band", v)}
                options={WATER_ACCESS_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Electricity Access</p>
              <ChoiceGroup
                value={form.watch("electricity_access_band")}
                onChange={(v) => form.setValue("electricity_access_band", v)}
                options={ELECTRICITY_OPTS}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            {(
              [
                ["assets_furniture", "Furniture (bed, table, chairs)"],
                ["assets_transport", "Transport (bicycle, motorbike, car)"],
                ["assets_electronics", "Electronics (radio, TV, phone, computer)"],
                ["assets_livestock", "Livestock (chickens, cows, pigs)"],
              ] as const
            ).map(([name, label]) => (
              <div key={name}>
                <p className="mb-2 text-sm font-medium">{label}</p>
                <ChoiceGroup value={form.watch(name)} onChange={(v) => form.setValue(name, v)} options={ASSET_OPTS} />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Household Income (monthly)</p>
              <ChoiceGroup
                value={form.watch("income_band")}
                onChange={(v) => form.setValue("income_band", v)}
                options={INCOME_OPTS}
              />
              <FormField
                control={form.control}
                name="income_note"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <Input placeholder="Specify..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Household Expenses (monthly)</p>
              <ChoiceGroup
                value={form.watch("expenses_band")}
                onChange={(v) => form.setValue("expenses_band", v)}
                options={EXPENSES_OPTS}
              />
              <FormField
                control={form.control}
                name="expenses_note"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <Input placeholder="Specify..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">
                Can the family financially support the child&apos;s higher education without PNC?
              </p>
              <ChoiceGroup
                value={form.watch("education_support_band")}
                onChange={(v) => form.setValue("education_support_band", v)}
                options={EDUCATION_SUPPORT_OPTS}
              />
              <FormField
                control={form.control}
                name="education_support_note"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <Input placeholder="Notes..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Father&apos;s Education Level</p>
              <ChoiceGroup
                value={form.watch("father_education_band")}
                onChange={(v) => form.setValue("father_education_band", v)}
                options={PARENT_EDUCATION_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Mother&apos;s Education Level</p>
              <ChoiceGroup
                value={form.watch("mother_education_band")}
                onChange={(v) => form.setValue("mother_education_band", v)}
                options={PARENT_EDUCATION_OPTS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="school_aged_children_studying"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Children Studying</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school_aged_children_working"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Children Working</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">School Attendance</p>
              <ChoiceGroup
                value={form.watch("school_attendance_band")}
                onChange={(v) => form.setValue("school_attendance_band", v)}
                options={SCHOOL_ATTENDANCE_OPTS}
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Household Debt Status</p>
              <ChoiceGroup
                value={form.watch("debt_band")}
                onChange={(v) => form.setValue("debt_band", v)}
                options={DEBT_OPTS}
              />
            </div>
            <FormField
              control={form.control}
              name="debt_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Farming — Land Ownership</p>
              <ChoiceGroup
                value={form.watch("farm_land_band")}
                onChange={(v) => form.setValue("farm_land_band", v)}
                options={LAND_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Farming — Income Contribution</p>
              <ChoiceGroup
                value={form.watch("farm_income_band")}
                onChange={(v) => form.setValue("farm_income_band", v)}
                options={INCOME_CONTRIBUTION_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Plantation — Land Ownership</p>
              <ChoiceGroup
                value={form.watch("plantation_land_band")}
                onChange={(v) => form.setValue("plantation_land_band", v)}
                options={LAND_OPTS}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Plantation — Income Contribution</p>
              <ChoiceGroup
                value={form.watch("plantation_income_band")}
                onChange={(v) => form.setValue("plantation_income_band", v)}
                options={INCOME_CONTRIBUTION_OPTS}
              />
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Vulnerability Factors (tick all that apply, −1 each)</p>
              <div className="space-y-2">
                {VULNERABILITY_OPTS.map(({ name, label }) => (
                  <label
                    key={name}
                    className="flex items-center gap-3 rounded-md border px-3 py-3 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={form.watch(name) as boolean}
                      onCheckedChange={(checked) => form.setValue(name, checked === true)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Husbandry</p>
              <ChoiceGroup
                value={form.watch("husbandry_band")}
                onChange={(v) => form.setValue("husbandry_band", v)}
                options={HUSBANDRY_OPTS}
              />
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-5">
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <p>
                Total score: <span className="font-medium">{score.totalScore}</span>
              </p>
              <p>
                Vulnerability deduction: <span className="font-medium">−{score.vulnerabilityDeduction}</span>
              </p>
              <p>
                Final score: <span className="font-medium">{score.finalScore}</span>
              </p>
              <p>
                Category: <span className="font-medium">{CATEGORY_LABELS[score.category]}</span>
              </p>
            </div>
            <FormField
              control={form.control}
              name="poverty_certificate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poverty Certificate?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Yes, issued by commune" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distance_from_town"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distance from Town</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visitor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Visitor Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visitor_comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between border-t bg-background p-3 sm:sticky sm:rounded-md sm:border">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {isLastStep ? (
            <Button key="submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Social Form"}
            </Button>
          ) : (
            <Button key="next" type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
