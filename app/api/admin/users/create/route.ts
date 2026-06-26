import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdminAuth, requireSuperAdmin, setUserClaims } from "@/lib/firebase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_ROLES } from "@/lib/constants";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(APP_ROLES),
  ngoId: z.string().uuid().optional(),
});

/**
 * Admin create-user flow: creates the Firebase Auth user with the password
 * the super admin sets (or updates it, if the email already exists), the
 * matching `public.users`/`user_roles` rows, and the role/ngo_id custom
 * claims Supabase RLS reads. The account is active immediately — no email
 * provider is wired up, so a reset-link handoff isn't a usable flow here.
 */
export async function POST(req: NextRequest) {
  const caller = await requireSuperAdmin(req);
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, password, fullName, role, ngoId } = parsed.data;

  if (role === "ngo_partner" && !ngoId) {
    return NextResponse.json({ error: "ngoId is required for the ngo_partner role" }, { status: 400 });
  }

  const auth = getFirebaseAdminAuth();
  let firebaseUser = await auth.getUserByEmail(email).catch(() => null);
  if (firebaseUser) {
    firebaseUser = await auth.updateUser(firebaseUser.uid, { password, displayName: fullName });
  } else {
    firebaseUser = await auth.createUser({ email, password, displayName: fullName });
  }

  const supabase = createAdminClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .upsert(
      { firebase_uid: firebaseUser.uid, email, full_name: fullName, status: "active" },
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

  return NextResponse.json({ ok: true, userId: userRow.id });
}
