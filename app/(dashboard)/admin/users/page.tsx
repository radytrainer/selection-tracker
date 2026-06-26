"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { CreateUserForm } from "@/components/forms/CreateUserForm";
import type { CreateUserValues } from "@/features/admin/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
  role: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return fetch("/api/admin/users")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load users");
        setUsers(body.users);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: CreateUserValues) {
    const res = await fetch("/api/admin/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to create user");

    toast.success(`${values.fullName} created`);
    setCreateOpen(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage user accounts and roles.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" />
          Create User
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.role ? <Badge variant="outline">{u.role.replace(/_/g, " ")}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="capitalize">{u.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <CreateUserForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
