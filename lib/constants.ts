/** Cookie holding the current Firebase ID token (httpOnly, set by /api/auth/session). */
export const ID_TOKEN_COOKIE = "fb_id_token";

export const APP_ROLES = [
  "super_admin",
  "program_manager",
  "selection_team",
  "interview_team",
  "home_visit_team",
  "committee_member",
  "ngo_partner",
  "donor",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const STUDENT_STATUSES = [
  "registered",
  "exam_completed",
  "interview_completed",
  "home_visit_completed",
  "committee_review",
  "selected",
  "waitlisted",
  "rejected",
  "dropped_out",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const OUTREACH_STATUSES = [
  "not_contacted",
  "contacted",
  "in_discussion",
  "active_partner",
  "inactive",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  not_contacted: "Not Contacted",
  contacted: "Contacted",
  in_discussion: "In Discussion",
  active_partner: "Active Partner",
  inactive: "Inactive",
};

/** Role landing page after login — keeps the dashboard route gating simple. */
export const ROLE_HOME: Record<AppRole, string> = {
  super_admin: "/dashboard",
  program_manager: "/dashboard",
  selection_team: "/students",
  interview_team: "/students",
  home_visit_team: "/students",
  committee_member: "/committee/queue",
  ngo_partner: "/ngos",
  donor: "/dashboard",
};
