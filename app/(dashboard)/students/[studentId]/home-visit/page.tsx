"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getStudent, type StudentDetail } from "@/services/studentService";
import { createHomeVisit } from "@/services/homeVisitService";
import { HomeVisitForm } from "@/components/forms/HomeVisitForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeVisitFormValues } from "@/features/home-visit/schema";

export default function HomeVisitEntryPage() {
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

  async function handleSubmit(values: HomeVisitFormValues) {
    if (!student) return;
    try {
      await createHomeVisit({
        studentId: student.id,
        cycleId: student.cycle_id,
        currentStatus: student.status,
        houseType: values.house_type || null,
        familyIncome: values.family_income ? Number(values.family_income) : null,
        transportation: values.transportation || null,
        electricityAccess: values.electricity_access,
        internetAccess: values.internet_access,
        familyConditionNotes: values.family_condition_notes || null,
        recommendation: values.recommendation,
      });
      toast.success("Home visit saved");
      router.push(`/students/${student.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save home visit");
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
          Home Visit — {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.student_code} · Visit #{student.home_visits.length + 1}
        </p>
      </div>
      <HomeVisitForm onSubmit={handleSubmit} />
    </div>
  );
}
