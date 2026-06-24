import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/firebase/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const caller = await requireSuperAdmin(req);
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      // user_roles has two FKs to users (user_id and granted_by), so the
      // embed must name the constraint explicitly — PostgREST otherwise
      // rejects the query with a 300 "more than one relationship" error.
      "id, email, full_name, status, created_at, user_roles!user_roles_user_id_fkey(roles(name))",
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (
    (data ?? []) as unknown as {
      id: string;
      email: string;
      full_name: string;
      status: string;
      created_at: string;
      user_roles: { roles: { name: string } | null }[];
    }[]
  ).map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    status: u.status,
    created_at: u.created_at,
    role: u.user_roles[0]?.roles?.name ?? null,
  }));

  return NextResponse.json({ users });
}
