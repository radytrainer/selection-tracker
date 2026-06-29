"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatsEditDialog, type StatsFieldGroup } from "@/components/selection-process/StatsEditDialog";
import {
  saveExamCenterStats,
  saveExamResultStats,
  saveInformationSessionStats,
  saveInterviewCenterStats,
  saveInterviewResultStats,
  type ExamCenterStats,
  type ExamResultStats,
  type InformationSessionStats,
  type InterviewCenterStats,
  type InterviewResultStats,
} from "@/services/selectionProcessService";

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Section heading inside a card body, e.g. "Attendance" / "Applicants". */
function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-muted-foreground">{children}</p>;
}

function Bullet({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={cn("text-sm", className)}>{children}</li>;
}

/** The "N not yet done" (orange) vs "All done" (green) pattern repeated across every card. */
function GapLine({ count, missingLabel, allDoneLabel }: { count: number; missingLabel: string; allDoneLabel: string }) {
  return count > 0 ? (
    <p className="text-sm font-medium text-amber-600">
      {count} {missingLabel}
    </p>
  ) : (
    <p className="text-sm font-medium text-green-600">{allDoneLabel}</p>
  );
}

function SectionCardShell({
  title,
  canEdit,
  editTitle,
  groups,
  values,
  onSave,
  children,
}: {
  title: string;
  canEdit: boolean;
  editTitle: string;
  groups: StatsFieldGroup[];
  values: Record<string, unknown>;
  onSave: (values: Record<string, number>) => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {canEdit && (
          <CardAction>
            <StatsEditDialog title={editTitle} groups={groups} values={values} onSave={onSave} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function InformationSessionsCard({
  stats,
  cycleId,
  canEdit,
  onSaved,
}: {
  stats: InformationSessionStats | null;
  cycleId: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const s = stats ?? {
    sessions_done: 0,
    sessions_planned: 0,
    sessions_without_date: 0,
    sessions_without_hosting_partner: 0,
    attendees_expected_boys: 0,
    attendees_expected_girls: 0,
    attendees_actual_boys: 0,
    attendees_actual_girls: 0,
    additional_expected_boys: 0,
    additional_expected_girls: 0,
    sessions_without_expected_number: 0,
    applicants_total: 0,
    applicants_girls: 0,
    applicants_boys: 0,
  };
  const sessionsTotal = s.sessions_done + s.sessions_planned + s.sessions_without_date;
  const expectedTotal = s.attendees_expected_boys + s.attendees_expected_girls;
  const actualTotal = s.attendees_actual_boys + s.attendees_actual_girls;
  const additionalTotal = s.additional_expected_boys + s.additional_expected_girls;

  const groups: StatsFieldGroup[] = [
    {
      title: "Sessions",
      fields: [
        { key: "sessions_done", label: "Done" },
        { key: "sessions_planned", label: "Planned" },
        { key: "sessions_without_date", label: "Without date yet" },
        { key: "sessions_without_hosting_partner", label: "Without hosting partner" },
      ],
    },
    {
      title: "Attendance",
      fields: [
        { key: "attendees_expected_boys", label: "Expected — boys" },
        { key: "attendees_expected_girls", label: "Expected — girls" },
        { key: "attendees_actual_boys", label: "So far — boys" },
        { key: "attendees_actual_girls", label: "So far — girls" },
        { key: "additional_expected_boys", label: "Additional expected — boys" },
        { key: "additional_expected_girls", label: "Additional expected — girls" },
        { key: "sessions_without_expected_number", label: "Sessions without expected number" },
      ],
    },
    {
      title: "Applicants",
      fields: [
        { key: "applicants_total", label: "Total applicants" },
        { key: "applicants_girls", label: "Girls" },
        { key: "applicants_boys", label: "Boys" },
      ],
    },
  ];

  return (
    <SectionCardShell
      title="Information Sessions"
      canEdit={canEdit}
      editTitle="Information Sessions"
      groups={groups}
      values={s}
      onSave={async (values) => {
        await saveInformationSessionStats(cycleId, values);
        onSaved();
      }}
    >
      <div>
        <p className="text-lg font-semibold">Sessions: {sessionsTotal}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <Bullet>{s.sessions_done} done</Bullet>
          <Bullet>{s.sessions_planned} planned</Bullet>
          <Bullet className={s.sessions_without_date > 0 ? "text-amber-600" : undefined}>
            {s.sessions_without_date} without date yet
          </Bullet>
        </ul>
        <div className="mt-1.5">
          <GapLine
            count={s.sessions_without_hosting_partner}
            missingLabel="sessions without hosting partner"
            allDoneLabel="All sessions have a hosting partner"
          />
        </div>
      </div>

      <div>
        <SubHeading>Attendance</SubHeading>
        <p className="mt-1 text-sm">
          {expectedTotal} attendees expected ({s.attendees_expected_boys} boys and {s.attendees_expected_girls} girls)
        </p>
        <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
          <Bullet>
            {actualTotal} attendees so far ({s.attendees_actual_boys} boys and {s.attendees_actual_girls} girls)
          </Bullet>
          <Bullet>
            {additionalTotal} additional expected ({s.additional_expected_boys} boys and {s.additional_expected_girls}{" "}
            girls)
          </Bullet>
        </ul>
        <div className="mt-1.5">
          <GapLine
            count={s.sessions_without_expected_number}
            missingLabel="sessions without expected number"
            allDoneLabel="All sessions have an expected number"
          />
        </div>
      </div>

      <div>
        <SubHeading>Applicants</SubHeading>
        <p className="mt-1 text-sm">
          {s.applicants_total} applicants ({pct(s.applicants_total, actualTotal)}% of attendance)
        </p>
        <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
          <Bullet>
            {s.applicants_girls} girls ({pct(s.applicants_girls, s.applicants_total)}%)
          </Bullet>
          <Bullet>
            {s.applicants_boys} boys ({pct(s.applicants_boys, s.applicants_total)}%)
          </Bullet>
        </ul>
      </div>
    </SectionCardShell>
  );
}

export function ExamCentersCard({
  stats,
  cycleId,
  canEdit,
  onSaved,
}: {
  stats: ExamCenterStats | null;
  cycleId: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const s = stats ?? {
    centers_total: 0,
    sessions_done: 0,
    sessions_not_done: 0,
    info_sessions_not_linked: 0,
    applicants_total: 0,
    applicants_not_assigned: 0,
    applicants_without_schedule: 0,
  };

  const groups: StatsFieldGroup[] = [
    {
      title: "Exam Centers",
      fields: [
        { key: "centers_total", label: "Total centers" },
        { key: "sessions_done", label: "Sessions done" },
        { key: "sessions_not_done", label: "Sessions not done" },
      ],
    },
    {
      title: "Information Sessions",
      fields: [{ key: "info_sessions_not_linked", label: "Not linked to an exam center" }],
    },
    {
      title: "Applicants",
      fields: [
        { key: "applicants_total", label: "Total applicants" },
        { key: "applicants_not_assigned", label: "Not assigned to a center" },
        { key: "applicants_without_schedule", label: "Without a schedule" },
      ],
    },
  ];

  return (
    <SectionCardShell
      title="Exam Centers"
      canEdit={canEdit}
      editTitle="Exam Centers"
      groups={groups}
      values={s}
      onSave={async (values) => {
        await saveExamCenterStats(cycleId, values);
        onSaved();
      }}
    >
      <div>
        <p className="text-lg font-semibold">{s.centers_total} exam centers</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <Bullet>{s.sessions_done} sessions already done</Bullet>
          <Bullet className={s.sessions_not_done > 0 ? "text-amber-600" : undefined}>
            {s.sessions_not_done} session(s) scheduled not yet done
          </Bullet>
        </ul>
      </div>

      <div>
        <SubHeading>Information Sessions</SubHeading>
        <div className="mt-1">
          <GapLine
            count={s.info_sessions_not_linked}
            missingLabel="not linked to an exam center"
            allDoneLabel="All information sessions are linked to an exam center"
          />
        </div>
      </div>

      <div>
        <SubHeading>Applicants</SubHeading>
        <p className="mt-1 text-sm">{s.applicants_total} applicant(s)</p>
        <ul className="mt-0.5 space-y-0.5 pl-0">
          <li>
            <GapLine
              count={s.applicants_not_assigned}
              missingLabel="not assigned to an exam center"
              allDoneLabel="All are assigned to an exam center"
            />
          </li>
          <li>
            <GapLine
              count={s.applicants_without_schedule}
              missingLabel="without a schedule"
              allDoneLabel="All have a schedule"
            />
          </li>
        </ul>
      </div>
    </SectionCardShell>
  );
}

export function ExamResultsCard({
  stats,
  cycleId,
  canEdit,
  onSaved,
}: {
  stats: ExamResultStats | null;
  cycleId: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const s = stats ?? {
    attended: 0,
    absent: 0,
    partially_attended: 0,
    still_to_be_done: 0,
    passed: 0,
    passed_girls: 0,
    passed_boys: 0,
  };

  const groups: StatsFieldGroup[] = [
    {
      title: "Attendance",
      fields: [
        { key: "attended", label: "Attended" },
        { key: "absent", label: "Absent(s)" },
        { key: "partially_attended", label: "Partially attended" },
        { key: "still_to_be_done", label: "Still to be done" },
      ],
    },
    {
      title: "Passers",
      fields: [
        { key: "passed", label: "Passed" },
        { key: "passed_girls", label: "Passed — girls" },
        { key: "passed_boys", label: "Passed — boys" },
      ],
    },
  ];

  return (
    <SectionCardShell
      title="Exam Results"
      canEdit={canEdit}
      editTitle="Exam Results"
      groups={groups}
      values={s}
      onSave={async (values) => {
        await saveExamResultStats(cycleId, values);
        onSaved();
      }}
    >
      <div>
        <SubHeading>Attendance</SubHeading>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <Bullet>{s.attended} attended</Bullet>
          <Bullet>{s.absent} absent(s)</Bullet>
          <Bullet>{s.partially_attended} partially attended</Bullet>
          <Bullet className={s.still_to_be_done > 0 ? "text-red-600 font-medium" : undefined}>
            {s.still_to_be_done} still to be done
          </Bullet>
        </ul>
      </div>

      <div>
        <SubHeading>Passers</SubHeading>
        <p className="mt-1 text-sm">
          {s.passed}/{s.attended} applicants passed
        </p>
        <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
          <Bullet>
            {s.passed_girls} ({pct(s.passed_girls, s.passed)}%) are girls
          </Bullet>
          <Bullet>
            {s.passed_boys} ({pct(s.passed_boys, s.passed)}%) are boys
          </Bullet>
        </ul>
      </div>
    </SectionCardShell>
  );
}

export function InterviewCentersCard({
  stats,
  cycleId,
  canEdit,
  onSaved,
}: {
  stats: InterviewCenterStats | null;
  cycleId: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const s = stats ?? {
    centers_total: 0,
    sessions_done: 0,
    sessions_not_done: 0,
    exam_centers_not_linked: 0,
    applicants_eligible: 0,
    applicants_not_assigned: 0,
    applicants_without_schedule: 0,
  };

  const groups: StatsFieldGroup[] = [
    {
      title: "Interview Centers",
      fields: [
        { key: "centers_total", label: "Total centers" },
        { key: "sessions_done", label: "Sessions done" },
        { key: "sessions_not_done", label: "Sessions not done" },
      ],
    },
    {
      title: "From Exam Centers",
      fields: [{ key: "exam_centers_not_linked", label: "Not linked to an interview center" }],
    },
    {
      title: "Applicants",
      fields: [
        { key: "applicants_eligible", label: "Eligible for interview" },
        { key: "applicants_not_assigned", label: "Not assigned to a center" },
        { key: "applicants_without_schedule", label: "Without a schedule" },
      ],
    },
  ];

  return (
    <SectionCardShell
      title="Interview Centers"
      canEdit={canEdit}
      editTitle="Interview Centers"
      groups={groups}
      values={s}
      onSave={async (values) => {
        await saveInterviewCenterStats(cycleId, values);
        onSaved();
      }}
    >
      <div>
        <p className="text-lg font-semibold">{s.centers_total} interview centers</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <Bullet>{s.sessions_done} sessions already done</Bullet>
          <Bullet className={s.sessions_not_done > 0 ? "text-amber-600" : undefined}>
            {s.sessions_not_done} session(s) scheduled not yet done
          </Bullet>
        </ul>
      </div>

      <div>
        <SubHeading>From Exam Centers</SubHeading>
        <div className="mt-1">
          <GapLine
            count={s.exam_centers_not_linked}
            missingLabel="not linked to an interview center"
            allDoneLabel="All exam centers are linked to an interview center"
          />
        </div>
      </div>

      <div>
        <SubHeading>Applicants</SubHeading>
        <p className="mt-1 text-sm">{s.applicants_eligible} applicant(s) eligible for interview</p>
        <ul className="mt-0.5 space-y-0.5 pl-0">
          <li>
            <GapLine
              count={s.applicants_not_assigned}
              missingLabel="not assigned to an interview center"
              allDoneLabel="All are assigned to an interview center"
            />
          </li>
          <li>
            <GapLine
              count={s.applicants_without_schedule}
              missingLabel="without a schedule"
              allDoneLabel="All assigned have a schedule"
            />
          </li>
        </ul>
      </div>
    </SectionCardShell>
  );
}

export function InterviewResultsCard({
  stats,
  cycleId,
  canEdit,
  onSaved,
}: {
  stats: InterviewResultStats | null;
  cycleId: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const s = stats ?? {
    attended: 0,
    absent: 0,
    still_to_be_done: 0,
    passed: 0,
    passed_girls: 0,
    passed_boys: 0,
  };

  const groups: StatsFieldGroup[] = [
    {
      title: "Attendance",
      fields: [
        { key: "attended", label: "Attended" },
        { key: "absent", label: "Absent(s)" },
        { key: "still_to_be_done", label: "Still to be done" },
      ],
    },
    {
      title: "Passers",
      fields: [
        { key: "passed", label: "Passed" },
        { key: "passed_girls", label: "Passed — girls" },
        { key: "passed_boys", label: "Passed — boys" },
      ],
    },
  ];

  return (
    <SectionCardShell
      title="Interview Results"
      canEdit={canEdit}
      editTitle="Interview Results"
      groups={groups}
      values={s}
      onSave={async (values) => {
        await saveInterviewResultStats(cycleId, values);
        onSaved();
      }}
    >
      <div>
        <SubHeading>Attendance</SubHeading>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <Bullet>{s.attended} attended</Bullet>
          <Bullet>{s.absent} absent(s)</Bullet>
          <Bullet className={s.still_to_be_done > 0 ? "text-red-600 font-medium" : undefined}>
            {s.still_to_be_done} still to be done
          </Bullet>
        </ul>
      </div>

      <div>
        <SubHeading>Passers</SubHeading>
        <p className="mt-1 text-sm">
          {s.passed}/{s.attended} applicants passed
        </p>
        <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
          <Bullet>
            {s.passed_girls} ({pct(s.passed_girls, s.passed)}%) are girls
          </Bullet>
          <Bullet>
            {s.passed_boys} ({pct(s.passed_boys, s.passed)}%) are boys
          </Bullet>
        </ul>
      </div>
    </SectionCardShell>
  );
}
