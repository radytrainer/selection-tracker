"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interviewFormSchema, type InterviewFormValues } from "@/features/interview/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RECOMMENDATION_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly Recommend",
  recommend: "Recommend",
  neutral: "Neutral",
  not_recommend: "Do Not Recommend",
};

type ScoreField =
  | "communication_score"
  | "leadership_score"
  | "motivation_score"
  | "confidence_score"
  | "critical_thinking_score";

const SCORE_FIELDS: { name: ScoreField; label: string }[] = [
  { name: "communication_score", label: "Communication" },
  { name: "leadership_score", label: "Leadership" },
  { name: "motivation_score", label: "Motivation" },
  { name: "confidence_score", label: "Confidence" },
  { name: "critical_thinking_score", label: "Critical Thinking" },
];

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
      communication_score: 0,
      leadership_score: 0,
      motivation_score: 0,
      confidence_score: 0,
      critical_thinking_score: 0,
      comments: "",
      recommendation: "neutral",
      ...defaultValues,
    },
  });

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
        <div className="space-y-3">
          {SCORE_FIELDS.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3">
                  <FormLabel className="font-normal">{label}</FormLabel>
                  <div className="flex flex-col items-end gap-1">
                    <FormControl>
                      <StarRating value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>

        <FormField
          control={form.control}
          name="recommendation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recommendation</FormLabel>
              <Select value={field.value} onValueChange={(value) => field.onChange(value ?? "")}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select recommendation">
                      {(value: string) => RECOMMENDATION_LABELS[value] ?? value}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(RECOMMENDATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Notes from the interview..." {...field} />
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
