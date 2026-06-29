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
  // Separate from createEditStudents so home_visit_team gets the button
  // without also gaining general create/edit/delete rights. They're further
  // restricted server-side (0026) to only students whose social form they
  // themselves recorded — this list alone doesn't capture that row-level rule.
  sendToCommittee: ["super_admin", "program_manager", "selection_team", "home_visit_team"],
  enterExamScores: ["super_admin", "program_manager", "selection_team"],
  enterInterviewScores: ["super_admin", "program_manager", "interview_team"],
  enterHomeVisitData: ["super_admin", "program_manager", "home_visit_team"],
  recordCommitteeDecision: ["super_admin", "program_manager", "selection_team"],
  rateCommitteeCandidate: ["committee_member"],
  // Read-only oversight of how the committee voted (distribution, not who
  // voted what) — not the same as recordCommitteeDecision, which is the
  // actual Select/Waitlist/Reject/Eliminate power. home_visit_team gets this
  // instead of rateCommitteeCandidate — they observe the committee's vote
  // and mark their own case as done, but selection_team makes the call.
  viewCommitteeRatings: ["super_admin", "program_manager", "selection_team", "home_visit_team"],
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
