"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Gavel, HeartHandshake, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RoleGate } from "@/components/layout/RoleGate";
import { can } from "@/lib/rbac";
import { POOR_LEVEL_BADGE_CLASSES, STUDENT_STATUS_BADGE_CLASSES, type AppRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { softDeleteStudent, type StudentListItem } from "@/services/studentService";
import { sendToCommittee } from "@/services/committeeService";

/** Committee isn't relevant until the home visit (social form) is done — these statuses come before it. */
const PRE_HOME_VISIT_STATUSES = new Set(["registered", "exam_completed", "interview_completed"]);

export function getStudentColumns(
  onChanged: () => void,
  role: AppRole | null,
  currentUserId: string | null,
): ColumnDef<StudentListItem>[] {
  return [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/students/${row.original.id}`} className="font-medium hover:underline">
            {row.original.first_name} {row.original.last_name}
          </Link>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={`/students/${row.original.id}/social-form`}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-600 transition-colors hover:bg-pink-100"
                />
              }
            >
              <HeartHandshake className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Social Form</TooltipContent>
          </Tooltip>
          {!PRE_HOME_VISIT_STATUSES.has(row.original.status) && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={`/committee/${row.original.id}`}
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
                  />
                }
              >
                <Gavel className="size-3" />
              </TooltipTrigger>
              <TooltipContent>Committee</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
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
      id: "home_visitor",
      header: "Home Visitor",
      cell: ({ row }) => {
        const visits = row.original.social_assessments;
        if (visits.length === 0) return "---";
        const latest = visits.reduce((a, b) => (b.visit_number > a.visit_number ? b : a));
        return latest.visitor_name || "---";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(STUDENT_STATUS_BADGE_CLASSES[row.original.status] ?? "bg-muted text-muted-foreground")}
        >
          {row.original.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "poor_level",
      header: "Poor Level",
      cell: ({ row }) => {
        const poorLevel = row.original.committee_decisions?.poor_level;
        if (!poorLevel) return "—";
        return <Badge className={cn(POOR_LEVEL_BADGE_CLASSES[poorLevel])}>{poorLevel}</Badge>;
      },
    },
    {
      id: "ngo",
      header: "NGO",
      cell: ({ row }) => row.original.ngo_partners?.organization_name ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        // home_visit_team only gets the button on cases where they're the
        // one who recorded the social form (see migration 0026) — other
        // roles with the capability can send any case.
        const canSendThisOne =
          can(role, "sendToCommittee") &&
          (role !== "home_visit_team" ||
            row.original.social_assessments.some((sa) => sa.visitor_id === currentUserId));

        return (
          <div className="flex items-center gap-1">
            {row.original.status !== "registered" && canSendThisOne && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Send ${row.original.first_name} ${row.original.last_name} to the committee?`,
                          )
                        ) {
                          return;
                        }
                        try {
                          await sendToCommittee(row.original.id);
                          toast.success("Sent to committee");
                          onChanged();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to send to committee");
                        }
                      }}
                    />
                  }
                >
                  <Send className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Send to Committee</TooltipContent>
              </Tooltip>
            )}
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
        );
      },
    },
  ];
}
