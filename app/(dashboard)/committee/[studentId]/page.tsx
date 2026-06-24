"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  getCommitteeDossier,
  recordCommitteeDecision,
  type CommitteeDossier,
} from "@/services/committeeService";
import { getMyProfile } from "@/services/userService";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { can } from "@/lib/rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGate } from "@/components/layout/RoleGate";
import { CommitteeRatingPanel } from "@/components/committee/CommitteeRatingPanel";
import { ExamScoreChart } from "@/components/committee/ExamScoreChart";
import { InterviewScoreChart } from "@/components/committee/InterviewScoreChart";
import { RatingAverageChart } from "@/components/committee/RatingAverageChart";
import { CATEGORY_LABELS, type SocialFormCategory } from "@/features/social-form/scoring";

const RECOMMENDATION_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly Recommend",
  recommend: "Recommend",
  neutral: "Neutral",
  not_recommend: "Do Not Recommend",
};

export default function CommitteeDossierPage() {
  const params = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const { role } = useRole();
  const [student, setStudent] = useState<CommitteeDossier | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [decidingDecision, setDecidingDecision] = useState<string | null>(null);

  const load = useCallback(() => {
    return getCommitteeDossier(params.studentId)
      .then(setStudent)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dossier"))
      .finally(() => setLoading(false));
  }, [params.studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user.uid).then((profile) => setMyUserId(profile?.id ?? null));
  }, [user]);

  async function handleDecision(decision: "selected" | "waitlisted" | "rejected") {
    if (!student) return;
    setDecidingDecision(decision);
    try {
      await recordCommitteeDecision({ studentId: student.id, cycleId: student.cycle_id, decision });
      toast.success(`${student.first_name} ${student.last_name} marked ${decision}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record decision");
    } finally {
      setDecidingDecision(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return <p className="text-sm text-muted-foreground">Student not found.</p>;
  }

  const socialAssessment = student.social_assessments[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/committee/queue" className="text-sm text-muted-foreground hover:underline">
            ← Back to Committee Queue
          </Link>
          <h1 className="text-2xl font-semibold">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {student.student_code} ·{" "}
            <Link href={`/students/${student.id}`} className="hover:underline">
              View full profile
            </Link>
          </p>
        </div>
        <Badge>{student.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Gender: <span className="capitalize">{student.gender}</span></p>
            <p>Province: {student.provinces?.name_en ?? "—"}</p>
            <p>School: {student.school_partners?.school_name ?? "—"}</p>
            <p>GPA: {student.gpa ?? "—"}</p>
            <p>
              Social form:{" "}
              {socialAssessment
                ? `${CATEGORY_LABELS[socialAssessment.category as SocialFormCategory]} (${socialAssessment.final_score})`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exam</CardTitle>
            <CardDescription>
              {student.exam_results
                ? `Total ${student.exam_results.total_score} / 400 · rank ${student.exam_results.rank_in_cycle ?? "—"} · ${student.exam_results.pass_status}`
                : "Not yet entered"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.exam_results ? (
              <ExamScoreChart
                math={student.exam_results.math_score}
                english={student.exam_results.english_score}
                logic={student.exam_results.logic_score}
                computer={student.exam_results.computer_score}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No exam scores yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview</CardTitle>
            <CardDescription>
              {student.interviews?.recommendation
                ? RECOMMENDATION_LABELS[student.interviews.recommendation]
                : "Not yet entered"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.interviews ? (
              <>
                <InterviewScoreChart
                  communication={student.interviews.communication_score ?? 0}
                  leadership={student.interviews.leadership_score ?? 0}
                  motivation={student.interviews.motivation_score ?? 0}
                  confidence={student.interviews.confidence_score ?? 0}
                  criticalThinking={student.interviews.critical_thinking_score ?? 0}
                />
                {student.interviews.comments && (
                  <p className="text-sm text-muted-foreground">{student.interviews.comments}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No interview yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Social Form</CardTitle>
            <CardDescription>{student.social_assessments.length} visit(s) recorded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.social_assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No social form yet.</p>
            ) : (
              student.social_assessments.map((assessment) => (
                <div key={assessment.id} className="space-y-1 border-b pb-2 text-sm last:border-0">
                  <p className="font-medium">Visit #{assessment.visit_number}</p>
                  <p>Housing: {assessment.housing_type_band?.replace(/_/g, " ") ?? "—"}</p>
                  <p>Income Band: {assessment.income_band?.replace(/_/g, "-") ?? "—"}</p>
                  <p>
                    Final Score: {assessment.final_score} ·{" "}
                    {CATEGORY_LABELS[assessment.category as SocialFormCategory]}
                  </p>
                  <p>Poverty Certificate: {assessment.poverty_certificate || "—"}</p>
                  {assessment.visitor_comments && <p>Notes: {assessment.visitor_comments}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Committee Ratings</CardTitle>
            <CardDescription>Each member rates independently — average shown live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RatingAverageChart ratings={student.committee_ratings} />
            <CommitteeRatingPanel
              studentId={student.id}
              cycleId={student.cycle_id}
              ratings={student.committee_ratings}
              myUserId={myUserId}
              canRate={can(role, "recordCommitteeDecision")}
              onRated={load}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
        </CardHeader>
        <CardContent>
          {student.committee_decisions?.decision ? (
            <p className="text-sm">
              Decision: <span className="font-medium capitalize">{student.committee_decisions.decision}</span> on{" "}
              {student.committee_decisions.decision_date} · Approval:{" "}
              <span className="capitalize">{student.committee_decisions.approval_status}</span>
            </p>
          ) : student.status !== "committee_review" ? (
            <p className="text-sm text-muted-foreground">
              This case hasn&apos;t been sent to committee yet.{" "}
              <Link href={`/students/${student.id}`} className={buttonVariants({ variant: "link", className: "px-0" })}>
                Continue the pipeline
              </Link>
            </p>
          ) : (
            <RoleGate capability="recordCommitteeDecision">
              <div className="flex gap-2">
                <Button disabled={decidingDecision !== null} onClick={() => handleDecision("selected")}>
                  Select
                </Button>
                <Button
                  variant="outline"
                  disabled={decidingDecision !== null}
                  onClick={() => handleDecision("waitlisted")}
                >
                  Waitlist
                </Button>
                <Button
                  variant="outline"
                  disabled={decidingDecision !== null}
                  onClick={() => handleDecision("rejected")}
                >
                  Reject
                </Button>
              </div>
            </RoleGate>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
