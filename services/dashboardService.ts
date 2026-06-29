import { createClient } from "@/lib/supabase/client";

export type DashboardKpis = {
  totalStudents: number;
  femaleStudents: number;
  maleStudents: number;
  selectedStudents: number;
  partnerNgos: number;
  partnerSchools: number;
  provincesCovered: number;
};

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = createClient();

  const [studentsRes, ngosRes, schoolsRes] = await Promise.all([
    supabase
      .from("students")
      .select("gender, province_id, committee_decisions(decision)")
      .is("deleted_at", null),
    supabase.from("ngo_partners").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("school_partners").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (ngosRes.error) throw ngosRes.error;
  if (schoolsRes.error) throw schoolsRes.error;

  const rows = (studentsRes.data ?? []) as unknown as {
    gender: string;
    province_id: string | null;
    committee_decisions: { decision: string | null } | null;
  }[];

  const provinces = new Set(rows.map((r) => r.province_id).filter((id): id is string => Boolean(id)));

  return {
    totalStudents: rows.length,
    femaleStudents: rows.filter((r) => r.gender === "female").length,
    maleStudents: rows.filter((r) => r.gender === "male").length,
    selectedStudents: rows.filter((r) => r.committee_decisions?.decision === "selected").length,
    partnerNgos: ngosRes.count ?? 0,
    partnerSchools: schoolsRes.count ?? 0,
    provincesCovered: provinces.size,
  };
}

export type VisitorStat = { visitorName: string; studentCount: number };

/**
 * How many distinct students each staff member has visited and recorded a
 * social form for. Prefers the visitor's current full_name (via visitor_id,
 * 0026) over the free-text visitor_name still sitting on pre-0026 rows that
 * never got a visitor_id — those fall back to whatever name was typed in,
 * or "Unknown" if neither is set.
 */
export async function getVisitorStats(): Promise<VisitorStat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_assessments")
    .select("student_id, visitor_name, users(full_name)");
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    student_id: string;
    visitor_name: string | null;
    users: { full_name: string } | null;
  }[];

  const studentsByVisitor = new Map<string, Set<string>>();
  for (const row of rows) {
    const name = row.users?.full_name || row.visitor_name || "Unknown";
    const students = studentsByVisitor.get(name) ?? new Set<string>();
    students.add(row.student_id);
    studentsByVisitor.set(name, students);
  }

  return Array.from(studentsByVisitor.entries())
    .map(([visitorName, students]) => ({ visitorName, studentCount: students.size }))
    .sort((a, b) => b.studentCount - a.studentCount);
}
