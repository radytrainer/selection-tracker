import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export type StudentListItem = Student & {
  provinces: { name_en: string } | null;
  school_partners: { school_name: string } | null;
  ngo_partners: { organization_name: string } | null;
};

type ExamResult = Database["public"]["Tables"]["exam_results"]["Row"];
type Interview = Database["public"]["Tables"]["interviews"]["Row"];
type SocialAssessment = Database["public"]["Tables"]["social_assessments"]["Row"];
type CommitteeDecision = Database["public"]["Tables"]["committee_decisions"]["Row"];
type StudentDocument = Pick<
  Database["public"]["Tables"]["student_documents"]["Row"],
  "doc_type" | "file_path" | "uploaded_at"
>;

export type StudentDetail = Student & {
  provinces: { name_en: string } | null;
  school_partners: { school_name: string } | null;
  // exam_results/interviews/committee_decisions all have a `unique`
  // constraint on student_id, so PostgREST embeds them as a single to-one
  // object (or null) rather than an array. social_assessments/
  // student_documents have no such constraint, so they stay arrays.
  exam_results: ExamResult | null;
  interviews: Interview | null;
  social_assessments: SocialAssessment[];
  student_documents: StudentDocument[];
  committee_decisions: CommitteeDecision | null;
};

export type StudentFilters = {
  cycleId?: string;
  provinceId?: string;
  status?: string;
  gender?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

const STUDENT_LIST_SELECT =
  "*, provinces(name_en), school_partners(school_name), ngo_partners(organization_name)";

export async function listStudents(filters: StudentFilters) {
  const supabase = createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("students")
    .select(STUDENT_LIST_SELECT, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.cycleId) query = query.eq("cycle_id", filters.cycleId);
  if (filters.provinceId) query = query.eq("province_id", filters.provinceId);
  if (filters.status) query = query.eq("status", filters.status as Student["status"]);
  if (filters.gender) query = query.eq("gender", filters.gender as Student["gender"]);
  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,student_code.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data ?? []) as unknown as StudentListItem[], total: count ?? 0, page, pageSize };
}

export async function getStudent(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "*, provinces(name_en), school_partners(school_name), exam_results(*), interviews(*), social_assessments(*), student_documents(doc_type, file_path, uploaded_at), committee_decisions(*)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data as unknown as StudentDetail;
}

export async function createStudent(input: StudentInsert) {
  const supabase = createClient();
  const { data, error } = await supabase.from("students").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id: string, input: StudentUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteStudent(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Generates the next sequential student code for a cycle, e.g. SST-2026-000123. */
export async function generateStudentCode(cycleYear: number) {
  const supabase = createClient();
  const prefix = `SST-${cycleYear}-`;
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .like("student_code", `${prefix}%`);

  if (error) throw error;
  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
}
