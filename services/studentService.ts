import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export type StudentListItem = Student & {
  provinces: { name_en: string } | null;
  school_partners: { school_name: string } | null;
  ngo_partners: { organization_name: string } | null;
  committee_decisions: { decision: string | null; poor_level: string | null } | null;
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
  poorLevel?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

const STUDENT_LIST_SELECT =
  "*, provinces(name_en), school_partners(school_name), ngo_partners(organization_name), committee_decisions(decision, poor_level)";
// Filtering on an embedded table's column requires an inner join (PostgREST)
// — only switch to it when poorLevel is actually filtered, otherwise this
// embed must stay a left join so students with no decision yet still show.
const STUDENT_LIST_SELECT_POOR_LEVEL =
  "*, provinces(name_en), school_partners(school_name), ngo_partners(organization_name), committee_decisions!inner(decision, poor_level)";

export async function listStudents(filters: StudentFilters) {
  const supabase = createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("students")
    .select(filters.poorLevel ? STUDENT_LIST_SELECT_POOR_LEVEL : STUDENT_LIST_SELECT, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.cycleId) query = query.eq("cycle_id", filters.cycleId);
  if (filters.provinceId) query = query.eq("province_id", filters.provinceId);
  if (filters.status) query = query.eq("status", filters.status as Student["status"]);
  if (filters.gender) query = query.eq("gender", filters.gender as Student["gender"]);
  if (filters.poorLevel) {
    query = query.eq(
      "committee_decisions.poor_level",
      filters.poorLevel as NonNullable<Database["public"]["Tables"]["committee_decisions"]["Row"]["poor_level"]>,
    );
  }
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

export class DuplicateStudentError extends Error {
  constructor(public existing: { id: string; student_code: string; first_name: string; last_name: string }) {
    super(
      `This looks like a duplicate of ${existing.first_name} ${existing.last_name} (${existing.student_code}) — every field matches an existing student.`,
    );
    this.name = "DuplicateStudentError";
  }
}

/**
 * Same name alone isn't suspicious (common in Cambodia), so this only flags
 * a duplicate when every other identifying/demographic field also matches
 * an existing, non-deleted student — administrative fields (school,
 * referral, exam center, etc.) included, per the literal "all information
 * the same" bar. excludeId lets editing a student skip matching itself.
 */
async function findDuplicateStudent(input: Partial<StudentInsert>, excludeId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("students")
    .select("id, student_code, first_name, last_name")
    .is("deleted_at", null)
    .ilike("first_name", (input.first_name ?? "").trim())
    .ilike("last_name", (input.last_name ?? "").trim());

  query = input.gender ? query.eq("gender", input.gender) : query;
  query = input.dob ? query.eq("dob", input.dob) : query.is("dob", null);
  query = input.phone ? query.eq("phone", input.phone) : query.is("phone", null);
  query = input.province_id ? query.eq("province_id", input.province_id) : query.is("province_id", null);
  query = input.district_name ? query.eq("district_name", input.district_name) : query.is("district_name", null);
  query = input.commune_name ? query.eq("commune_name", input.commune_name) : query.is("commune_name", null);
  query = input.village_name ? query.eq("village_name", input.village_name) : query.is("village_name", null);
  query = input.school_id ? query.eq("school_id", input.school_id) : query.is("school_id", null);
  query = input.referred_by_ngo_id
    ? query.eq("referred_by_ngo_id", input.referred_by_ngo_id)
    : query.is("referred_by_ngo_id", null);
  query = input.information_session
    ? query.eq("information_session", input.information_session)
    : query.is("information_session", null);
  query = input.exam_center ? query.eq("exam_center", input.exam_center) : query.is("exam_center", null);
  query = input.father_name ? query.eq("father_name", input.father_name) : query.is("father_name", null);
  query = input.mother_name ? query.eq("mother_name", input.mother_name) : query.is("mother_name", null);
  query = input.parent_occupation
    ? query.eq("parent_occupation", input.parent_occupation)
    : query.is("parent_occupation", null);
  query =
    input.family_income_monthly != null
      ? query.eq("family_income_monthly", input.family_income_monthly)
      : query.is("family_income_monthly", null);
  query = input.siblings_count != null ? query.eq("siblings_count", input.siblings_count) : query.is("siblings_count", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createStudent(input: StudentInsert) {
  if (input.first_name && input.last_name) {
    const duplicate = await findDuplicateStudent(input);
    if (duplicate) throw new DuplicateStudentError(duplicate);
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("students").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id: string, input: StudentUpdate) {
  if (input.first_name && input.last_name) {
    const duplicate = await findDuplicateStudent(input, id);
    if (duplicate) throw new DuplicateStudentError(duplicate);
  }

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

/** Generates the next sequential student code for a cycle, e.g. ST-26-0123. */
export async function generateStudentCode(cycleYear: number) {
  const supabase = createClient();
  const shortYear = String(cycleYear).slice(-2);
  const prefix = `ST-${shortYear}-`;
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .like("student_code", `${prefix}%`);

  if (error) throw error;
  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
