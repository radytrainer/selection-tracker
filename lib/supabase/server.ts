import "server-only";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ID_TOKEN_COOKIE } from "@/lib/constants";
import type { Database } from "@/types/database.types";

/**
 * Server Component / Route Handler Supabase client. Reads the Firebase ID
 * token forwarded by the client to /api/auth/session (stored as an
 * HTTP-only cookie) and attaches it via the same Third-Party Auth
 * `accessToken` hook used on the browser client.
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ID_TOKEN_COOKIE)?.value ?? null;

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => token,
    },
  );
}
