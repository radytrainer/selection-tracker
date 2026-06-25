"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertCommitteeRating } from "@/services/committeeService";
import type { Database } from "@/types/database.types";
import { StarRating } from "@/components/ui/star-rating";

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
      <StarRating value={mine?.score ?? 0} disabled={saving} onChange={handleRate} />
    </div>
  );
}
