import { createClient } from "@/lib/supabase/client";

export type ProvinceStats = {
  provinceId: string;
  code: string;
  nameEn: string;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  otherStudents: number;
  examCompleted: number;
  interviewCompleted: number;
  homeVisitCompleted: number;
  selectedStudents: number;
  ngoStudents: number;
  ngoMaleStudents: number;
  ngoFemaleStudents: number;
  nonNgoStudents: number;
  nonNgoMaleStudents: number;
  nonNgoFemaleStudents: number;
};

type StudentAggRow = {
  id: string;
  gender: string;
  province_id: string | null;
  referred_by_ngo_id: string | null;
  // exam_results/interviews/committee_decisions embed as a single object (or
  // null) rather than an array: their FK to students carries a `unique`
  // constraint, so PostgREST treats the relationship as to-one.
  // social_assessments has no such constraint (multiple visits per
  // student), so it stays an array.
  exam_results: { id: string } | null;
  interviews: { id: string } | null;
  social_assessments: { id: string }[];
  committee_decisions: { decision: string | null } | null;
};

/**
 * Computed client-side from `students` (left-join semantics achieved by
 * starting from the full `provinces` list and defaulting absent provinces
 * to zero) rather than the `mv_province_stats` materialized view, so the
 * map is always live without depending on a refresh schedule. Revisit via
 * an RPC/the materialized view once volume makes this too slow client-side
 * (see docs/12-future-enhancements.md).
 */
export async function getProvinceStats(cycleId?: string): Promise<ProvinceStats[]> {
  const supabase = createClient();

  const { data: provinces, error: provincesError } = await supabase
    .from("provinces")
    .select("id, code, name_en");
  if (provincesError) throw provincesError;

  let studentQuery = supabase
    .from("students")
    .select(
      "id, gender, province_id, referred_by_ngo_id, exam_results(id), interviews(id), social_assessments(id), committee_decisions(decision)",
    )
    .is("deleted_at", null);
  if (cycleId) studentQuery = studentQuery.eq("cycle_id", cycleId);

  const { data: students, error: studentsError } = await studentQuery;
  if (studentsError) throw studentsError;

  const byProvince = new Map<string, StudentAggRow[]>();
  for (const student of (students ?? []) as unknown as StudentAggRow[]) {
    if (!student.province_id) continue;
    const list = byProvince.get(student.province_id) ?? [];
    list.push(student);
    byProvince.set(student.province_id, list);
  }

  return (provinces ?? []).map((province) => {
    const rows = byProvince.get(province.id) ?? [];
    const ngoRows = rows.filter((r) => r.referred_by_ngo_id);
    const nonNgoRows = rows.filter((r) => !r.referred_by_ngo_id);
    return {
      provinceId: province.id,
      code: province.code,
      nameEn: province.name_en,
      totalStudents: rows.length,
      maleStudents: rows.filter((r) => r.gender === "male").length,
      femaleStudents: rows.filter((r) => r.gender === "female").length,
      otherStudents: rows.filter((r) => r.gender !== "male" && r.gender !== "female").length,
      examCompleted: rows.filter((r) => r.exam_results).length,
      interviewCompleted: rows.filter((r) => r.interviews).length,
      homeVisitCompleted: rows.filter((r) => r.social_assessments?.length).length,
      selectedStudents: rows.filter((r) => r.committee_decisions?.decision === "selected").length,
      ngoStudents: ngoRows.length,
      ngoMaleStudents: ngoRows.filter((r) => r.gender === "male").length,
      ngoFemaleStudents: ngoRows.filter((r) => r.gender === "female").length,
      nonNgoStudents: nonNgoRows.length,
      nonNgoMaleStudents: nonNgoRows.filter((r) => r.gender === "male").length,
      nonNgoFemaleStudents: nonNgoRows.filter((r) => r.gender === "female").length,
    };
  });
}

export type MapPartner = {
  id: string;
  name: string;
  provinceCode: string | null;
  lat: number | null;
  lng: number | null;
};

/** NGO and school partner pins for the map. Partners without a saved lat/lng
 * (the add-partner forms don't collect coordinates) fall back to their
 * province's marker position client-side — see CambodiaMap.tsx. */
export async function getMapPartners(): Promise<{ ngos: MapPartner[]; schools: MapPartner[] }> {
  const supabase = createClient();

  const [ngosRes, schoolsRes] = await Promise.all([
    supabase
      .from("ngo_partners")
      .select("id, organization_name, lat, lng, provinces(code)")
      .is("deleted_at", null),
    supabase
      .from("school_partners")
      .select("id, school_name, lat, lng, provinces(code)")
      .is("deleted_at", null),
  ]);

  if (ngosRes.error) throw ngosRes.error;
  if (schoolsRes.error) throw schoolsRes.error;

  const ngos = (
    (ngosRes.data ?? []) as unknown as {
      id: string;
      organization_name: string;
      lat: number | null;
      lng: number | null;
      provinces: { code: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.organization_name,
    provinceCode: row.provinces?.code ?? null,
    lat: row.lat,
    lng: row.lng,
  }));

  const schools = (
    (schoolsRes.data ?? []) as unknown as {
      id: string;
      school_name: string;
      lat: number | null;
      lng: number | null;
      provinces: { code: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.school_name,
    provinceCode: row.provinces?.code ?? null,
    lat: row.lat,
    lng: row.lng,
  }));

  return { ngos, schools };
}
