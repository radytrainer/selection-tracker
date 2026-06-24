"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home as HomeIcon,
  Package,
  ShieldAlert,
  Users,
  Wallet,
  Wheat,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { socialFormSchema, type SocialFormValues } from "@/features/social-form/schema";
import {
  ACADEMIC_RANK_POINTS,
  CATEGORY_BADGE_CLASSES,
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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";

function opts<T extends string>(points: Record<T, number>, labels: Record<T, string>) {
  return (Object.keys(points) as T[]).map((value) => ({ value, label: labels[value], points: points[value] }));
}

function labelFor<T extends string | number>(options: { value: T; label: string }[], value: T | null | undefined) {
  if (value == null || value === ("" as unknown as T)) return null;
  return options.find((o) => o.value === value)?.label ?? null;
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
  { value: 0, label: "0", points: 0 },
  { value: 1, label: "1", points: 1 },
  { value: 2, label: "2", points: 2 },
  { value: 3, label: "3", points: 3 },
];
const ASSET_RANK_LABELS = ["None", "Very few/old", "Some", "Many/modern"];
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

const STEPS: { title: string; icon: LucideIcon }[] = [
  { title: "Health & Academic", icon: HeartPulse },
  { title: "Household Profile", icon: Users },
  { title: "Housing & Utilities", icon: HomeIcon },
  { title: "Household Assets", icon: Package },
  { title: "Income & Expenses", icon: Wallet },
  { title: "Education Background", icon: GraduationCap },
  { title: "Debt", icon: CreditCard },
  { title: "Farming & Plantation", icon: Wheat },
  { title: "Vulnerability & Husbandry", icon: ShieldAlert },
  { title: "Summary", icon: ClipboardCheck },
];

/** Band fields that count toward each step's "answered" progress dot. Free-text notes and the always-defaulted asset ranks aren't required, so they're left out. */
const STEP_FIELDS: (keyof SocialFormValues)[][] = [
  ["health_status", "academic_rank"],
  ["household_size_band", "dependents_band", "parent_occupation_band"],
  ["housing_type_band", "house_status_band", "water_access_band", "electricity_access_band"],
  [],
  ["income_band", "expenses_band", "education_support_band"],
  ["father_education_band", "mother_education_band", "school_attendance_band"],
  ["debt_band"],
  ["farm_land_band", "farm_income_band", "plantation_land_band", "plantation_income_band"],
  ["husbandry_band"],
  [],
];

function SectionHeading({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="size-4 text-primary" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <span className="text-xs text-muted-foreground">({hint})</span>}
    </div>
  );
}

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

  const stepProgress = useMemo(
    () =>
      STEP_FIELDS.map((fields) => {
        if (fields.length === 0) return null;
        const answered = fields.filter((f) => {
          const v = values[f];
          return v !== undefined && v !== null && v !== "";
        }).length;
        return { answered, total: fields.length };
      }),
    [values],
  );

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
  const CurrentIcon = STEPS[step].icon;

  const reviewSections: { step: number; title: string; icon: LucideIcon; rows: { label: string; value: string }[] }[] = [
    {
      step: 0,
      title: "Health & Academic",
      icon: HeartPulse,
      rows: [
        { label: "Health", value: labelFor(HEALTH_OPTS, values.health_status) ?? "" },
        { label: "Academic Performance", value: labelFor(ACADEMIC_OPTS, values.academic_rank) ?? "" },
      ].filter((r) => r.value),
    },
    {
      step: 1,
      title: "Household Profile",
      icon: Users,
      rows: [
        { label: "Household Size", value: labelFor(HOUSEHOLD_SIZE_OPTS, values.household_size_band) ?? "" },
        { label: "Dependents", value: labelFor(DEPENDENTS_OPTS, values.dependents_band) ?? "" },
        { label: "Parent Occupation", value: labelFor(PARENT_OCCUPATION_OPTS, values.parent_occupation_band) ?? "" },
        { label: "Father", value: [values.father_age, values.father_job].filter(Boolean).join(" · ") },
        { label: "Mother", value: [values.mother_age, values.mother_job].filter(Boolean).join(" · ") },
      ].filter((r) => r.value),
    },
    {
      step: 2,
      title: "Housing & Utilities",
      icon: HomeIcon,
      rows: [
        { label: "Housing Type", value: labelFor(HOUSING_TYPE_OPTS, values.housing_type_band) ?? "" },
        { label: "House Status", value: labelFor(HOUSE_STATUS_OPTS, values.house_status_band) ?? "" },
        { label: "Water Access", value: labelFor(WATER_ACCESS_OPTS, values.water_access_band) ?? "" },
        { label: "Electricity", value: labelFor(ELECTRICITY_OPTS, values.electricity_access_band) ?? "" },
      ].filter((r) => r.value),
    },
    {
      step: 3,
      title: "Household Assets",
      icon: Package,
      rows: [
        { label: "Furniture", value: ASSET_RANK_LABELS[values.assets_furniture] },
        { label: "Transport", value: ASSET_RANK_LABELS[values.assets_transport] },
        { label: "Electronics", value: ASSET_RANK_LABELS[values.assets_electronics] },
        { label: "Livestock", value: ASSET_RANK_LABELS[values.assets_livestock] },
      ],
    },
    {
      step: 4,
      title: "Income & Expenses",
      icon: Wallet,
      rows: [
        { label: "Monthly Income", value: labelFor(INCOME_OPTS, values.income_band) ?? "" },
        { label: "Monthly Expenses", value: labelFor(EXPENSES_OPTS, values.expenses_band) ?? "" },
        { label: "Can Support Education", value: labelFor(EDUCATION_SUPPORT_OPTS, values.education_support_band) ?? "" },
      ].filter((r) => r.value),
    },
    {
      step: 5,
      title: "Education Background",
      icon: GraduationCap,
      rows: [
        { label: "Father's Education", value: labelFor(PARENT_EDUCATION_OPTS, values.father_education_band) ?? "" },
        { label: "Mother's Education", value: labelFor(PARENT_EDUCATION_OPTS, values.mother_education_band) ?? "" },
        { label: "School Attendance", value: labelFor(SCHOOL_ATTENDANCE_OPTS, values.school_attendance_band) ?? "" },
      ].filter((r) => r.value),
    },
    {
      step: 6,
      title: "Debt",
      icon: CreditCard,
      rows: [{ label: "Debt Status", value: labelFor(DEBT_OPTS, values.debt_band) ?? "" }].filter((r) => r.value),
    },
    {
      step: 7,
      title: "Farming & Plantation",
      icon: Wheat,
      rows: [
        { label: "Farm Land", value: labelFor(LAND_OPTS, values.farm_land_band) ?? "" },
        { label: "Farm Income", value: labelFor(INCOME_CONTRIBUTION_OPTS, values.farm_income_band) ?? "" },
        { label: "Plantation Land", value: labelFor(LAND_OPTS, values.plantation_land_band) ?? "" },
        { label: "Plantation Income", value: labelFor(INCOME_CONTRIBUTION_OPTS, values.plantation_income_band) ?? "" },
      ].filter((r) => r.value),
    },
    {
      step: 8,
      title: "Vulnerability & Husbandry",
      icon: ShieldAlert,
      rows: [
        {
          label: "Vulnerabilities",
          value: VULNERABILITY_OPTS.filter((v) => values[v.name])
            .map((v) => v.label)
            .join(", "),
        },
        { label: "Husbandry", value: labelFor(HUSBANDRY_OPTS, values.husbandry_band) ?? "" },
      ].filter((r) => r.value),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pb-20">
        <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b bg-background px-4 py-2.5 sm:-mx-0 sm:rounded-md sm:border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CurrentIcon className="size-4 text-primary" />
              <span className="text-sm font-medium">{STEPS[step].title}</span>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", CATEGORY_BADGE_CLASSES[score.category])}>
              {score.finalScore} pts · {CATEGORY_LABELS[score.category]}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-0.5">
            {STEPS.map((s, i) => {
              const progress = stepProgress[i];
              const isDone = progress ? progress.answered === progress.total : null;
              const isPartial = progress ? progress.answered > 0 && progress.answered < progress.total : false;
              const StepIcon = s.icon;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  className={cn(
                    "relative flex shrink-0 items-center justify-center rounded-full p-2 transition-colors",
                    i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  <StepIcon className="size-4" />
                  {isDone && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-green-600 text-white">
                      <Check className="size-2" strokeWidth={4} />
                    </span>
                  )}
                  {isPartial && (
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <SectionHeading icon={HeartPulse} title="Health" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={GraduationCap} title="Academic Performance" />
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
              <SectionHeading icon={Users} title="Household Size" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={Users} title="Dependents" hint="children/elderly/disabled" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={Wallet} title="Parent/Guardian Occupation" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={HomeIcon} title="Type of Housing" />
              <ChoiceGroup
                value={form.watch("housing_type_band")}
                onChange={(v) => form.setValue("housing_type_band", v)}
                options={HOUSING_TYPE_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={HomeIcon} title="Status of the House" />
              <ChoiceGroup
                value={form.watch("house_status_band")}
                onChange={(v) => form.setValue("house_status_band", v)}
                options={HOUSE_STATUS_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={HomeIcon} title="Water Access" />
              <ChoiceGroup
                value={form.watch("water_access_band")}
                onChange={(v) => form.setValue("water_access_band", v)}
                options={WATER_ACCESS_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={HomeIcon} title="Electricity Access" />
              <ChoiceGroup
                layout="grid"
                value={form.watch("electricity_access_band")}
                onChange={(v) => form.setValue("electricity_access_band", v)}
                options={ELECTRICITY_OPTS}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {(
              [
                ["assets_furniture", "Furniture (bed, table, chairs)"],
                ["assets_transport", "Transport (bicycle, motorbike, car)"],
                ["assets_electronics", "Electronics (radio, TV, phone, computer)"],
                ["assets_livestock", "Livestock (chickens, cows, pigs)"],
              ] as const
            ).map(([name, label]) => (
              <div key={name}>
                <SectionHeading icon={Package} title={label} hint={ASSET_RANK_LABELS[form.watch(name)]} />
                <ChoiceGroup
                  layout="segmented"
                  value={form.watch(name)}
                  onChange={(v) => form.setValue(name, v)}
                  options={ASSET_OPTS}
                />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <SectionHeading icon={Wallet} title="Household Income" hint="monthly" />
              <ChoiceGroup
                layout="segmented"
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
              <SectionHeading icon={Wallet} title="Household Expenses" hint="monthly" />
              <ChoiceGroup
                layout="segmented"
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
              <SectionHeading icon={GraduationCap} title="Can the family afford higher education without PNC?" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={GraduationCap} title="Father's Education Level" />
              <ChoiceGroup
                layout="grid"
                value={form.watch("father_education_band")}
                onChange={(v) => form.setValue("father_education_band", v)}
                options={PARENT_EDUCATION_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={GraduationCap} title="Mother's Education Level" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={GraduationCap} title="School Attendance" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={CreditCard} title="Household Debt Status" />
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
              <SectionHeading icon={Wheat} title="Farming — Land Ownership" />
              <ChoiceGroup
                layout="grid"
                value={form.watch("farm_land_band")}
                onChange={(v) => form.setValue("farm_land_band", v)}
                options={LAND_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={Wheat} title="Farming — Income Contribution" />
              <ChoiceGroup
                layout="grid"
                value={form.watch("farm_income_band")}
                onChange={(v) => form.setValue("farm_income_band", v)}
                options={INCOME_CONTRIBUTION_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={Wheat} title="Plantation — Land Ownership" />
              <ChoiceGroup
                layout="grid"
                value={form.watch("plantation_land_band")}
                onChange={(v) => form.setValue("plantation_land_band", v)}
                options={LAND_OPTS}
              />
            </div>
            <div>
              <SectionHeading icon={Wheat} title="Plantation — Income Contribution" />
              <ChoiceGroup
                layout="grid"
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
              <SectionHeading icon={ShieldAlert} title="Vulnerability Factors" hint="tick all that apply, −1 each" />
              <div className="grid grid-cols-2 gap-2">
                {VULNERABILITY_OPTS.map(({ name, label }) => {
                  const checked = form.watch(name) as boolean;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => form.setValue(name, !checked)}
                      aria-pressed={checked}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition-all active:scale-[0.98]",
                        checked
                          ? "border-destructive bg-destructive/10 font-medium"
                          : "border-border bg-background hover:border-destructive/40 hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                          checked ? "border-destructive bg-destructive text-white" : "border-muted-foreground/30",
                        )}
                      >
                        {checked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <SectionHeading icon={ShieldAlert} title="Husbandry" />
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
            <div className={cn("rounded-xl border-2 p-4", CATEGORY_BADGE_CLASSES[score.category], "border-current/20")}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">Final Assessment</p>
              <p className="mt-1 text-2xl font-semibold">{CATEGORY_LABELS[score.category]}</p>
              <p className="mt-1 text-sm opacity-80">
                {score.totalScore} pts total − {score.vulnerabilityDeduction} vulnerability ={" "}
                <span className="font-medium">{score.finalScore} pts</span>
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Review your answers</p>
              {reviewSections.map((section) => (
                <div key={section.title} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <section.icon className="size-4 text-primary" />
                      {section.title}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(section.step)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  {section.rows.length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">Not answered yet</p>
                  ) : (
                    <dl className="mt-1.5 space-y-1 text-xs">
                      {section.rows.map((row) => (
                        <div key={row.label} className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className="text-right font-medium">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
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
