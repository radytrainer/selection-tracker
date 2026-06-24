"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  COMMITTEE_RATING_CRITERIA,
  COMMITTEE_RATING_CRITERIA_INFO,
  type CommitteeRatingCriterion,
} from "@/lib/constants";
import { upsertCommitteeRating } from "@/services/committeeService";
import type { Database } from "@/types/database.types";
import { StarRating } from "@/components/committee/StarRating";

type CommitteeRatingRow = Database["public"]["Tables"]["committee_ratings"]["Row"];

export function CommitteeRatingPanel({
  studentId,
  cycleId,
  ratings,
  myUserId,
  canRate,
  onRated,
}: {
  studentId: string;
  cycleId: string;
  ratings: CommitteeRatingRow[];
  myUserId: string | null;
  canRate: boolean;
  onRated: () => void;
}) {
  const [savingCriterion, setSavingCriterion] = useState<CommitteeRatingCriterion | null>(null);

  async function handleRate(criterion: CommitteeRatingCriterion, score: number) {
    setSavingCriterion(criterion);
    try {
      await upsertCommitteeRating({ studentId, cycleId, criterion, score });
      onRated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rating");
    } finally {
      setSavingCriterion(null);
    }
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      {COMMITTEE_RATING_CRITERIA.map((criterion) => {
        const forCriterion = ratings.filter((r) => r.criterion === criterion);
        const average =
          forCriterion.length > 0
            ? forCriterion.reduce((sum, r) => sum + r.score, 0) / forCriterion.length
            : null;
        const mine = forCriterion.find((r) => r.rated_by === myUserId);
        const info = COMMITTEE_RATING_CRITERIA_INFO[criterion];

        return (
          <div key={criterion} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium">{info.label}</p>
              <p className="truncate text-xs text-muted-foreground">{info.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {average != null && (
                <span className="text-xs text-muted-foreground">
                  avg {average.toFixed(1)} ({forCriterion.length})
                </span>
              )}
              <StarRating
                value={mine?.score ?? 0}
                disabled={savingCriterion === criterion}
                onChange={canRate ? (score) => handleRate(criterion, score) : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
