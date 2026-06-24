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
