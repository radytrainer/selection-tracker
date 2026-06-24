import { createClient } from "@/lib/supabase/client";

export async function listProvinces() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("provinces")
    .select("id, name_en, name_kh, code")
    .order("name_en");
  if (error) throw error;
  return data;
}

export async function listSchools() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("school_partners")
    .select("id, school_name")
    .is("deleted_at", null)
    .order("school_name");
  if (error) throw error;
  return data;
}

export async function listCycles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("selection_cycles")
    .select("id, year, name, status")
    .order("year", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveCycle() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("selection_cycles")
    .select("id, year, name, status")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
