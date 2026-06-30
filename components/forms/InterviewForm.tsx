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

type Category = {
  label: string;
  questions: { key: ScoreKey; text: string }[];
};

const CATEGORIES: Category[] = [
  {
    label: "Motivation in IT",
    questions: [
      {
        key: "q1_score",
        text: "I like breaking complex problems into smaller, easy-to-solve pieces.",
      },
      {
        key: "q2_score",
        text: 'When encountering bugs or technical issues, my first instinct is to understand the root cause rather than just fix it quickly.',
      },
      {
        key: "q3_score",
        text: "How important is it to create new things that are unique, smart, and attractive?",
      },
      {
        key: "q4_score",
        text: "I want a career in the technology field.",
      },
      {
        key: "q5_score",
        text: 'I agree there are often multiple ways to solve a problem, not just one "correct" way.',
      },
      {
        key: "q6_score",
        text: "I like learning to use new tools and software to develop myself.",
      },
    ],
  },
  {
    label: "Study Resilience",
    questions: [
      {
        key: "q7_score",
        text: "How important is understanding and applying approaches to solve complex problems?",
      },
      {
        key: "q8_score",
        text: "How important is using new ideas and creative thinking for new things?",
      },
      {
        key: "q9_score",
        text: "I like explaining technical concepts to others or helping them solve problems with their devices.",
      },
      {
        key: "q10_score",
        text: "The program lasts 2 years and is quite complex. If problems arise or your family needs you, will you continue your studies?",
      },
    ],
  },
  {
    label: "Group Work / Collaboration",
    questions: [
      {
        key: "q11_score",
        text: "How important is understanding and empathizing with the problems of others?",
      },
      {
        key: "q12_score",
        text: 'When receiving bad grades or failing a project, I tend to refocus on learning ("recover") rather than complaining about the failure.',
      },
      {
        key: "q13_score",
        text: "I believe skill comes from effort and practice, not innate talent.",
      },
      {
        key: "q14_score",
        text: "I use effective body language to strengthen my communication.",
      },
      {
        key: "q15_score",
        text: "I communicate comfortably with respect and manage conversations professionally.",
      },
      {
        key: "q16_score",
        text: "I enjoy community life and feel responsible for the wellbeing of others.",
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

export function InterviewForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<InterviewFormValues>;
  onSubmit: (values: InterviewFormValues) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      q1_score: 0,
      q2_score: 0,
      q3_score: 0,
      q4_score: 0,
      q5_score: 0,
      q6_score: 0,
      q7_score: 0,
      q8_score: 0,
      q9_score: 0,
      q10_score: 0,
      q11_score: 0,
      q12_score: 0,
      q13_score: 0,
      q14_score: 0,
      q15_score: 0,
      q16_score: 0,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {CATEGORIES.map((category) => (
          <div key={category.label} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {category.label}
            </h3>
            <div className="rounded-lg border divide-y">
              {category.questions.map((q, idx) => (
                <FormField
                  key={q.key}
                  control={form.control}
                  name={q.key}
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between gap-3 px-3 py-2.5">
                      <div className="flex gap-2 text-sm leading-snug">
                        <span className="text-muted-foreground shrink-0">
                          {CATEGORIES.slice(0, CATEGORIES.indexOf(category)).reduce(
                            (acc, c) => acc + c.questions.length,
                            0
                          ) +
                            idx +
                            1}
                          .
                        </span>
                        <span>{q.text}</span>
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
              ))}
            </div>
          </div>
        ))}

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
