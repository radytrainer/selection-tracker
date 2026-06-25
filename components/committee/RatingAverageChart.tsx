import type { Database } from "@/types/database.types";
import { StarRating } from "@/components/ui/star-rating";

type CommitteeRatingRow = Database["public"]["Tables"]["committee_ratings"]["Row"];

export function RatingAverageChart({ ratings }: { ratings: CommitteeRatingRow[] }) {
  const count = ratings.length;
  const average = count > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / count : 0;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold">{count > 0 ? average.toFixed(1) : "—"}</p>
          <p className="text-xs text-muted-foreground">
            {count} member{count === 1 ? "" : "s"} voted
          </p>
        </div>
        <StarRating value={Math.round(average)} />
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-amber-400 transition-all"
          style={{ width: `${(average / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}
