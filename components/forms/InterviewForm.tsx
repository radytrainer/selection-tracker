"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  interviewFormSchema,
  computeTotal,
  computeGrade,
  type InterviewFormValues,
  type ScoreKey,
} from "@/features/interview/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADE_LABELS: Record<string, string> = {
  A1: "A1 (48–80)",
  A2: "A2 (40–47)",
  not_recommended: "Not Recommended (<40)",
};

const GRADE_COLORS: Record<string, string> = {
  A1: "text-green-700 bg-green-50 border-green-200",
  A2: "text-blue-700 bg-blue-50 border-blue-200",
  not_recommended: "text-red-700 bg-red-50 border-red-200",
};

type Question = { key: ScoreKey; km: string; en: string };
type Category = { label: string; questions: Question[] };

const CATEGORIES: Category[] = [
  {
    label: "Motivation in IT",
    questions: [
      {
        key: "q1_score",
        km: "ខ្ញុំចូលចិត្តបំបែកបញ្ហាស្មុគស្មាញ ឱ្យទៅជាផ្នែកតូចៗ ដែលងាយស្រួលដោះស្រាយ។",
        en: "I like breaking complex problems into smaller, easy-to-solve pieces.",
      },
      {
        key: "q2_score",
        km: 'នៅពេលជួបបញ្ហាបច្ចេកទេស ឬ "Bug" ការគិតដំបូងរបស់ខ្ញុំគឺចង់ដឹងពីមូលហេតុ ដែលវាកើតឡើង ជាជាងត្រាន់តែចង់ជួសជុលវាឱ្យរួចពីម្ដ។',
        en: 'When encountering bugs or technical issues, my first instinct is to understand the root cause rather than just fix it quickly.',
      },
      {
        key: "q3_score",
        km: "តើអ្នកគិតថាមានសារសំខាន់បុណ្ណាក្នុងការបង្កើតអ្វីថ្មីៗ ដែលមានលក្ខណៈប្លែក ស្មាត និងទាក់ទាញ?",
        en: "How important is it to create new things that are unique, smart, and attractive?",
      },
      {
        key: "q4_score",
        km: "ខ្ញុំចង់មានអាជីព/ការងារមួយនៅក្នុងវិស័យបច្ចេកវិទ្យា។",
        en: "I want a career in the technology field.",
      },
      {
        key: "q5_score",
        km: 'ខ្ញុំយល់ស្របនឹងគំនិតដែលថា ជាញឹកញាប់មានវិធីដោះស្រាយ ជៀសជាង "ត្រឹមត្រូវ" ជាងមួយ ដើម្បីដោះស្រាយបញ្ហាអ្វីមួយ។',
        en: 'I agree there are often multiple ways to solve a problem, not just one "correct" way.',
      },
      {
        key: "q6_score",
        km: "ខ្ញុំចូលចិត្តរៀនប្រើប្រាស់ឧបករណ៍ និងកម្មវិធីថ្មីៗ ដើម្បីអភិវឌ្ឍន៍ខ្លួន។",
        en: "I like learning to use new tools and software to develop myself.",
      },
    ],
  },
  {
    label: "Study Resilience",
    questions: [
      {
        key: "q7_score",
        km: "តើអ្នកគិតថាមានសារសំខាន់បុណ្ណាក្នុងការយល់ និងអនុវត្តតាមបញ្ហាតិច ឬការណែនំ រៀបបំបែកបញ្ហាស្មុគស្មាញ?",
        en: "How important is understanding and applying approaches to solve complex problems?",
      },
      {
        key: "q8_score",
        km: "តើអ្នកគិតថាមានសារសំខាន់បុណ្ណាក្នុងការប្រើគំនិតថ្មី និងការប្រឌិតអំពីដំណើរការអ្វីថ្មីៗ?",
        en: "How important is using new ideas and creative thinking for new things?",
      },
      {
        key: "q9_score",
        km: "ខ្ញុំចូលចិត្តពន្យល់ពីបញ្ហាបច្ចេកទេសដល់អ្នកដ៏ទៃ ឬជួយដោះស្រាយបញ្ហាឧបករណ៍ប្រើប្រាស់របស់ពួកគេ។",
        en: "I like explaining technical concepts to others or helping them solve problems with their devices.",
      },
      {
        key: "q10_score",
        km: "កម្មវិធីសិក្សាមានរយៈពេល ២ ឆ្នាំ ហើយមានស្មុគស្មាញណាស់។ ពេលមានបញ្ហា ឬ គ្រួសាររបស់អ្នកត្រូវការអ្នក តើអ្នកនឹងបន្តដើរតាមការសិក្សារបស់អ្នកឬទេ?",
        en: "The program lasts 2 years and is quite complex. If problems arise or your family needs you, will you continue your studies?",
      },
    ],
  },
  {
    label: "Group Work / Collaboration",
    questions: [
      {
        key: "q11_score",
        km: "តើអ្នកគិតថាមានសារសំខាន់បុណ្ណាក្នុងការយកយល់ និងយល់ចិត្តចំពោះបញ្ហារបស់អ្នកដ៏ទៃ?",
        en: "How important is understanding and empathizing with the problems of others?",
      },
      {
        key: "q12_score",
        km: 'នៅពេលទទួលបានពិន្ទុមិនល្អ ឬគម្រោងត្រូវបានបរាជ័យ ខ្ញុំមានទំនោររៀនឡើងវិញ "សង្គ្រោះបច្ចុប្បន្ន" ជាជាងការរអ៊ូទាំពីការបរាជ័យ។',
        en: 'When receiving bad grades or failing a project, I tend to refocus on learning ("recover") rather than complaining about the failure.',
      },
      {
        key: "q13_score",
        km: "ខ្ញុំជឿថាការរៀនពូកែ ផ្អែកលើជំនាញ ដែលខ្ញុំអាចបង្ហាញតាមរយៈការខិតខំប្រឹងប្រែង មិនមែនជាទេពកោសល្យពីកំណើតនោះទេ។",
        en: "I believe skill comes from effort and practice, not innate talent.",
      },
      {
        key: "q14_score",
        km: "ខ្ញុំប្រើភាសាកាយវិការដ៏មានប្រសិទ្ធភាព ដើម្បីពង្រឹងការទំនាក់ទំនងរបស់ខ្ញុំ។",
        en: "I use effective body language to strengthen my communication.",
      },
      {
        key: "q15_score",
        km: "ខ្ញុំប្រាស្រ័យទាក់ទងដោយភាពស្រួលចិត្ត ជាមួយការគោរព និងគ្រប់គ្រងការសន្ទនាដោយវិជ្ជាជីវៈ។",
        en: "I communicate comfortably with respect and manage conversations professionally.",
      },
      {
        key: "q16_score",
        km: "ខ្ញុំរីករាយជាមួយជីវិតសហគមន៍ និងមានការទទួលខុសត្រូវចំពោះសុខុមាលភាពរបស់អ្នកដទៃ?",
        en: "I enjoy community life and feel responsible for the wellbeing of others.",
      },
    ],
  },
];

const SCORE_KEYS: ScoreKey[] = [
  "q1_score", "q2_score", "q3_score", "q4_score",
  "q5_score", "q6_score", "q7_score", "q8_score",
  "q9_score", "q10_score", "q11_score", "q12_score",
  "q13_score", "q14_score", "q15_score", "q16_score",
];

function ScoreSummary({ values }: { values: InterviewFormValues }) {
  const scoreValues = Object.fromEntries(
    SCORE_KEYS.map((k) => [k, values[k]])
  ) as Omit<InterviewFormValues, "comments">;

  const total = computeTotal(scoreValues);
  const allRated = SCORE_KEYS.every((k) => (values[k] ?? 0) > 0);
  const grade = allRated ? computeGrade(total) : null;

  const categoryTotals = CATEGORIES.map((cat) => ({
    label: cat.label,
    total: cat.questions.reduce((sum, q) => sum + (values[q.key] ?? 0), 0),
    max: cat.questions.length * 5,
  }));

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Total Score</span>
        <span className="text-lg font-semibold">
          {allRated ? total : "—"} / 80
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        {categoryTotals.map(({ label, total: ct, max }) => (
          <div key={label} className="text-center">
            <div className="font-medium text-foreground">{allRated ? ct : "—"}/{max}</div>
            <div>{label}</div>
          </div>
        ))}
      </div>
      {grade && (
        <div
          className={cn(
            "rounded border px-3 py-1.5 text-sm font-medium text-center",
            GRADE_COLORS[grade],
          )}
        >
          Grade: {GRADE_LABELS[grade]}
        </div>
      )}
    </div>
  );
}

let questionCounter = 0;

export function InterviewForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<InterviewFormValues>;
  onSubmit: (values: InterviewFormValues) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      q1_score: 0, q2_score: 0, q3_score: 0, q4_score: 0,
      q5_score: 0, q6_score: 0, q7_score: 0, q8_score: 0,
      q9_score: 0, q10_score: 0, q11_score: 0, q12_score: 0,
      q13_score: 0, q14_score: 0, q15_score: 0, q16_score: 0,
      comments: "",
      ...defaultValues,
    },
  });

  const watched = useWatch({ control: form.control });

  async function handleSubmit(values: InterviewFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  let qIndex = 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {CATEGORIES.map((category) => {
          const isCollapsed = collapsed[category.label] ?? false;
          const startIndex = qIndex;
          qIndex += category.questions.length;

          return (
            <div key={category.label} className="rounded-lg border overflow-hidden">
              {/* Category header — clickable to collapse */}
              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [category.label]: !isCollapsed }))
                }
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
              >
                <span className="text-sm font-semibold">{category.label}</span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    isCollapsed && "-rotate-90",
                  )}
                />
              </button>

              {/* Questions — hidden when collapsed */}
              {!isCollapsed && (
                <div className="divide-y">
                  {category.questions.map((q, idx) => {
                    const number = startIndex + idx + 1;
                    return (
                      <FormField
                        key={q.key}
                        control={form.control}
                        name={q.key}
                        render={({ field }) => (
                          <FormItem className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="flex gap-2 min-w-0">
                              <span className="text-muted-foreground text-sm shrink-0 pt-0.5">
                                {number}.
                              </span>
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-sm leading-snug">{q.km}</p>
                                <p className="text-xs text-muted-foreground leading-snug">{q.en}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <FormControl>
                                <StarRating
                                  size="sm"
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </div>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <ScoreSummary values={watched as InterviewFormValues} />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea rows={3} placeholder="Interviewer notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Interview"}
        </Button>
      </form>
    </Form>
  );
}
