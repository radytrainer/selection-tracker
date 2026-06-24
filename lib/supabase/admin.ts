import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client — bypasses RLS entirely. Server-only
 * (Route Handlers / Edge Functions), never imported from a Client Component.
 * Use for admin operations (user invites, hard-delete erasure requests,
 * signed URL generation after a manual permission check).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
