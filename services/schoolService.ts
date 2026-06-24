import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type School = Database["public"]["Tables"]["school_partners"]["Row"];
export type SchoolInsert = Database["public"]["Tables"]["school_partners"]["Insert"];
export type SchoolUpdate = Database["public"]["Tables"]["school_partners"]["Update"];

export type SchoolListItem = School & {
  provinces: { name_en: string } | null;
};

export type SchoolStats = {
  referred: number;
  selected: number;
  referredThisCycle: number;
};

export type SchoolListItemWithStats = SchoolListItem & SchoolStats;

export type SchoolDetail = School & {
  provinces: { name_en: string } | null;
};

export async function listSchoolPartners() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("school_partners")
    .select("*, provinces(name_en)")
    .is("deleted_at", null)
    .order("school_name");

  if (error) throw error;
  return data as unknown as SchoolListItem[];
}

/** School list with referred/selected/this-cycle counts, aggregated client-side
 * from one students query (avoids N+1 per-row calls to getSchoolPerformance). */
export async function listSchoolPartnersWithStats(): Promise<SchoolListItemWithStats[]> {
  const supabase = createClient();

  const [schoolsRes, cycleRes, studentsRes] = await Promise.all([
    supabase.from("school_partners").select("*, provinces(name_en)").is("deleted_at", null).order("school_name"),
    supabase.from("selection_cycles").select("id").eq("status", "active").maybeSingle(),
    supabase
      .from("students")
      .select("school_id, cycle_id, committee_decisions(decision)")
      .not("school_id", "is", null)
      .is("deleted_at", null),
  ]);

  if (schoolsRes.error) throw schoolsRes.error;
  if (cycleRes.error) throw cycleRes.error;
  if (studentsRes.error) throw studentsRes.error;

  const activeCycleId = cycleRes.data?.id ?? null;
  const rows = (studentsRes.data ?? []) as unknown as {
    school_id: string;
    cycle_id: string;
    committee_decisions: { decision: string | null } | null;
  }[];

  const statsBySchool = new Map<string, SchoolStats>();
  for (const row of rows) {
    const stats = statsBySchool.get(row.school_id) ?? {
      referred: 0,
      selected: 0,
      referredThisCycle: 0,
    };
    stats.referred += 1;
    if (row.committee_decisions?.decision === "selected") stats.selected += 1;
    if (activeCycleId && row.cycle_id === activeCycleId) stats.referredThisCycle += 1;
    statsBySchool.set(row.school_id, stats);
  }

  return ((schoolsRes.data ?? []) as unknown as SchoolListItem[]).map((school) => ({
    ...school,
    ...(statsBySchool.get(school.id) ?? { referred: 0, selected: 0, referredThisCycle: 0 }),
  }));
}

export async function updateSchoolOutreachStatus(id: string, outreachStatus: School["outreach_status"]) {
  const supabase = createClient();
  const { error } = await supabase
    .from("school_partners")
    .update({ outreach_status: outreachStatus, last_contacted_at: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw error;
}

export async function getSchoolPartner(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("school_partners")
    .select("*, provinces(name_en)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data as unknown as SchoolDetail;
}

export async function createSchoolPartner(input: SchoolInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("school_partners")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSchoolPartner(id: string, input: SchoolUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("school_partners")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteSchoolPartner(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("school_partners")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Referred vs. selected counts for one school (see docs/05-api-design.md §7). */
export async function getSchoolPerformance(schoolId: string) {
  const supabase = createClient();
  const { count: referred, error: referredError } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .is("deleted_at", null);
  if (referredError) throw referredError;

  const { data: selectedRows, error: selectedError } = await supabase
    .from("students")
    .select("id, committee_decisions(decision)")
    .eq("school_id", schoolId)
    .is("deleted_at", null);
  if (selectedError) throw selectedError;

  const rows = (selectedRows ?? []) as unknown as {
    committee_decisions: { decision: string | null } | null;
  }[];
  const selected = rows.filter((r) => r.committee_decisions?.decision === "selected").length;

  return { referred: referred ?? 0, selected };
}
