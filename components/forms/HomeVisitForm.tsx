"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homeVisitFormSchema, type HomeVisitFormValues } from "@/features/home-visit/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export function HomeVisitForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<HomeVisitFormValues>;
  onSubmit: (values: HomeVisitFormValues) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HomeVisitFormValues>({
    resolver: zodResolver(homeVisitFormSchema),
    defaultValues: {
      house_type: "",
      family_income: "",
      transportation: "",
      electricity_access: false,
      internet_access: false,
      family_condition_notes: "",
      recommendation: "neutral",
      ...defaultValues,
    },
  });

  async function handleSubmit(values: HomeVisitFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-xl space-y-5">
        <FormField
          control={form.control}
          name="house_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>House Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Wooden house, two rooms" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="family_income"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observed Family Income (USD/month)</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="transportation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transportation</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Walks 3km to school" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="electricity_access"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormLabel className="font-normal">Electricity Access</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="internet_access"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormLabel className="font-normal">Internet Access</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="family_condition_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Condition Notes</FormLabel>
              <FormControl>
                <Textarea rows={5} placeholder="Observations from the visit..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" disabled={isSubmitting} className="sticky bottom-4">
          {isSubmitting ? "Saving..." : "Save Home Visit"}
        </Button>
      </form>
    </Form>
  );
}
