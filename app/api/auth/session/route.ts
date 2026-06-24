import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { ID_TOKEN_COOKIE } from "@/lib/constants";

/**
 * Mirrors the client's current Firebase ID token into an HTTP-only cookie so
 * Server Components / Route Handlers can build a Supabase client with the
 * same Third-Party Auth token (see docs/02-architecture.md §3). Called on
 * login and on every Firebase token refresh via useAuth().
 */
export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);

    const res = NextResponse.json({ uid: decoded.uid });
    res.cookies.set(ID_TOKEN_COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Firebase ID tokens expire after 1h; refresh the cookie before that.
      maxAge: 60 * 55,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ID_TOKEN_COOKIE);
  return res;
}
