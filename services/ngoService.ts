import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type Ngo = Database["public"]["Tables"]["ngo_partners"]["Row"];
export type NgoInsert = Database["public"]["Tables"]["ngo_partners"]["Insert"];
export type NgoUpdate = Database["public"]["Tables"]["ngo_partners"]["Update"];
export type NgoProject = Database["public"]["Tables"]["ngo_projects"]["Row"];

export type NgoListItem = Ngo & {
  provinces: { name_en: string } | null;
};

export type NgoStats = {
  referred: number;
  selected: number;
  referredThisCycle: number;
};

export type NgoListItemWithStats = NgoListItem & NgoStats;

export type NgoDetail = Ngo & {
  provinces: { name_en: string } | null;
  ngo_projects: NgoProject[];
};

export async function listNgos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ngo_partners")
    .select("*, provinces(name_en)")
    .is("deleted_at", null)
    .order("organization_name");

  if (error) throw error;
  return data as unknown as NgoListItem[];
}

/** NGO list with referred/selected/this-cycle counts, aggregated client-side
 * from one students query (avoids N+1 per-row calls to getNgoPerformance). */
export async function listNgosWithStats(): Promise<NgoListItemWithStats[]> {
  const supabase = createClient();

  const [ngosRes, cycleRes, studentsRes] = await Promise.all([
    supabase.from("ngo_partners").select("*, provinces(name_en)").is("deleted_at", null).order("organization_name"),
    supabase.from("selection_cycles").select("id").eq("status", "active").maybeSingle(),
    supabase
      .from("students")
      .select("referred_by_ngo_id, cycle_id, committee_decisions(decision)")
      .not("referred_by_ngo_id", "is", null)
      .is("deleted_at", null),
  ]);

  if (ngosRes.error) throw ngosRes.error;
  if (cycleRes.error) throw cycleRes.error;
  if (studentsRes.error) throw studentsRes.error;

  const activeCycleId = cycleRes.data?.id ?? null;
  const rows = (studentsRes.data ?? []) as unknown as {
    referred_by_ngo_id: string;
    cycle_id: string;
    committee_decisions: { decision: string | null } | null;
  }[];

  const statsByNgo = new Map<string, NgoStats>();
  for (const row of rows) {
    const stats = statsByNgo.get(row.referred_by_ngo_id) ?? {
      referred: 0,
      selected: 0,
      referredThisCycle: 0,
    };
    stats.referred += 1;
    if (row.committee_decisions?.decision === "selected") stats.selected += 1;
    if (activeCycleId && row.cycle_id === activeCycleId) stats.referredThisCycle += 1;
    statsByNgo.set(row.referred_by_ngo_id, stats);
  }

  return ((ngosRes.data ?? []) as unknown as NgoListItem[]).map((ngo) => ({
    ...ngo,
    ...(statsByNgo.get(ngo.id) ?? { referred: 0, selected: 0, referredThisCycle: 0 }),
  }));
}

export async function getNgo(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ngo_partners")
    .select("*, provinces(name_en), ngo_projects(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data as unknown as NgoDetail;
}

export async function createNgo(input: NgoInsert) {
  const supabase = createClient();
  const { data, error } = await supabase.from("ngo_partners").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateNgo(id: string, input: NgoUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ngo_partners")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNgoOutreachStatus(id: string, outreachStatus: Ngo["outreach_status"]) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ngo_partners")
    .update({ outreach_status: outreachStatus, last_contacted_at: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteNgo(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ngo_partners")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Referred vs. selected counts for one NGO, all cycles combined (see docs/05-api-design.md §7). */
export async function getNgoPerformance(ngoId: string) {
  const supabase = createClient();
  const { count: referred, error: referredError } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_ngo_id", ngoId)
    .is("deleted_at", null);
  if (referredError) throw referredError;

  const { data: selectedRows, error: selectedError } = await supabase
    .from("students")
    .select("id, committee_decisions(decision)")
    .eq("referred_by_ngo_id", ngoId)
    .is("deleted_at", null);
  if (selectedError) throw selectedError;

  const rows = (selectedRows ?? []) as unknown as {
    committee_decisions: { decision: string | null } | null;
  }[];
  const selected = rows.filter((r) => r.committee_decisions?.decision === "selected").length;

  return { referred: referred ?? 0, selected };
}

export type NgoYearlyStat = {
  year: number;
  ngoId: string;
  ngoName: string;
  referred: number;
  selected: number;
};

/** Referred/selected counts per NGO per selection-cycle year, for the
 * dashboard's year-over-year referral chart (filterable by year/NGO there). */
export async function getNgoYearlyStats(): Promise<NgoYearlyStat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "referred_by_ngo_id, ngo_partners(organization_name), selection_cycles(year), committee_decisions(decision)",
    )
    .not("referred_by_ngo_id", "is", null)
    .is("deleted_at", null);
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    referred_by_ngo_id: string;
    ngo_partners: { organization_name: string } | null;
    selection_cycles: { year: number } | null;
    committee_decisions: { decision: string | null } | null;
  }[];

  const byKey = new Map<string, NgoYearlyStat>();
  for (const row of rows) {
    if (!row.selection_cycles) continue;
    const key = `${row.referred_by_ngo_id}-${row.selection_cycles.year}`;
    const stat = byKey.get(key) ?? {
      year: row.selection_cycles.year,
      ngoId: row.referred_by_ngo_id,
      ngoName: row.ngo_partners?.organization_name ?? "Unknown NGO",
      referred: 0,
      selected: 0,
    };
    stat.referred += 1;
    if (row.committee_decisions?.decision === "selected") stat.selected += 1;
    byKey.set(key, stat);
  }

  return Array.from(byKey.values()).sort((a, b) => a.year - b.year || a.ngoName.localeCompare(b.ngoName));
}

export async function createNgoProject(ngoId: string, name: string, description?: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ngo_projects")
    .insert({ ngo_id: ngoId, name, description: description || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}
