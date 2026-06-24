import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { Database } from "@/types/database.types";

/**
 * Browser Supabase client. Uses Supabase's Third-Party Auth `accessToken`
 * hook to attach the caller's current Firebase ID token on every request —
 * Supabase verifies it directly via Firebase's JWKS, no Supabase session or
 * custom-minted JWT involved. See docs/02-architecture.md §3.
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        const user = getFirebaseAuth().currentUser;
        return user ? await user.getIdToken() : null;
      },
    },
  );
}
