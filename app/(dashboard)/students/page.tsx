"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { listStudents, type StudentListItem } from "@/services/studentService";
import { listProvinces } from "@/services/lookupService";
import { getMyProfile } from "@/services/userService";
import { StudentsTable } from "@/components/tables/StudentsTable";
import { StudentImportDialog } from "@/components/forms/StudentImportDialog";
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
import { useRole } from "@/hooks/useRole";
import { POOR_LEVELS, STUDENT_STATUSES } from "@/lib/constants";

const PAGE_SIZE = 25;

export default function StudentsPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [data, setData] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [poorLevel, setPoorLevel] = useState<string>("");
  const [provinceId, setProvinceId] = useState<string>("");
  const [provinces, setProvinces] = useState<{ id: string; name_en: string }[]>([]);

  useEffect(() => {
    listProvinces().then(setProvinces).catch(() => toast.error("Failed to load provinces"));
  }, []);

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
        poorLevel: poorLevel || undefined,
        provinceId: provinceId || undefined,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, poorLevel, provinceId]);

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
          <div className="flex gap-2">
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
          value={poorLevel}
          onValueChange={(value) => {
            setPage(1);
            setPoorLevel(value ?? "");
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Poor Levels">
              {(value: string) => (value ? value : "All Poor Levels")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Poor Levels</SelectItem>
            {POOR_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
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
              {(value: string) => (value ? provinces.find((p) => p.id === value)?.name_en : "All provinces")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All provinces</SelectItem>
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
