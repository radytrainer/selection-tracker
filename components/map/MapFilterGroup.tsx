"use client";

import { cn } from "@/lib/utils";

/** Plain buttons instead of a Select/listbox — no portal, no popup
 * positioning, nothing for the Leaflet map underneath to ever contend with.
 * Each option is its own native <button onClick>. */
export function MapFilterGroup<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-card p-0.5 shadow-sm">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            value === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
