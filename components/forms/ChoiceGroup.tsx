"use client";

import { cn } from "@/lib/utils";

/** Large tap-target single-select list — easier to use than a native <select> on a phone in the field. */
export function ChoiceGroup<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T | undefined;
  onChange: (value: T) => void;
  options: { value: T; label: string; points: number }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center justify-between rounded-md border px-3 py-3 text-left text-sm transition-colors",
            value === opt.value
              ? "border-primary bg-primary/10 font-medium"
              : "border-border hover:bg-muted",
          )}
        >
          <span>{opt.label}</span>
          <span className="text-xs text-muted-foreground">
            {opt.points} pt{opt.points === 1 ? "" : "s"}
          </span>
        </button>
      ))}
    </div>
  );
}
