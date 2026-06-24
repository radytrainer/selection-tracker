"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  approveCommitteeDecision,
  listCommitteeQueue,
  listPendingApprovals,
  recordCommitteeDecision,
  type CommitteeQueueItem,
  type PendingApproval,
} from "@/services/committeeService";
import { getMyProfile } from "@/services/userService";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGate } from "@/components/layout/RoleGate";
import { CommitteeRatingPanel } from "@/components/committee/CommitteeRatingPanel";

const RECOMMENDATION_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly recommends",
  recommend: "Recommends",
  neutral: "Neutral",
  not_recommend: "Does not recommend",
};

function formatUsd(value: number | null) {
  return value != null ? `$${value.toLocaleString()}/mo` : "Not recorded";
}

export default function CommitteeQueuePage() {
  const { user } = useAuth();
  const { role } = useRole();
  const [queue, setQueue] = useState<CommitteeQueueItem[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([listCommitteeQueue(), listPendingApprovals()])
      .then(([q, a]) => {
        setQueue(q);
        setApprovals(a);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load committee queue"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user.uid).then((profile) => setMyUserId(profile?.id ?? null));
  }, [user]);

  async function handleDecision(student: CommitteeQueueItem, decision: "selected" | "waitlisted" | "rejected") {
    setBusyId(student.id);
    try {
      await recordCommitteeDecision({ studentId: student.id, cycleId: student.cycle_id, decision });
      toast.success(`${student.first_name} ${student.last_name} marked ${decision}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record decision");
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproval(decisionId: string, approve: boolean) {
    setBusyId(decisionId);
    try {
      await approveCommitteeDecision(decisionId, approve);
      toast.success(approve ? "Decision approved" : "Decision sent back");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update approval");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Committee Queue</h1>
        <p className="text-sm text-muted-foreground">
          Students ready for a final decision, and decisions awaiting sign-off.
        </p>
      </div>

      <RoleGate capability="recordCommitteeDecision">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Awaiting Decision ({queue.length})</h2>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students waiting on a committee decision.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {queue.map((student) => {
                const homeVisit = student.home_visits[0] ?? null;
                const familyIncome = homeVisit?.family_income ?? student.family_income_monthly;

                return (
                  <Card key={student.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        <Link href={`/students/${student.id}`} className="hover:underline">
                          {student.first_name} {student.last_name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {student.student_code} · {student.provinces?.name_en ?? "No province"} ·{" "}
                        {student.school_partners?.school_name ?? "No school"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p>
                          Family income: <span className="text-foreground">{formatUsd(familyIncome)}</span>
                        </p>
                        <p>
                          GPA: <span className="text-foreground">{student.gpa ?? "—"}</span>
                        </p>
                        <p>
                          Exam:{" "}
                          <span className="text-foreground">
                            {student.exam_results
                              ? `${student.exam_results.total_score} (rank ${student.exam_results.rank_in_cycle ?? "—"}, ${student.exam_results.pass_status})`
                              : "Pending"}
                          </span>
                        </p>
                        <p>
                          Interview:{" "}
                          <span className="text-foreground">
                            {student.interviews?.recommendation
                              ? RECOMMENDATION_LABELS[student.interviews.recommendation]
                              : "Pending"}
                          </span>
                        </p>
                        <p className="col-span-2">
                          Home visit:{" "}
                          <span className="text-foreground">
                            {homeVisit?.recommendation ? RECOMMENDATION_LABELS[homeVisit.recommendation] : "Pending"}
                          </span>
                          {homeVisit?.family_condition_notes && ` — ${homeVisit.family_condition_notes}`}
                        </p>
                      </div>

                      <CommitteeRatingPanel
                        studentId={student.id}
                        cycleId={student.cycle_id}
                        ratings={student.committee_ratings}
                        myUserId={myUserId}
                        canRate={can(role, "recordCommitteeDecision")}
                        onRated={load}
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === student.id}
                          onClick={() => handleDecision(student, "selected")}
                        >
                          Select
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === student.id}
                          onClick={() => handleDecision(student, "waitlisted")}
                        >
                          Waitlist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === student.id}
                          onClick={() => handleDecision(student, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </RoleGate>

      <RoleGate capability="approveCommitteeDecision">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Awaiting Approval ({approvals.length})</h2>
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No decisions waiting on approval.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvals.map((approval) => (
                <Card key={approval.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {approval.students ? (
                        <Link href={`/students/${approval.students.id}`} className="hover:underline">
                          {approval.students.first_name} {approval.students.last_name}
                        </Link>
                      ) : (
                        "Unknown student"
                      )}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      Decision: {approval.decision ?? "—"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === approval.id}
                      onClick={() => handleApproval(approval.id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === approval.id}
                      onClick={() => handleApproval(approval.id, false)}
                    >
                      Send Back
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </RoleGate>
    </div>
  );
}
