"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertCommitteeRating } from "@/services/committeeService";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";

type CommitteeRatingRow = Database["public"]["Tables"]["committee_ratings"]["Row"];

/** Only mounted for roles that can vote (see canRate on the Dossier page) — admins see RatingAverageChart only. */
export function CommitteeRatingPanel({
  studentId,
  cycleId,
  ratings,
  myUserId,
  onRated,
}: {
  studentId: string;
  cycleId: string;
  ratings: CommitteeRatingRow[];
  myUserId: string | null;
  onRated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const mine = ratings.find((r) => r.rated_by === myUserId);

  async function handleRate(score: number) {
    setSaving(true);
    try {
      await upsertCommitteeRating({ studentId, cycleId, score });
      onRated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rating");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Your Vote</p>
        <p className="text-xs text-muted-foreground">Overall rating for this candidate, 1–5</p>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            disabled={saving}
            aria-pressed={mine?.score === score}
            onClick={() => handleRate(score)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
              mine?.score === score
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
