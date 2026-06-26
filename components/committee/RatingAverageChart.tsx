import type { Database } from "@/types/database.types";

type CommitteeRatingRow = Database["public"]["Tables"]["committee_ratings"]["Row"];

/** How many members voted each score (5 down to 1) — the selection call is
 * made off which number got the most votes, not just the average. */
export function RatingAverageChart({ ratings }: { ratings: CommitteeRatingRow[] }) {
  const count = ratings.length;
  const average = count > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / count : 0;
  const counts = [1, 2, 3, 4, 5].map((score) => ratings.filter((r) => r.score === score).length);
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-3xl font-semibold">{count > 0 ? average.toFixed(1) : "—"}</p>
        <p className="text-xs text-muted-foreground">
          {count} member{count === 1 ? "" : "s"} voted
        </p>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((score) => {
          const n = counts[score - 1];
          return (
            <div key={score} className="flex items-center gap-2 text-xs">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold text-muted-foreground">
                {score}
              </span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(n / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right text-muted-foreground">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
