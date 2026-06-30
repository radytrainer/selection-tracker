"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { listStudents, listHomeVisitors, type StudentListItem } from "@/services/studentService";
import { listProvinces } from "@/services/lookupService";
import { getMyProfile } from "@/services/userService";
import { StudentsTable } from "@/components/tables/StudentsTable";
import { StudentImportDialog } from "@/components/forms/StudentImportDialog";
import { CycleSelect } from "@/components/forms/CycleSelect";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGate } from "@/components/layout/RoleGate";
import { useAuth } from "@/hooks/useAuth";
import { useCycleFilter } from "@/hooks/useCycleFilter";
import { useRole } from "@/hooks/useRole";
import { STUDENT_STATUSES } from "@/lib/constants";

const PAGE_SIZE = 25;

export default function StudentsPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const { cycles, cycleId, setCycleId } = useCycleFilter();
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [data, setData] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [homeVisitor, setHomeVisitor] = useState<string>("");
  const [provinceId, setProvinceId] = useState<string>("");
  const [provinces, setProvinces] = useState<{ id: string; name_en: string }[]>([]);
  const [homeVisitors, setHomeVisitors] = useState<string[]>([]);

  useEffect(() => {
    listProvinces().then(setProvinces).catch(() => toast.error("Failed to load provinces"));
  }, []);

  useEffect(() => {
    listHomeVisitors(cycleId || undefined)
      .then(setHomeVisitors)
      .catch(() => {});
  }, [cycleId]);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user.uid).then((profile) => setMyUserId(profile?.id ?? null));
  }, [user]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listStudents({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        homeVisitor: homeVisitor || undefined,
        provinceId: provinceId || undefined,
        cycleId: cycleId || undefined,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, homeVisitor, provinceId, cycleId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">
            All students across the active selection pipeline.
          </p>
        </div>
        <RoleGate capability="createEditStudents">
          <div className="flex items-center gap-2">
            <CycleSelect
              cycles={cycles}
              value={cycleId}
              allowAll
              className="w-48"
              onChange={(value) => {
                setPage(1);
                setHomeVisitor("");
                setCycleId(value);
              }}
            />
            <StudentImportDialog onImported={fetchStudents} />
            <Link href="/students/new" className={buttonVariants()}>
              New Student
            </Link>
          </div>
        </RoleGate>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name or code..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1);
            setStatus(value ?? "");
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses">
              {(value: string) => (value ? value.replace(/_/g, " ") : "All statuses")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {STUDENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={homeVisitor}
          onValueChange={(value) => {
            setPage(1);
            setHomeVisitor(value ?? "");
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All visitors">
              {(value: string) => value || "All visitors"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All visitors</SelectItem>
            {homeVisitors.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={provinceId}
          onValueChange={(value) => {
            setPage(1);
            setProvinceId(value ?? "");
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All provinces">
              {(value: string) => {
                if (!value) return "All provinces";
                if (value === "__none__") return "No province";
                return provinces.find((p) => p.id === value)?.name_en ?? "All provinces";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All provinces</SelectItem>
            <SelectItem value="__none__">No province set</SelectItem>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading students...</p>
      ) : (
        <StudentsTable
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          onChanged={fetchStudents}
          role={role}
          currentUserId={myUserId}
        />
      )}
    </div>
  );
}
