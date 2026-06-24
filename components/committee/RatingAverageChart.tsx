"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COMMITTEE_RATING_CRITERIA, COMMITTEE_RATING_CRITERIA_INFO } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type CommitteeRatingRow = Database["public"]["Tables"]["committee_ratings"]["Row"];

export function RatingAverageChart({ ratings }: { ratings: CommitteeRatingRow[] }) {
  const data = COMMITTEE_RATING_CRITERIA.map((criterion) => {
    const forCriterion = ratings.filter((r) => r.criterion === criterion);
    const average =
      forCriterion.length > 0 ? forCriterion.reduce((sum, r) => sum + r.score, 0) / forCriterion.length : 0;
    return { criterion: COMMITTEE_RATING_CRITERIA_INFO[criterion].label, average: Number(average.toFixed(2)) };
  });

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="criterion" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="average" name="Avg Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
