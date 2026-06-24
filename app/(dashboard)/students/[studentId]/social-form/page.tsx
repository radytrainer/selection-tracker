"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getStudent, type StudentDetail } from "@/services/studentService";
import { getLatestSocialAssessment, saveSocialAssessment, type SocialAssessment } from "@/services/socialFormService";
import { SocialForm } from "@/components/forms/SocialForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { SocialFormValues } from "@/features/social-form/schema";

function toFormValues(row: SocialAssessment): Partial<SocialFormValues> {
  return {
    health_status: row.health_status ?? undefined,
    ok_to_join_training: row.ok_to_join_training ?? "",
    academic_rank: row.academic_rank ?? undefined,
    household_size_band: row.household_size_band ?? undefined,
    household_size_note: row.household_size_note ?? "",
    dependents_band: row.dependents_band ?? undefined,
    dependents_note: row.dependents_note ?? "",
    father_age: row.father_age != null ? String(row.father_age) : "",
    father_job: row.father_job ?? "",
    mother_age: row.mother_age != null ? String(row.mother_age) : "",
    mother_job: row.mother_job ?? "",
    parent_occupation_band: row.parent_occupation_band ?? undefined,
    house_owner: row.house_owner ?? "",
    housing_type_band: row.housing_type_band ?? undefined,
    house_status_band: row.house_status_band ?? undefined,
    water_access_band: row.water_access_band ?? undefined,
    electricity_access_band: row.electricity_access_band ?? undefined,
    assets_furniture: row.assets_furniture ?? 0,
    assets_transport: row.assets_transport ?? 0,
    assets_electronics: row.assets_electronics ?? 0,
    assets_livestock: row.assets_livestock ?? 0,
    income_band: row.income_band ?? undefined,
    income_note: row.income_note ?? "",
    expenses_band: row.expenses_band ?? undefined,
    expenses_note: row.expenses_note ?? "",
    education_support_band: row.education_support_band ?? undefined,
    education_support_note: row.education_support_note ?? "",
    father_education_band: row.father_education_band ?? undefined,
    mother_education_band: row.mother_education_band ?? undefined,
    school_aged_children_studying:
      row.school_aged_children_studying != null ? String(row.school_aged_children_studying) : "",
    school_aged_children_working:
      row.school_aged_children_working != null ? String(row.school_aged_children_working) : "",
    school_attendance_band: row.school_attendance_band ?? undefined,
    debt_band: row.debt_band ?? undefined,
    debt_amount: row.debt_amount ?? "",
    farm_land_band: row.farm_land_band ?? undefined,
    farm_income_band: row.farm_income_band ?? undefined,
    plantation_land_band: row.plantation_land_band ?? undefined,
    plantation_income_band: row.plantation_income_band ?? undefined,
    vulnerability_orphan_single_parent: row.vulnerability_orphan_single_parent,
    vulnerability_disability: row.vulnerability_disability,
    vulnerability_chronic_illness: row.vulnerability_chronic_illness,
    vulnerability_debt_burden: row.vulnerability_debt_burden,
    vulnerability_landless: row.vulnerability_landless,
    husbandry_band: row.husbandry_band ?? undefined,
    poverty_certificate: row.poverty_certificate ?? "",
    distance_from_town: row.distance_from_town ?? "",
    visitor_name: row.visitor_name ?? "",
    visitor_comments: row.visitor_comments ?? "",
  };
}

export default function SocialFormEntryPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [existing, setExisting] = useState<SocialAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudent(params.studentId), getLatestSocialAssessment(params.studentId)])
      .then(([studentData, assessment]) => {
        setStudent(studentData);
        setExisting(assessment);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load student"))
      .finally(() => setLoading(false));
  }, [params.studentId]);

  async function handleSubmit(values: SocialFormValues) {
    if (!student) return;
    try {
      await saveSocialAssessment({
        id: existing?.id,
        studentId: student.id,
        cycleId: student.cycle_id,
        visitNumber: existing?.visit_number ?? 1,
        currentStatus: student.status,
        health_status: values.health_status ?? null,
        ok_to_join_training: values.ok_to_join_training || null,
        academic_rank: values.academic_rank ?? null,
        household_size_band: values.household_size_band ?? null,
        household_size_note: values.household_size_note || null,
        dependents_band: values.dependents_band ?? null,
        dependents_note: values.dependents_note || null,
        father_age: values.father_age ? Number(values.father_age) : null,
        father_job: values.father_job || null,
        mother_age: values.mother_age ? Number(values.mother_age) : null,
        mother_job: values.mother_job || null,
        parent_occupation_band: values.parent_occupation_band ?? null,
        house_owner: values.house_owner || null,
        housing_type_band: values.housing_type_band ?? null,
        house_status_band: values.house_status_band ?? null,
        water_access_band: values.water_access_band ?? null,
        electricity_access_band: values.electricity_access_band ?? null,
        assets_furniture: values.assets_furniture,
        assets_transport: values.assets_transport,
        assets_electronics: values.assets_electronics,
        assets_livestock: values.assets_livestock,
        income_band: values.income_band ?? null,
        income_note: values.income_note || null,
        expenses_band: values.expenses_band ?? null,
        expenses_note: values.expenses_note || null,
        education_support_band: values.education_support_band ?? null,
        education_support_note: values.education_support_note || null,
        father_education_band: values.father_education_band ?? null,
        mother_education_band: values.mother_education_band ?? null,
        school_aged_children_studying: values.school_aged_children_studying
          ? Number(values.school_aged_children_studying)
          : null,
        school_aged_children_working: values.school_aged_children_working
          ? Number(values.school_aged_children_working)
          : null,
        school_attendance_band: values.school_attendance_band ?? null,
        debt_band: values.debt_band ?? null,
        debt_amount: values.debt_amount || null,
        farm_land_band: values.farm_land_band ?? null,
        farm_income_band: values.farm_income_band ?? null,
        plantation_land_band: values.plantation_land_band ?? null,
        plantation_income_band: values.plantation_income_band ?? null,
        vulnerability_orphan_single_parent: values.vulnerability_orphan_single_parent,
        vulnerability_disability: values.vulnerability_disability,
        vulnerability_chronic_illness: values.vulnerability_chronic_illness,
        vulnerability_debt_burden: values.vulnerability_debt_burden,
        vulnerability_landless: values.vulnerability_landless,
        husbandry_band: values.husbandry_band ?? null,
        poverty_certificate: values.poverty_certificate || null,
        distance_from_town: values.distance_from_town || null,
        visitor_name: values.visitor_name || null,
        visitor_comments: values.visitor_comments || null,
      });
      toast.success("Social form saved");
      router.push(`/students/${student.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save social form");
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return <p className="text-sm text-muted-foreground">Student not found.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Social Form — {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.student_code} · Home Visit #{existing?.visit_number ?? 1}
        </p>
      </div>
      <SocialForm studentId={student.id} defaultValues={existing ? toFormValues(existing) : undefined} onSubmit={handleSubmit} />
    </div>
  );
}
