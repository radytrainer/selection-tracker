import { createClient } from "@/lib/supabase/client";

export type DashboardStudent = {
  gender: string;
  province_name: string | null;
  ngo_name: string | null;
  decision: string | null;
};

export type DashboardData = {
  students: DashboardStudent[];
  partnerNgos: number;
  partnerSchools: number;
};

export type ProvinceStat = { provinceName: string; studentCount: number };
export type NgoTotalStat = { ngoName: string; studentCount: number };

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();

  const [studentsRes, ngosRes, schoolsRes] = await Promise.all([
    supabase
      .from("students")
      .select("gender, provinces(name_en), ngo_partners(organization_name), committee_decisions(decision)")
      .is("deleted_at", null),
    supabase.from("ngo_partners").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("school_partners").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (ngosRes.error) throw ngosRes.error;
  if (schoolsRes.error) throw schoolsRes.error;

  const students = ((studentsRes.data ?? []) as unknown as {
    gender: string;
    provinces: { name_en: string } | null;
    ngo_partners: { organization_name: string } | null;
    committee_decisions: { decision: string | null } | null;
  }[]).map((r) => ({
    gender: r.gender,
    province_name: r.provinces?.name_en ?? null,
    ngo_name: r.ngo_partners?.organization_name ?? null,
    decision: r.committee_decisions?.decision ?? null,
  }));

  return {
    students,
    partnerNgos: ngosRes.count ?? 0,
    partnerSchools: schoolsRes.count ?? 0,
  };
}

// Keep for backward compatibility if needed elsewhere
export type DashboardKpis = {
  totalStudents: number;
  femaleStudents: number;
  maleStudents: number;
  lgbtqiaStudents: number;
  selectedStudents: number;
  partnerNgos: number;
  partnerSchools: number;
  provincesCovered: number;
};

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
    .select("student_id, visitor_name, users(full_name), students(deleted_at)");
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    student_id: string;
    visitor_name: string | null;
    users: { full_name: string } | null;
    students: { deleted_at: string | null } | null;
  }[];

  const studentsByVisitor = new Map<string, Set<string>>();
  for (const row of rows) {
    // Skip assessments whose student has been deleted
    if (!row.students || row.students.deleted_at !== null) continue;
    const name = row.users?.full_name || row.visitor_name || "Unknown";
    const students = studentsByVisitor.get(name) ?? new Set<string>();
    students.add(row.student_id);
    studentsByVisitor.set(name, students);
  }

  return Array.from(studentsByVisitor.entries())
    .map(([visitorName, students]) => ({ visitorName, studentCount: students.size }))
    .sort((a, b) => b.studentCount - a.studentCount);
}
