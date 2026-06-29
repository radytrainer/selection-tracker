"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getActiveCycle, listCycles } from "@/services/lookupService";
import { getSelectionProcessStats, type SelectionProcessStats } from "@/services/selectionProcessService";
import {
  ExamCentersCard,
  ExamResultsCard,
  InformationSessionsCard,
  InterviewCentersCard,
  InterviewResultsCard,
} from "@/components/selection-process/cards";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/hooks/useRole";
import { can } from "@/lib/rbac";

type Cycle = { id: string; year: number; name: string; status: string };

export default function SelectionProcessPage() {
  const { role } = useRole();
  const canEdit = can(role, "manageSelectionProcessStats");
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState<string>("");
  const [stats, setStats] = useState<SelectionProcessStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listCycles(), getActiveCycle()])
      .then(([allCycles, active]) => {
        setCycles(allCycles ?? []);
        setCycleId(active?.id ?? allCycles?.[0]?.id ?? "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load cycles"));
  }, []);

  const load = useCallback(() => {
    if (!cycleId) return;
    setLoading(true);
    return getSelectionProcessStats(cycleId)
      .then(setStats)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load selection process data"))
      .finally(() => setLoading(false));
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Selection Process</h1>
          <p className="text-sm text-muted-foreground">
            Recruitment funnel from information sessions through interview results.
          </p>
        </div>
        <Select value={cycleId} onValueChange={(value) => value && setCycleId(value)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select cycle">
              {(value: string) => cycles.find((c) => c.id === value)?.name ?? "Select cycle"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!cycleId ? (
        <p className="text-sm text-muted-foreground">No selection cycle found yet.</p>
      ) : loading || !stats ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InformationSessionsCard
            stats={stats.informationSessions}
            cycleId={cycleId}
            canEdit={canEdit}
            onSaved={load}
          />
          <ExamCentersCard stats={stats.examCenters} cycleId={cycleId} canEdit={canEdit} onSaved={load} />
          <ExamResultsCard stats={stats.examResults} cycleId={cycleId} canEdit={canEdit} onSaved={load} />
          <InterviewCentersCard
            stats={stats.interviewCenters}
            cycleId={cycleId}
            canEdit={canEdit}
            onSaved={load}
          />
          <InterviewResultsCard
            stats={stats.interviewResults}
            cycleId={cycleId}
            canEdit={canEdit}
            onSaved={load}
          />
        </div>
      )}
    </div>
  );
}
