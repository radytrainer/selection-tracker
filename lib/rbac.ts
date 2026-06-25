import type { AppRole } from "@/lib/constants";

/**
 * UI-layer permission matrix mirroring docs/09-security.md §2.3. This is
 * NOT the security boundary — Supabase RLS (docs/04-schema.sql §14) is the
 * authoritative enforcement. This only drives what the UI shows/hides.
 */
export const CAPABILITIES = {
  manageUsers: ["super_admin"],
  manageCycles: ["super_admin", "program_manager"],
  managePartners: ["super_admin", "program_manager"],
  createEditStudents: ["super_admin", "program_manager", "selection_team"],
  enterExamScores: ["super_admin", "program_manager", "selection_team"],
  enterInterviewScores: ["super_admin", "program_manager", "interview_team"],
  enterHomeVisitData: ["super_admin", "program_manager", "home_visit_team"],
  recordCommitteeDecision: ["super_admin", "program_manager"],
  rateCommitteeCandidate: ["committee_member"],
  approveCommitteeDecision: ["super_admin", "program_manager"],
  viewAllStudentPii: [
    "super_admin",
    "program_manager",
    "selection_team",
    "interview_team",
    "home_visit_team",
    "committee_member",
  ],
  generateReports: ["super_admin", "program_manager", "selection_team", "committee_member"],
} as const satisfies Record<string, readonly AppRole[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: AppRole | null, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[capability] as readonly AppRole[]).includes(role);
}
