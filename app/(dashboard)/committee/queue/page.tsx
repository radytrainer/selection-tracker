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

export default function CommitteeQueuePage() {
  const [queue, setQueue] = useState<CommitteeQueueItem[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {queue.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <Link href={`/students/${student.id}`} className="hover:underline">
                        {student.first_name} {student.last_name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {student.student_code} · {student.provinces?.name_en ?? "No province"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
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
                  </CardContent>
                </Card>
              ))}
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
