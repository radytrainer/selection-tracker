import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdminAuth, requireSuperAdmin, setUserClaims } from "@/lib/firebase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_ROLES } from "@/lib/constants";

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(APP_ROLES),
  ngoId: z.string().uuid().optional(),
});

/**
 * Admin-invite flow (docs/05-api-design.md §"Admin"): creates the Firebase
 * Auth user if needed, the matching `public.users`/`user_roles` rows, sets
 * the role/ngo_id custom claims Supabase RLS reads, and returns a password
 * reset link so the admin can hand it to the invitee (no email provider is
 * wired up yet — Google sign-in works immediately via email match either way).
 */
export async function POST(req: NextRequest) {
  const caller = await requireSuperAdmin(req);
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, fullName, role, ngoId } = parsed.data;

  if (role === "ngo_partner" && !ngoId) {
    return NextResponse.json({ error: "ngoId is required for the ngo_partner role" }, { status: 400 });
  }

  const auth = getFirebaseAdminAuth();
  let firebaseUser = await auth.getUserByEmail(email).catch(() => null);
  if (!firebaseUser) {
    firebaseUser = await auth.createUser({ email, displayName: fullName });
  }

  const supabase = createAdminClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .upsert(
      { firebase_uid: firebaseUser.uid, email, full_name: fullName, status: "invited" },
      { onConflict: "firebase_uid" },
    )
    .select("id")
    .single();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", role)
    .single();
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

  await supabase.from("user_roles").delete().eq("user_id", userRow.id);
  const { error: linkError } = await supabase
    .from("user_roles")
    .insert({ user_id: userRow.id, role_id: roleRow.id });
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  await supabase.from("user_ngo_link").delete().eq("user_id", userRow.id);
  if (role === "ngo_partner" && ngoId) {
    const { error: ngoLinkError } = await supabase
      .from("user_ngo_link")
      .insert({ user_id: userRow.id, ngo_id: ngoId });
    if (ngoLinkError) return NextResponse.json({ error: ngoLinkError.message }, { status: 500 });
  }

  await setUserClaims(firebaseUser.uid, { role, ngo_id: role === "ngo_partner" ? ngoId : null });

  const resetLink = await auth.generatePasswordResetLink(email).catch(() => null);

  return NextResponse.json({ ok: true, userId: userRow.id, resetLink });
}
