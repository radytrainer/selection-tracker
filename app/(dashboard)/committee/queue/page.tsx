"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw } from "lucide-react";
import {
  approveCommitteeDecision,
  listCommitteeQueue,
  listPendingApprovals,
  type CommitteeQueueItem,
  type PendingApproval,
} from "@/services/committeeService";
import { getMyProfile } from "@/services/userService";
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
import { CycleSelect } from "@/components/forms/CycleSelect";
import { useCycleFilter } from "@/hooks/useCycleFilter";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { can } from "@/lib/rbac";
import { CATEGORY_BADGE_CLASSES, CATEGORY_LABELS, type SocialFormCategory } from "@/features/social-form/scoring";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { getSignedStudentDocumentUrls, pickLatestPhotoPath } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

const RECOMMENDATION_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly recommends",
  recommend: "Recommends",
  neutral: "Neutral",
  not_recommend: "Does not recommend",
};

function ratingSummary(student: CommitteeQueueItem) {
  if (student.committee_ratings.length === 0) return "No ratings yet";
  const raters = new Set(student.committee_ratings.map((r) => r.rated_by)).size;
  const avg = student.committee_ratings.reduce((sum, r) => sum + r.score, 0) / student.committee_ratings.length;
  return `${avg.toFixed(1)}★ avg · ${raters} member${raters === 1 ? "" : "s"} rated`;
}

// home_visit_team doesn't decide — "Finished" clears their own cases from
// the active queue once they've seen the committee's ratings. Local-only
// (per browser); doesn't affect what selection_team/super_admin see.
const FINISHED_STORAGE_KEY = "committee-queue-finished-cases";

export default function CommitteeQueuePage() {
  const { user } = useAuth();
  const { role } = useRole();
  const { cycles, cycleId, setCycleId } = useCycleFilter();
  const canSeeQueue = can(role, "viewCommitteeRatings") || can(role, "rateCommitteeCandidate");
  const isHomeVisit = role === "home_visit_team";
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [queue, setQueue] = useState<CommitteeQueueItem[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [finishedIds, setFinishedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user.uid).then((profile) => setMyUserId(profile?.id ?? null));
  }, [user]);

  useEffect(() => {
    if (!isHomeVisit) return;
    try {
      setFinishedIds(JSON.parse(localStorage.getItem(FINISHED_STORAGE_KEY) ?? "[]"));
    } catch {
      setFinishedIds([]);
    }
  }, [isHomeVisit]);

  function isOwnStudent(student: CommitteeQueueItem) {
    return myUserId != null && student.social_assessments.some((sa) => sa.visitor_id === myUserId);
  }

  function handleFinish(studentId: string) {
    const next = [...finishedIds, studentId];
    setFinishedIds(next);
    localStorage.setItem(FINISHED_STORAGE_KEY, JSON.stringify(next));
    toast.success("Case marked as finished");
  }

  function handleUnfinish(studentId: string) {
    const next = finishedIds.filter((id) => id !== studentId);
    setFinishedIds(next);
    localStorage.setItem(FINISHED_STORAGE_KEY, JSON.stringify(next));
    toast.success("Case returned to queue");
  }

  const activeQueue = isHomeVisit ? queue.filter((s) => !finishedIds.includes(s.id)) : queue;
  const finishedQueue = isHomeVisit ? queue.filter((s) => finishedIds.includes(s.id)) : [];

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([listCommitteeQueue(cycleId || undefined), listPendingApprovals(cycleId || undefined)])
      .then(async ([q, a]) => {
        setQueue(q);
        setApprovals(a);
        const photoPaths = q.map((s) => pickLatestPhotoPath(s.student_documents)).filter((p): p is string => !!p);
        setPhotoUrls(await getSignedStudentDocumentUrls(photoPaths));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load committee queue"))
      .finally(() => setLoading(false));
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Committee Queue</h1>
          <p className="text-sm text-muted-foreground">
            Students ready for a final decision, and decisions awaiting sign-off.
          </p>
        </div>
        <CycleSelect cycles={cycles} value={cycleId} allowAll onChange={setCycleId} className="w-48" />
      </div>

      {canSeeQueue && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Awaiting Decision ({activeQueue.length})</h2>
          {activeQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students waiting on a committee decision.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeQueue.map((student) => {
                const socialAssessment = student.social_assessments[0] ?? null;
                const photoPath = pickLatestPhotoPath(student.student_documents);
                const initials = `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase();
                const canFinishThis = isHomeVisit && isOwnStudent(student);

                return (
                  <Link key={student.id} href={`/committee/${student.id}`} className="block">
                    <Card className="h-full transition-colors hover:border-primary">
                      <CardHeader className="flex flex-row items-start gap-3">
                        <StudentAvatar
                          photoPath={photoPath}
                          signedUrl={photoPath ? photoUrls[photoPath] ?? null : null}
                          initials={initials}
                          size="size-10"
                        />
                        <div>
                          <CardTitle className="text-base hover:underline">
                            {student.first_name} {student.last_name}
                          </CardTitle>
                          <CardDescription>
                            {student.student_code} · {student.provinces?.name_en ?? "No province"} ·{" "}
                            {student.school_partners?.school_name ?? "No school"}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {socialAssessment ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                CATEGORY_BADGE_CLASSES[socialAssessment.category as SocialFormCategory],
                              )}
                            >
                              {CATEGORY_LABELS[socialAssessment.category as SocialFormCategory]} · {socialAssessment.final_score}
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">No social form</span>
                          )}
                          <span>GPA: <span className="text-foreground">{student.gpa ?? "—"}</span></span>
                        </div>
                        <p>
                          Exam:{" "}
                          <span className="text-foreground">
                            {student.exam_results ? student.exam_results.total_score : "Pending"}
                          </span>{" "}
                          · Interview:{" "}
                          <span className="text-foreground">
                            {student.interviews?.recommendation
                              ? RECOMMENDATION_LABELS[student.interviews.recommendation]
                              : "Pending"}
                          </span>
                        </p>
                        <p className="font-medium text-foreground">{ratingSummary(student)}</p>
                      </CardContent>
                      {canFinishThis && (
                        <CardContent className="pt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinish(student.id);
                            }}
                          >
                            <CheckCircle2 className="size-3.5" />
                            Finished
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isHomeVisit && finishedQueue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground">Finished Cases ({finishedQueue.length})</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {finishedQueue.map((student) => {
              const socialAssessment = student.social_assessments[0] ?? null;
              const photoPath = pickLatestPhotoPath(student.student_documents);
              const initials = `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase();

              return (
                <Link key={student.id} href={`/committee/${student.id}`} className="block opacity-60">
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader className="flex flex-row items-start gap-3">
                      <StudentAvatar
                        photoPath={photoPath}
                        signedUrl={photoPath ? photoUrls[photoPath] ?? null : null}
                        initials={initials}
                        size="size-10"
                      />
                      <div>
                        <CardTitle className="text-base hover:underline">
                          {student.first_name} {student.last_name}
                        </CardTitle>
                        <CardDescription>
                          {student.student_code} · {student.provinces?.name_en ?? "No province"} ·{" "}
                          {student.school_partners?.school_name ?? "No school"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {socialAssessment ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              CATEGORY_BADGE_CLASSES[socialAssessment.category as SocialFormCategory],
                            )}
                          >
                            {CATEGORY_LABELS[socialAssessment.category as SocialFormCategory]} · {socialAssessment.final_score}
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">No social form</span>
                        )}
                        <span>GPA: <span className="text-foreground">{student.gpa ?? "—"}</span></span>
                      </div>
                      <p className="font-medium text-foreground">{ratingSummary(student)}</p>
                    </CardContent>
                    <CardContent className="pt-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full gap-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnfinish(student.id);
                        }}
                      >
                        <RotateCcw className="size-3.5" />
                        Undo Finish
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
                        <Link href={`/committee/${approval.students.id}`} className="hover:underline">
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
