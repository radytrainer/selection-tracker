"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { listStudents, type StudentListItem } from "@/services/studentService";
import { listProvinces } from "@/services/lookupService";
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
import { STUDENT_STATUSES } from "@/lib/constants";

const PAGE_SIZE = 25;

export default function StudentsPage() {
  const [data, setData] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [provinceId, setProvinceId] = useState<string>("");
  const [provinces, setProvinces] = useState<{ id: string; name_en: string }[]>([]);

  useEffect(() => {
    listProvinces().then(setProvinces).catch(() => toast.error("Failed to load provinces"));
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listStudents({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        provinceId: provinceId || undefined,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, provinceId]);

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
              {(value: string) => value.replace(/_/g, " ")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STUDENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
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
              {(value: string) => provinces.find((p) => p.id === value)?.name_en}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
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
        />
      )}
    </div>
  );
}
