"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Gavel, HeartHandshake, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RoleGate } from "@/components/layout/RoleGate";
import { softDeleteStudent, type StudentListItem } from "@/services/studentService";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  registered: "outline",
  exam_completed: "secondary",
  interview_completed: "secondary",
  home_visit_completed: "secondary",
  committee_review: "secondary",
  selected: "default",
  waitlisted: "outline",
  rejected: "destructive",
  eliminated: "destructive",
  dropped_out: "destructive",
};

export function getStudentColumns(onChanged: () => void): ColumnDef<StudentListItem>[] {
  return [
    {
      accessorKey: "student_code",
      header: "Code",
      cell: ({ row }) => (
        <Link href={`/students/${row.original.id}`} className="font-medium hover:underline">
          {row.original.student_code}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <span className="capitalize">{row.original.gender}</span>,
    },
    {
      id: "province",
      header: "Province",
      cell: ({ row }) => row.original.provinces?.name_en ?? "—",
    },
    {
      id: "school",
      header: "School",
      cell: ({ row }) => row.original.school_partners?.school_name ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {row.original.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "poor_level",
      header: "Poor Level",
      cell: ({ row }) => row.original.committee_decisions?.poor_level ?? "—",
    },
    {
      id: "ngo",
      header: "NGO",
      cell: ({ row }) => row.original.ngo_partners?.organization_name ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={`/students/${row.original.id}/social-form`}
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                />
              }
            >
              <HeartHandshake className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Social Form</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={`/committee/${row.original.id}`}
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                />
              }
            >
              <Gavel className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Committee</TooltipContent>
          </Tooltip>
          <RoleGate capability="createEditStudents">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem render={<Link href={`/students/${row.original.id}/edit`} />}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Delete ${row.original.first_name} ${row.original.last_name} (${row.original.student_code})? This can be restored by an admin later.`,
                      )
                    ) {
                      return;
                    }
                    try {
                      await softDeleteStudent(row.original.id);
                      toast.success("Student deleted");
                      onChanged();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to delete student");
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleGate>
        </div>
      ),
    },
  ];
}
