import "server-only";
import type { NextRequest } from "next/server";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ID_TOKEN_COOKIE } from "@/lib/constants";

function getFirebaseAdminApp() {
  if (getApps().length) return getApp();

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

/**
 * Sets the role/ngo_id custom claims on a Firebase user. Must be called
 * whenever an admin assigns/changes a user_roles or user_ngo_link row, since
 * Supabase RLS reads these claims directly from the verified Firebase ID
 * token (Third-Party Auth) — see docs/09-security.md.
 *
 * Stored under `app_role`, NOT `role`: Supabase's Data API reserves a JWT
 * claim literally named `role` to mean "switch to this Postgres database
 * role" (PGRST does `SET ROLE <claim value>`). Our app-level role strings
 * (`super_admin`, `ngo_partner`, ...) aren't Postgres roles, so a `role`
 * claim makes every request fail with `role "<value>" does not exist`.
 */
export async function setUserClaims(
  firebaseUid: string,
  claims: { role: string; ngo_id?: string | null },
) {
  await getFirebaseAdminAuth().setCustomUserClaims(firebaseUid, {
    app_role: claims.role,
    ngo_id: claims.ngo_id,
  });
}

/** Verifies the caller's session cookie. Returns the decoded token (with its
 * `app_role`/`ngo_id` custom claims), or null if missing/invalid/expired. */
export async function requireUser(req: NextRequest) {
  const idToken = req.cookies.get(ID_TOKEN_COOKIE)?.value;
  if (!idToken) return null;

  try {
    return await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}

/**
 * Verifies the caller's session cookie and requires the `super_admin` role
 * claim — the server-side check for admin-only Route Handlers (e.g. user
 * invites). Returns the decoded token, or null if unauthenticated/unauthorized.
 */
export async function requireSuperAdmin(req: NextRequest) {
  const decoded = await requireUser(req);
  if (!decoded || decoded.app_role !== "super_admin") return null;
  return decoded;
}
