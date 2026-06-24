"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { StudentForm } from "@/components/forms/StudentForm";
import { getStudent, updateStudent, type StudentDetail } from "@/services/studentService";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentFormValues } from "@/features/students/schema";

export default function EditStudentPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudent(params.studentId)
      .then(setStudent)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load student"))
      .finally(() => setLoading(false));
  }, [params.studentId]);

  async function handleSubmit(values: StudentFormValues) {
    await updateStudent(params.studentId, {
      first_name: values.first_name,
      last_name: values.last_name,
      gender: values.gender,
      dob: values.dob,
      phone: values.phone || null,
      province_id: values.province_id || null,
      district_name: values.district_name || null,
      commune_name: values.commune_name || null,
      village_name: values.village_name || null,
      school_id: values.school_id || null,
      referred_by_ngo_id: values.referred_by_ngo_id || null,
      grade: values.grade || null,
      gpa: values.gpa ? Number(values.gpa) : null,
      english_level: values.english_level ?? null,
      father_name: values.father_name || null,
      mother_name: values.mother_name || null,
      parent_occupation: values.parent_occupation || null,
      family_income_monthly: values.family_income_monthly
        ? Number(values.family_income_monthly)
        : null,
      siblings_count: values.siblings_count ? Number(values.siblings_count) : null,
    });

    toast.success("Student updated");
    router.push(`/students/${params.studentId}`);
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return <p className="text-sm text-muted-foreground">Student not found.</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Edit {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">{student.student_code}</p>
      </div>
      <StudentForm
        defaultValues={{
          first_name: student.first_name,
          last_name: student.last_name,
          gender: student.gender,
          dob: student.dob,
          phone: student.phone ?? "",
          province_id: student.province_id ?? "",
          district_name: student.district_name ?? "",
          commune_name: student.commune_name ?? "",
          village_name: student.village_name ?? "",
          school_id: student.school_id ?? "",
          referred_by_ngo_id: student.referred_by_ngo_id ?? "",
          grade: student.grade ?? "",
          gpa: student.gpa != null ? String(student.gpa) : "",
          english_level: student.english_level ?? undefined,
          father_name: student.father_name ?? "",
          mother_name: student.mother_name ?? "",
          parent_occupation: student.parent_occupation ?? "",
          family_income_monthly:
            student.family_income_monthly != null ? String(student.family_income_monthly) : "",
          siblings_count: student.siblings_count != null ? String(student.siblings_count) : "",
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}
