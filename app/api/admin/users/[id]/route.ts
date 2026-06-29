import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth, requireSuperAdmin, setUserClaims } from "@/lib/firebase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserSchema } from "@/features/admin/schema";

/**
 * Admin edit-user flow: corrects email/name/role/ngo on an existing user, and
 * resets the password only if one was provided. Mirrors the create route's
 * Firebase + Supabase write order, but looks the account up by Supabase id
 * (the create route looks it up by email, since the email itself is what
 * might be wrong here).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSuperAdmin(req);
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, password, fullName, role, ngoId } = parsed.data;

  if (role === "ngo_partner" && !ngoId) {
    return NextResponse.json({ error: "ngoId is required for the ngo_partner role" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("firebase_uid")
    .eq("id", id)
    .single();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 404 });

  const auth = getFirebaseAdminAuth();
  try {
    await auth.updateUser(existing.firebase_uid, {
      email,
      displayName: fullName,
      ...(password ? { password } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update Firebase user" },
      { status: 400 },
    );
  }

  const { error: userError } = await supabase
    .from("users")
    .update({ email, full_name: fullName })
    .eq("id", id);
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", role)
    .single();
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

  await supabase.from("user_roles").delete().eq("user_id", id);
  const { error: linkError } = await supabase
    .from("user_roles")
    .insert({ user_id: id, role_id: roleRow.id });
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  await supabase.from("user_ngo_link").delete().eq("user_id", id);
  if (role === "ngo_partner" && ngoId) {
    const { error: ngoLinkError } = await supabase
      .from("user_ngo_link")
      .insert({ user_id: id, ngo_id: ngoId });
    if (ngoLinkError) return NextResponse.json({ error: ngoLinkError.message }, { status: 500 });
  }

  await setUserClaims(existing.firebase_uid, { role, ngo_id: role === "ngo_partner" ? ngoId : null });

  return NextResponse.json({ ok: true });
}
